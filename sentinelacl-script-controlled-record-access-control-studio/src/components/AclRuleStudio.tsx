import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  Edit3, 
  Trash2, 
  Play, 
  FileCode, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  Terminal,
  X
} from 'lucide-react';
import { 
  AclRule, 
  TableId, 
  AclOperation, 
  DenyAction, 
  FieldCondition, 
  ConditionOperator, 
  UserPersona 
} from '../types/acl';
import { TABLE_SCHEMAS, SCRIPT_TEMPLATES, INITIAL_RECORDS } from '../data/mockData';
import { AclEngine } from '../services/aclEngine';

interface AclRuleStudioProps {
  rules: AclRule[];
  onToggleRule: (ruleId: string) => void;
  onSaveRule: (rule: AclRule) => void;
  onDeleteRule: (ruleId: string) => void;
  personas: UserPersona[];
}

export const AclRuleStudio: React.FC<AclRuleStudioProps> = ({
  rules,
  onToggleRule,
  onSaveRule,
  onDeleteRule,
  personas
}) => {
  const [filterTable, setFilterTable] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRule, setEditingRule] = useState<AclRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Test bench state within the rule editor
  const [testUser, setTestUser] = useState<UserPersona>(personas[0]);
  const [testRecordIndex, setTestRecordIndex] = useState<number>(0);
  const [testBenchOutput, setTestBenchOutput] = useState<{
    ran: boolean;
    passed: boolean;
    logs: { timestamp: string; level: string; message: string }[];
    timeMs: number;
    error?: string;
  } | null>(null);

  const filteredRules = rules.filter(r => {
    if (filterTable !== 'all' && r.table !== filterTable) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.field.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenCreate = () => {
    const newRule: AclRule = {
      id: `ACL-CUSTOM-${Math.floor(100 + Math.random() * 900)}`,
      name: 'Custom Script-Controlled Access Rule',
      table: 'incident',
      targetType: 'record',
      field: '*',
      operation: 'read',
      active: true,
      requiredRoles: [],
      conditionMode: 'script',
      script: `// Restrict access based on field values
if (current.security_incident === true) {
  answer = user.hasRole('sec_ops');
} else {
  answer = true;
}`,
      denyAction: 'hide',
      description: 'Restricts access based on custom script evaluation.',
      lastModified: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    setEditingRule(newRule);
    setIsCreating(true);
    setTestBenchOutput(null);
  };

  const handleOpenEdit = (rule: AclRule) => {
    setEditingRule({ ...rule });
    setIsCreating(false);
    setTestBenchOutput(null);
  };

  const handleTestBenchRun = () => {
    if (!editingRule) return;
    const targetTable = (editingRule.table === '*' ? 'incident' : editingRule.table) as TableId;
    const sampleRecords = INITIAL_RECORDS[targetTable] || [];
    const sampleRecord = sampleRecords[testRecordIndex] || sampleRecords[0] || {};

    const evalResult = AclEngine.evaluateRule(
      editingRule,
      sampleRecord,
      testUser,
      editingRule.operation
    );

    setTestBenchOutput({
      ran: true,
      passed: evalResult.passed,
      logs: evalResult.logs,
      timeMs: Math.round(evalResult.executionTimeMs * 100) / 100
    });
  };

  const handleApplyTemplate = (scriptText: string) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      script: scriptText
    });
  };

  const handleAddCondition = () => {
    if (!editingRule) return;
    const schema = TABLE_SCHEMAS.find(s => s.id === editingRule.table) || TABLE_SCHEMAS[0];
    const defaultField = schema.fields[0].name;
    const newCond: FieldCondition = {
      field: defaultField,
      operator: 'equals',
      value: ''
    };
    const conds = editingRule.fieldConditions ? [...editingRule.fieldConditions, newCond] : [newCond];
    setEditingRule({ ...editingRule, fieldConditions: conds });
  };

  const handleRemoveCondition = (index: number) => {
    if (!editingRule || !editingRule.fieldConditions) return;
    const updated = editingRule.fieldConditions.filter((_, i) => i !== index);
    setEditingRule({ ...editingRule, fieldConditions: updated });
  };

  return (
    <div className="space-y-4">
      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Script-Controlled ACL Rule Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Define, test, and enforce dynamic record & field-level access control logic powered by live JavaScript scripts
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New ACL Rule</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ACL rules by name, ID or field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Table filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-xs overflow-x-auto">
            <button
              onClick={() => setFilterTable('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                filterTable === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Tables
            </button>
            {TABLE_SCHEMAS.map(s => (
              <button
                key={s.id}
                onClick={() => setFilterTable(s.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  filterTable === s.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {filteredRules.length} Rules Configured
        </div>
      </div>

      {/* Rules List Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredRules.map((rule) => {
          return (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all ${
                rule.active
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleRule(rule.id)}
                    className="mt-0.5 cursor-pointer"
                    title={rule.active ? 'Click to deactivate rule' : 'Click to activate rule'}
                  >
                    {rule.active ? (
                      <ToggleRight className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-600" />
                    )}
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        {rule.id}
                      </span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <h3 className="text-sm font-semibold text-white">
                        {rule.name}
                      </h3>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase font-medium ${
                        rule.operation === 'read' ? 'border-sky-500/30 text-sky-300 bg-sky-500/10' :
                        rule.operation === 'write' ? 'border-amber-500/30 text-amber-300 bg-amber-500/10' :
                        'border-purple-500/30 text-purple-300 bg-purple-500/10'
                      }`}>
                        {rule.operation}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase ${
                        rule.denyAction === 'mask' ? 'border-amber-500/30 text-amber-300' :
                        rule.denyAction === 'readonly' ? 'border-blue-500/30 text-blue-300' :
                        'border-rose-500/30 text-rose-300'
                      }`}>
                        Action: {rule.denyAction}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {rule.description}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-slate-400 font-mono">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Table:</span>
                        <span className="text-slate-300">{rule.table}</span>
                      </div>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Target:</span>
                        <span className="text-indigo-300 font-semibold">
                          {rule.targetType === 'record' ? 'Row Level (*)' : `Field: ${rule.field}`}
                        </span>
                      </div>
                      {rule.fieldConditions && rule.fieldConditions.length > 0 && (
                        <>
                          <span aria-hidden="true" className="text-slate-700">·</span>
                          <div className="flex items-center gap-1 text-amber-300">
                            <span>Condition:</span>
                            <span>{rule.fieldConditions.map(c => `${c.field} ${c.operator} ${c.value}`).join(' & ')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(rule)}
                    className="p-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                    title="Edit script & conditions"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteRule(rule.id)}
                    className="p-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                    title="Delete ACL rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Collapsed script preview */}
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 overflow-x-auto max-h-24">
                  <pre className="truncate">{rule.script.slice(0, 180)}...</pre>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rule Editor Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>{isCreating ? 'Create Script-Controlled ACL' : `Edit ACL: ${editingRule.id}`}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Restricts record or field access dynamically based on field value and caller role criteria
                </p>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Rule Title & Intent
                  </label>
                  <input
                    type="text"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Operation
                  </label>
                  <select
                    value={editingRule.operation}
                    onChange={(e) => setEditingRule({ ...editingRule, operation: e.target.value as AclOperation })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="read">READ</option>
                    <option value="write">WRITE</option>
                    <option value="create">CREATE</option>
                    <option value="delete">DELETE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Table
                  </label>
                  <select
                    value={editingRule.table}
                    onChange={(e) => {
                      const newTable = e.target.value as TableId | '*';
                      setEditingRule({ ...editingRule, table: newTable, field: '*' });
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="*">* (All Tables)</option>
                    {TABLE_SCHEMAS.map(s => (
                      <option key={s.id} value={s.id}>{s.label} ({s.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Type & Scope
                  </label>
                  <select
                    value={editingRule.targetType}
                    onChange={(e) => setEditingRule({ 
                      ...editingRule, 
                      targetType: e.target.value as 'record' | 'field',
                      field: e.target.value === 'record' ? '*' : (editingRule.field === '*' ? 'short_description' : editingRule.field)
                    })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="record">Record Row Level (Table.*)</option>
                    <option value="field">Field Column Level (Table.field)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Field
                  </label>
                  {editingRule.targetType === 'record' ? (
                    <input
                      type="text"
                      disabled
                      value="* (All Fields / Whole Record)"
                      className="w-full px-3 py-2 text-xs bg-slate-950/60 border border-slate-800 rounded-lg text-slate-400 font-mono"
                    />
                  ) : (
                    <select
                      value={editingRule.field}
                      onChange={(e) => setEditingRule({ ...editingRule, field: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                    >
                      {TABLE_SCHEMAS.find(s => s.id === editingRule.table)?.fields.map(f => (
                        <option key={f.name} value={f.name}>{f.label} ({f.name})</option>
                      )) || <option value="*">*</option>}
                    </select>
                  )}
                </div>
              </div>

              {/* Deny Action & Condition Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Denial Enforcement Action
                  </label>
                  <select
                    value={editingRule.denyAction}
                    onChange={(e) => setEditingRule({ ...editingRule, denyAction: e.target.value as DenyAction })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="hide">hide (Omit whole row or blank field)</option>
                    <option value="mask">mask (Render •••••••• [RESTRICTED])</option>
                    <option value="readonly">readonly (Visible but immutable)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Evaluation Mode
                  </label>
                  <select
                    value={editingRule.conditionMode}
                    onChange={(e) => setEditingRule({ ...editingRule, conditionMode: e.target.value as 'script' | 'field_rule' | 'both' })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="both">Both: Field Condition Filter + Script</option>
                    <option value="script">Script Controlled Only (answer = ...)</option>
                    <option value="field_rule">Field Condition Filter Only</option>
                  </select>
                </div>
              </div>

              {/* Field Condition Builder */}
              {(editingRule.conditionMode === 'field_rule' || editingRule.conditionMode === 'both') && (
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      Record Field Value Pre-Conditions
                    </span>
                    <button
                      type="button"
                      onClick={handleAddCondition}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Condition
                    </button>
                  </div>

                  {(!editingRule.fieldConditions || editingRule.fieldConditions.length === 0) ? (
                    <div className="text-xs text-slate-500 italic">
                      No field condition filters added. Rule will trigger on all records in this table.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editingRule.fieldConditions.map((cond, idx) => {
                        const schema = TABLE_SCHEMAS.find(s => s.id === editingRule.table) || TABLE_SCHEMAS[0];

                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <select
                              value={cond.field}
                              onChange={(e) => {
                                const updated = [...editingRule.fieldConditions!];
                                updated[idx].field = e.target.value;
                                setEditingRule({ ...editingRule, fieldConditions: updated });
                              }}
                              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-white font-mono"
                            >
                              {schema.fields.map(f => (
                                <option key={f.name} value={f.name}>{f.name}</option>
                              ))}
                            </select>

                            <select
                              value={cond.operator}
                              onChange={(e) => {
                                const updated = [...editingRule.fieldConditions!];
                                updated[idx].operator = e.target.value as ConditionOperator;
                                setEditingRule({ ...editingRule, fieldConditions: updated });
                              }}
                              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-white font-mono"
                            >
                              <option value="equals">== (equals)</option>
                              <option value="not_equals">!= (not equals)</option>
                              <option value="contains">contains</option>
                              <option value="greater_than">&gt; (greater than)</option>
                              <option value="less_than">&lt; (less than)</option>
                              <option value="in_list">in list (comma sep)</option>
                            </select>

                            <input
                              type="text"
                              placeholder="Value..."
                              value={String(cond.value)}
                              onChange={(e) => {
                                const updated = [...editingRule.fieldConditions!];
                                updated[idx].value = e.target.value;
                                setEditingRule({ ...editingRule, fieldConditions: updated });
                              }}
                              className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-white font-mono"
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveCondition(idx)}
                              className="p-1 text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Script Editor Section */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ACL Evaluation Script (JavaScript Sandbox)</span>
                  </label>

                  {/* Template Picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Load Template:</span>
                    <select
                      onChange={(e) => {
                        const template = SCRIPT_TEMPLATES.find(t => t.title === e.target.value);
                        if (template) handleApplyTemplate(template.script);
                      }}
                      defaultValue=""
                      className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded-lg text-indigo-300 font-sans focus:outline-none focus:border-indigo-500"
                    >
                      <option value="" disabled>Select pattern...</option>
                      {SCRIPT_TEMPLATES.map(t => (
                        <option key={t.title} value={t.title}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={8}
                    value={editingRule.script}
                    onChange={(e) => setEditingRule({ ...editingRule, script: e.target.value })}
                    className="w-full p-3 font-mono text-xs bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
                    spellCheck={false}
                  />
                  <div className="absolute right-3 bottom-3 text-[10px] text-slate-500 font-mono pointer-events-none">
                    Exposes: current, user, gs, answer
                  </div>
                </div>
              </div>

              {/* Live Test Bench inside Modal */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-white">Live Script Test Bench</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestBenchRun}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test Run Script</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Test Caller Persona:</label>
                    <select
                      value={testUser.id}
                      onChange={(e) => {
                        const found = personas.find(p => p.id === e.target.value);
                        if (found) setTestUser(found);
                      }}
                      className="w-full px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-white font-mono"
                    >
                      {personas.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.department}, {p.roles.join(', ')})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Sample Record #:</label>
                    <select
                      value={testRecordIndex}
                      onChange={(e) => setTestRecordIndex(Number(e.target.value))}
                      className="w-full px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-white font-mono"
                    >
                      {((INITIAL_RECORDS[(editingRule.table === '*' ? 'incident' : editingRule.table) as TableId]) || []).map((r, i) => (
                        <option key={i} value={i}>
                          Record #{i+1} ({String(r.number || r.mrn || r.emp_id || r.account_number || r.id)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {testBenchOutput && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-mono">Test Result:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${
                        testBenchOutput.passed
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                          : 'border-rose-500/30 text-rose-400 bg-rose-500/10'
                      }`}>
                        {testBenchOutput.passed ? 'PASSED (answer = true)' : 'RESTRICTED (answer = false)'}
                      </span>
                    </div>

                    {testBenchOutput.logs.length > 0 && (
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                        {testBenchOutput.logs.map((l, i) => (
                          <div key={i}>• [{l.timestamp}] {l.message}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  onSaveRule(editingRule);
                  setEditingRule(null);
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm cursor-pointer"
              >
                Save ACL Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
