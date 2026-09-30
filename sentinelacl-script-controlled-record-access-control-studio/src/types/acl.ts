export type AclOperation = 'read' | 'write' | 'create' | 'delete';

export type ClearanceLevel = 'Public' | 'Standard' | 'Confidential' | 'Secret' | 'Top Secret';

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  title: string;
  roles: string[];
  clearanceLevel: ClearanceLevel;
  managerId?: string;
  delegatedLimit?: number;
}

export type TableId = 'incident' | 'customer_financial' | 'patient_record' | 'hr_payroll';

export interface TableFieldDefinition {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'currency' | 'status' | 'badge';
  sensitive?: boolean;
  options?: string[];
}

export interface TableSchema {
  id: TableId;
  label: string;
  description: string;
  keyField: string;
  fields: TableFieldDefinition[];
}

export type ConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'greater_than' 
  | 'less_than' 
  | 'is_empty' 
  | 'is_not_empty'
  | 'in_list';

export interface FieldCondition {
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

export type DenyAction = 'hide' | 'mask' | 'readonly';

export interface AclRule {
  id: string;
  name: string;
  table: TableId | '*';
  targetType: 'record' | 'field';
  field: string; // '*' for all fields (record level) or specific field name
  operation: AclOperation;
  active: boolean;
  requiredRoles: string[]; // At least one or all? ServiceNow: caller must have one of the listed roles, plus script passes
  conditionMode: 'script' | 'field_rule' | 'both';
  fieldConditions?: FieldCondition[];
  script: string;
  denyAction: DenyAction;
  description: string;
  lastModified: string;
}

export interface AclEvaluationStep {
  step: 'ROLE_CHECK' | 'FIELD_CONDITION' | 'SCRIPT_EXECUTION';
  passed: boolean;
  description: string;
  details?: Record<string, unknown>;
  executionTimeMs?: number;
}

export interface AclTraceLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface FieldAclResult {
  allowed: boolean;
  action: 'allow' | 'mask' | 'readonly' | 'hide';
  matchedRule?: AclRule;
  reason: string;
  maskedValue?: string | number;
  steps: AclEvaluationStep[];
  logs: AclTraceLog[];
  executionTimeMs: number;
}

export interface RecordAclResult {
  recordId: string;
  allowed: boolean;
  reason: string;
  matchedRule?: AclRule;
  steps: AclEvaluationStep[];
  logs: AclTraceLog[];
  executionTimeMs: number;
  fieldResults: Record<string, FieldAclResult>;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  table: TableId;
  recordId: string;
  operation: AclOperation;
  field?: string;
  granted: boolean;
  ruleName?: string;
  reason: string;
}
