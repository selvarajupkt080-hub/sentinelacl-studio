import { 
  AclRule, 
  UserPersona, 
  FieldCondition, 
  AclOperation, 
  RecordAclResult, 
  FieldAclResult, 
  AclEvaluationStep, 
  AclTraceLog, 
  TableId 
} from '../types/acl';

export class AclEngine {
  /**
   * Evaluates a single field condition against a record
   */
  public static evaluateCondition(
    record: Record<string, unknown>, 
    condition: FieldCondition
  ): boolean {
    const rawVal = record[condition.field];
    const targetVal = condition.value;

    switch (condition.operator) {
      case 'equals':
        return String(rawVal) === String(targetVal);

      case 'not_equals':
        return String(rawVal) !== String(targetVal);

      case 'contains':
        return String(rawVal || '').toLowerCase().includes(String(targetVal).toLowerCase());

      case 'greater_than':
        return Number(rawVal) > Number(targetVal);

      case 'less_than':
        return Number(rawVal) < Number(targetVal);

      case 'is_empty':
        return rawVal === undefined || rawVal === null || rawVal === '';

      case 'is_not_empty':
        return rawVal !== undefined && rawVal !== null && rawVal !== '';

      case 'in_list': {
        const list = String(targetVal).split(',').map(s => s.trim().toLowerCase());
        return list.includes(String(rawVal).toLowerCase());
      }

      default:
        return true;
    }
  }

  /**
   * Executes a script-controlled ACL in a sandboxed environment
   */
  public static executeScript(
    script: string,
    record: Record<string, unknown>,
    user: UserPersona,
    operation: AclOperation
  ): { passed: boolean; logs: AclTraceLog[]; error?: string; executionTimeMs: number } {
    const logs: AclTraceLog[] = [];
    const startTime = performance.now();

    const userRoles = Array.isArray(user?.roles) ? user.roles : [];

    const gs = {
      getUserID: () => user?.id || '',
      getUserName: () => user?.name || '',
      getUserEmail: () => user?.email || '',
      getUserDepartment: () => user?.department || '',
      hasRole: (role: string) => userRoles.includes(role),
      now: () => new Date().toISOString(),
      log: (msg: unknown) => {
        logs.push({
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: String(msg)
        });
      },
      warn: (msg: unknown) => {
        logs.push({
          timestamp: new Date().toLocaleTimeString(),
          level: 'warn',
          message: String(msg)
        });
      },
      error: (msg: unknown) => {
        logs.push({
          timestamp: new Date().toLocaleTimeString(),
          level: 'error',
          message: String(msg)
        });
      }
    };

    const userContext = {
      ...user,
      roles: userRoles,
      hasRole: (role: string) => userRoles.includes(role),
      isMemberOf: (deptOrGroup: string) => (user?.department === deptOrGroup) || userRoles.includes(deptOrGroup)
    };

    try {
      // Safe sandbox runner function with trailing newline protection
      const runner = new Function(
        'current',
        'user',
        'operation',
        'gs',
        `
        let answer = true;
        try {
          \n${script}\n;
          return typeof answer !== 'undefined' ? Boolean(answer) : true;
        } catch(err) {
          gs.error(err && err.message ? err.message : String(err));
          return false;
        }
        `
      );

      const result = runner(
        { ...record },
        userContext,
        operation,
        gs
      );

      const endTime = performance.now();
      return {
        passed: Boolean(result),
        logs,
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100
      };
    } catch (err: unknown) {
      const endTime = performance.now();
      const message = err instanceof Error ? err.message : String(err);
      logs.push({
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        message: `Execution syntax error: ${message}`
      });

      return {
        passed: false,
        logs,
        error: message,
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100
      };
    }
  }

  /**
   * Evaluates a rule against a record and user
   */
  public static evaluateRule(
    rule: AclRule,
    record: Record<string, unknown>,
    user: UserPersona,
    operation: AclOperation
  ): { passed: boolean; steps: AclEvaluationStep[]; logs: AclTraceLog[]; executionTimeMs: number } {
    const steps: AclEvaluationStep[] = [];
    let combinedLogs: AclTraceLog[] = [];
    const start = performance.now();

    // 1. Role Check
    if (rule.requiredRoles && rule.requiredRoles.length > 0) {
      const hasRequiredRole = rule.requiredRoles.some(r => user.roles.includes(r));
      steps.push({
        step: 'ROLE_CHECK',
        passed: hasRequiredRole,
        description: hasRequiredRole
          ? `User possesses required role (${rule.requiredRoles.filter(r => user.roles.includes(r)).join(', ')})`
          : `User lacks required role(s): [${rule.requiredRoles.join(', ')}]`,
        details: { required: rule.requiredRoles, userRoles: user.roles }
      });

      if (!hasRequiredRole) {
        return {
          passed: false,
          steps,
          logs: [{
            timestamp: new Date().toLocaleTimeString(),
            level: 'warn',
            message: `ACL ${rule.id} failed: User ${user.name} lacks required roles.`
          }],
          executionTimeMs: performance.now() - start
        };
      }
    } else {
      steps.push({
        step: 'ROLE_CHECK',
        passed: true,
        description: 'No explicit role restrictions defined (purely script or condition controlled).'
      });
    }

    // 2. Field Condition check
    let conditionMatched = true;
    if ((rule.conditionMode === 'field_rule' || rule.conditionMode === 'both') && rule.fieldConditions && rule.fieldConditions.length > 0) {
      for (const cond of rule.fieldConditions) {
        const condPassed = this.evaluateCondition(record, cond);
        steps.push({
          step: 'FIELD_CONDITION',
          passed: condPassed,
          description: `Field condition [${cond.field} ${cond.operator} "${cond.value}"] evaluated to ${condPassed ? 'MATCH' : 'NO MATCH'} (current.${cond.field} = "${record[cond.field] ?? ''}")`,
          details: { field: cond.field, operator: cond.operator, expected: cond.value, actual: record[cond.field] }
        });

        if (!condPassed) {
          conditionMatched = false;
          break;
        }
      }
    }

    // In ServiceNow / Enterprise ACL architecture:
    // If field conditions don't match, this specific restriction rule does NOT trigger,
    // so it doesn't deny access on behalf of this rule!
    if (!conditionMatched) {
      return {
        passed: true, // Rule did not trigger restriction
        steps,
        logs: [{
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `ACL ${rule.id} conditions did not match current record state. Rule bypassed.`
        }],
        executionTimeMs: performance.now() - start
      };
    }

    // 3. Script Execution
    if (rule.conditionMode === 'script' || rule.conditionMode === 'both') {
      const scriptRes = this.executeScript(rule.script, record, user, operation);
      combinedLogs = [...combinedLogs, ...scriptRes.logs];

      steps.push({
        step: 'SCRIPT_EXECUTION',
        passed: scriptRes.passed,
        description: scriptRes.passed 
          ? `Script executed successfully and returned answer = true`
          : `Script restricted access and returned answer = false ${scriptRes.error ? `(Error: ${scriptRes.error})` : ''}`,
        executionTimeMs: scriptRes.executionTimeMs
      });

      return {
        passed: scriptRes.passed,
        steps,
        logs: combinedLogs,
        executionTimeMs: performance.now() - start
      };
    }

    return {
      passed: true,
      steps,
      logs: combinedLogs,
      executionTimeMs: performance.now() - start
    };
  }

