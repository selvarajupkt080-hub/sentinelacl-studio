import React, { useState } from 'react';
import { X, Lock, ShieldAlert, Save, Trash2, CheckCircle } from 'lucide-react';
import { TableSchema, UserPersona, AclRule, AclOperation } from '../types/acl';
import { AclEngine } from '../services/aclEngine';

interface RecordEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: TableSchema;
  initialRecord: Record<string, unknown> | null; // null for Create
  mode: 'edit' | 'create';
  user: UserPersona;
  rules: AclRule[];
  adminMode?: boolean;
  onSaveRecord: (updatedRecord: Record<string, unknown>, mode: 'edit' | 'create') => void;
  onDeleteRecord?: (record: Record<string, unknown>) => void;
  onRecordAuditEvent: (
    operation: AclOperation,
    recordId: string,
    granted: boolean,
    ruleName?: string,
    reason?: string
  ) => void;
}

export const RecordEditorModal: React.FC<RecordEditorModalProps> = ({
  isOpen,
  onClose,
  schema,
  initialRecord,
  mode,
  user,
  rules,
  adminMode = false,
  onSaveRecord,
  onDeleteRecord,
  onRecordAuditEvent
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    if (initialRecord) return { ...initialRecord };
    
    // Default initial template for create
    const defaults: Record<string, unknown> = {
      id: `${schema.id.slice(0, 3)}-${Date.now().toString().slice(-4)}`
    };
    schema.fields.forEach(f => {
      if (f.name === 'number') defaults.number = `INC00${Math.floor(10000 + Math.random() * 90000)}`;
      else if (f.name === 'account_number') defaults.account_number = `ACC-${Math.floor(100000 + Math.random() * 900000)}`;
      else if (f.name === 'mrn') defaults.mrn = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;
      else if (f.name === 'emp_id') defaults.emp_id = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      else if (f.type === 'boolean') defaults[f.name] = false;
      else if (f.type === 'number' || f.type === 'currency') defaults[f.name] = 0;
      else if (f.options && f.options.length > 0) defaults[f.name] = f.options[0];
      else defaults[f.name] = '';
    });
    return defaults;
  });

  const [aclViolation, setAclViolation] = useState<{
    blocked: boolean;
    ruleName?: string;
    reason?: string;
    details?: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleFieldChange = (fieldName: string, val: unknown) => {
    setFormData(prev => ({ ...prev, [fieldName]: val }));
    // Clear violation when editing
    if (aclViolation) setAclViolation(null);
  };

  const handleForceSave = () => {
    const op: AclOperation = mode === 'create' ? 'create' : 'write';
    const recordId = String(formData[schema.keyField] || formData.id || 'new');
    onRecordAuditEvent(op, recordId, true, 'Admin Override', 'Manual administrative save bypass');
    onSaveRecord(formData, mode);
    onClose();
  };

  const handleValidateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAclViolation(null);

    if (adminMode) {
      handleForceSave();
      return;
    }

    const op: AclOperation = mode === 'create' ? 'create' : 'write';

    // 1. Evaluate record write/create access using the ACL engine
    const recordResult = AclEngine.evaluateRecordAccess(
      schema.id,
      formData,
      user,
      rules,
      op
    );

    const recordId = String(formData[schema.keyField] || formData.id);

    if (!recordResult.allowed) {
      const reason = recordResult.reason;
      const ruleName = recordResult.matchedRule?.name || 'Restricted by ACL Rule';
      setAclViolation({
        blocked: true,
        ruleName,
        reason,
        details: recordResult.logs.map(l => l.message)
      });

      onRecordAuditEvent(op, recordId, false, ruleName, reason);
      return;
    }

    // 2. Check field-level write ACLs
    const blockedFields: string[] = [];
    for (const f of schema.fields) {
      if (initialRecord && initialRecord[f.name] !== formData[f.name]) {
        // Field was modified, check if write is allowed
        const fieldCheck = recordResult.fieldResults[f.name];
        if (fieldCheck && (!fieldCheck.allowed || fieldCheck.action === 'readonly')) {
          blockedFields.push(f.label);
        }
      }
    }

    if (blockedFields.length > 0) {
      const reason = `Field-level ACL write restriction on: ${blockedFields.join(', ')}`;
      setAclViolation({
        blocked: true,
        ruleName: 'Field Level Write ACL',
        reason,
        details: ['Caller does not have write authority to modify this protected field.']
      });

      onRecordAuditEvent(op, recordId, false, 'Field Write Lock', reason);
      return;
    }

    // If passed:
    onRecordAuditEvent(op, recordId, true, undefined, 'Access granted by security policies');
    onSaveRecord(formData, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>{mode === 'create' ? 'Create New Record' : `Edit Record: ${String(formData[schema.keyField] || '')}`}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Testing Write/Create ACL enforcement under caller <span className="font-semibold text-slate-200">{user.name}</span> ({user.roles.join(', ')})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleValidateAndSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* ACL Violation Alert Banner */}
          {aclViolation && aclViolation.blocked && (
            <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-300 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-semibold text-sm text-rose-200">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>Security Policy Violation: Mutation Blocked</span>
              </div>
              <p className="text-xs text-rose-300/90 leading-relaxed font-mono">
                {aclViolation.reason}
              </p>
              {aclViolation.details && aclViolation.details.length > 0 && (
                <div className="text-[11px] font-mono bg-rose-950/60 p-2.5 rounded border border-rose-900/50 space-y-1">
                  {aclViolation.details.map((d, i) => (
                    <div key={i} className="text-rose-200/80">• {d}</div>
                  ))}
                </div>
              )}
              <div className="pt-2 flex items-center justify-between border-t border-rose-900/50">
                <span className="text-[11px] text-rose-300">Administrative override option:</span>
                <button
                  type="button"
                  onClick={handleForceSave}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Force Save (Admin Override)</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schema.fields.map((f) => {
              const val = formData[f.name];
              const isKeyField = f.name === schema.keyField;

              return (
                <div key={f.name} className={f.type === 'string' && f.name.includes('notes') ? 'md:col-span-2' : ''}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <span>{f.label}</span>
                      {f.sensitive && (
                        <span className="text-[10px] font-mono text-amber-400 border border-amber-500/30 px-1 rounded">
                          Restricted
                        </span>
                      )}
                    </label>
                  </div>

                  {f.options && f.options.length > 0 ? (
                    <select
                      value={String(val ?? '')}
                      onChange={(e) => handleFieldChange(f.name, e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    >
                      {f.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : f.type === 'boolean' ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`field_${f.name}`}
                        checked={Boolean(val)}
                        onChange={(e) => handleFieldChange(f.name, e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`field_${f.name}`} className="text-xs text-slate-300 cursor-pointer">
                        {Boolean(val) ? 'Enabled / True' : 'Disabled / False'}
                      </label>
                    </div>
                  ) : f.name.includes('notes') || f.name.includes('diagnosis') ? (
                    <textarea
                      rows={3}
                      value={String(val ?? '')}
                      onChange={(e) => handleFieldChange(f.name, e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <input
                      type={f.type === 'number' || f.type === 'currency' ? 'number' : 'text'}
                      disabled={isKeyField && mode === 'edit'}
                      value={String(val ?? '')}
                      onChange={(e) => handleFieldChange(f.name, f.type === 'number' || f.type === 'currency' ? Number(e.target.value) : e.target.value)}
                      className={`w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500 ${
                        isKeyField && mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div>
              {mode === 'edit' && initialRecord && onDeleteRecord && (
                <button
                  type="button"
                  onClick={() => {
                    const recName = String(initialRecord[schema.keyField] || initialRecord.id);
                    if (window.confirm(`Are you sure you want to delete ${recName}?`)) {
                      onDeleteRecord(initialRecord);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{mode === 'create' ? 'Create Record' : 'Save Modifications'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