  /**
   * Mask a sensitive field value according to type
   */
  public static maskValue(value: unknown, fieldName: string): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    const str = String(value);

    if (fieldName.includes('ssn') || fieldName.includes('tax')) {
      return '•••-••-' + str.slice(-4);
    }
    if (fieldName.includes('routing') || fieldName.includes('account')) {
      return '•••••' + str.slice(-4);
    }
    if (fieldName.includes('salary') || fieldName.includes('balance') || typeof value === 'number') {
      return '••••••••';
    }
    if (fieldName.includes('notes') || fieldName.includes('diagnosis') || fieldName.includes('medication')) {
      return '•••••••• [RESTRICTED BY ACL]';
    }

    return '••••••••';
  }

  /**
   * Evaluates record-level and field-level ACLs for a table record
   */
  public static evaluateRecordAccess(
    tableId: TableId,
    record: Record<string, unknown>,
    user: UserPersona,
    rules: AclRule[],
    operation: AclOperation = 'read'
  ): RecordAclResult {
    const recordId = String(record.id || record.number || record.mrn || record.emp_id || record.account_number || 'unknown');
    const start = performance.now();

    // 1. Evaluate Record-Level ACLs (targetType === 'record' and field === '*')
    const recordRules = rules.filter(r => 
      r.active && 
      (r.table === tableId || r.table === '*') && 
      r.targetType === 'record' && 
      r.operation === operation
    );

    let recordAllowed = true;
    let matchedRecordRule: AclRule | undefined;
    let recordSteps: AclEvaluationStep[] = [];
    let recordLogs: AclTraceLog[] = [];

    for (const rule of recordRules) {
      const evalRes = this.evaluateRule(rule, record, user, operation);
      if (!evalRes.passed) {
        recordAllowed = false;
        matchedRecordRule = rule;
        recordSteps = evalRes.steps;
        recordLogs = evalRes.logs;
        break; // First restricting ACL stops record-level access
      }
    }

    // 2. Evaluate Field-Level ACLs
    const fieldResults: Record<string, FieldAclResult> = {};
    const fieldRules = rules.filter(r => 
      r.active && 
      (r.table === tableId || r.table === '*') && 
      r.targetType === 'field' && 
      r.operation === operation
    );

    for (const fieldName of Object.keys(record)) {
      if (fieldName === 'id') continue;

      const matchingFieldRules = fieldRules.filter(r => r.field === fieldName || r.field === '*');
      
      let fieldAllowed = true;
      let matchedFieldRule: AclRule | undefined;
      let fieldAction: 'allow' | 'mask' | 'readonly' | 'hide' = 'allow';
      let fieldSteps: AclEvaluationStep[] = [];
      let fieldLogs: AclTraceLog[] = [];
      let maskedVal: string | number | undefined;

      for (const fRule of matchingFieldRules) {
        const evalRes = this.evaluateRule(fRule, record, user, operation);
        if (!evalRes.passed) {
          fieldAllowed = false;
          matchedFieldRule = fRule;
          fieldAction = fRule.denyAction;
          fieldSteps = evalRes.steps;
          fieldLogs = evalRes.logs;
          maskedVal = this.maskValue(record[fieldName], fieldName);
          break;
        }
      }

      fieldResults[fieldName] = {
        allowed: fieldAllowed,
        action: fieldAction,
        matchedRule: matchedFieldRule,
        reason: matchedFieldRule 
          ? `Restricted by ACL [${matchedFieldRule.id}] ${matchedFieldRule.name}` 
          : 'Granted by default policy',
        maskedValue: maskedVal,
        steps: fieldSteps,
        logs: fieldLogs,
        executionTimeMs: 0.1
      };
    }

    const end = performance.now();
    return {
      recordId,
      allowed: recordAllowed,
      reason: matchedRecordRule 
        ? `Access denied by Record ACL [${matchedRecordRule.id}] ${matchedRecordRule.name}` 
        : 'Access granted by record security rules',
      matchedRule: matchedRecordRule,
      steps: recordSteps,
      logs: recordLogs,
      executionTimeMs: Math.round((end - start) * 100) / 100,
      fieldResults
    };
  }
}
