import React from 'react';
import { X, ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Terminal, Clock, FileCode, Lock } from 'lucide-react';
import { RecordAclResult, FieldAclResult, UserPersona, TableSchema } from '../types/acl';

interface AclInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Record<string, unknown>;
  schema: TableSchema;
  user: UserPersona;
  recordAclResult: RecordAclResult;
  selectedField?: string;
  onSelectField: (fieldName: string) => void;
}

export const AclInspectorModal: React.FC<AclInspectorModalProps> = ({
  isOpen,
  onClose,
  record,
  schema,
  user,
  recordAclResult,
  selectedField,
  onSelectField
}) => {
  if (!isOpen) return null;

  // If a field is selected, inspect that field; otherwise inspect record-level
  const isFieldInspection = Boolean(selectedField && selectedField !== '*');
  const fieldResult: FieldAclResult | undefined = isFieldInspection && selectedField 
    ? recordAclResult.fieldResults[selectedField] 
    : undefined;

  const activeMatchedRule = isFieldInspection 
    ? fieldResult?.matchedRule 
    : recordAclResult.matchedRule;

  const isAllowed = isFieldInspection 
    ? fieldResult?.allowed 
    : recordAclResult.allowed;

  const action = isFieldInspection 
    ? (fieldResult?.action || 'allow') 
    : (recordAclResult.allowed ? 'allow' : 'hide');

  const steps = isFieldInspection 
    ? (fieldResult?.steps || []) 
    : recordAclResult.steps;

  const logs = isFieldInspection 
    ? (fieldResult?.logs || []) 
    : recordAclResult.logs;

  const executionTimeMs = isFieldInspection 
    ? (fieldResult?.executionTimeMs || 0.1) 
    : recordAclResult.executionTimeMs;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
              isAllowed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : action === 'mask'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {isAllowed ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  ACL Decision Inspector
                </h2>
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${
                  isAllowed 
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' 
                    : action === 'mask' 
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' 
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}>
                  {isAllowed ? 'ALLOWED' : action.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evaluation trace for Table <span className="font-mono text-slate-300">{schema.id}</span> · Target <span className="font-mono text-indigo-300">{isFieldInspection ? selectedField : 'record (all fields)'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Selector Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap">Target:</span>
          <button
            onClick={() => onSelectField('*')}
            className={`px-2.5 py-1 rounded font-mono transition-colors whitespace-nowrap ${
              !selectedField || selectedField === '*'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Table.* (Record Row Access)
          </button>

          {schema.fields.map((f) => {
            const fRes = recordAclResult.fieldResults[f.name];
            const isFSelected = selectedField === f.name;
            const isFMasked = fRes && !fRes.allowed && fRes.action === 'mask';
            const isFBlocked = fRes && !fRes.allowed && fRes.action === 'hide';

            return (
              <button
                key={f.name}
                onClick={() => onSelectField(f.name)}
                className={`px-2.5 py-1 rounded font-mono flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  isFSelected
                    ? 'bg-indigo-600 text-white font-semibold'
                    : isFMasked
                    ? 'bg-amber-950/40 text-amber-300 border border-amber-800/60 hover:bg-amber-900/40'
                    : isFBlocked
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{f.name}</span>
                {f.sensitive && <Lock className="w-3 h-3 text-amber-400" />}
                {isFMasked && <span className="text-[10px] text-amber-400">• Masked</span>}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Record Context */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] font-mono text-slate-400 block mb-1">
                Record Subject (current)
              </span>
              <div className="text-xs space-y-1">
                <div className="font-semibold text-white font-mono">
                  {String(record[schema.keyField] || record.id)}
                </div>
                {isFieldInspection && selectedField && (
                  <div className="text-slate-300 flex items-center justify-between">
                    <span className="text-slate-400">Raw Value:</span>
                    <span className="font-mono text-indigo-300 truncate max-w-[150px]">
                      {String(record[selectedField] ?? '—')}
                    </span>
                  </div>
                )}
                {record.security_incident !== undefined && (
                  <div className="text-slate-300 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">security_incident:</span>
                    <span className="font-mono font-bold text-rose-400">{String(record.security_incident)}</span>
                  </div>
                )}
                {record.state !== undefined && (
                  <div className="text-slate-300 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">state:</span>
                    <span className="font-mono text-slate-200">{String(record.state)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Caller Context */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] font-mono text-slate-400 block mb-1">
                Caller Context (user / gs)
              </span>
              <div className="text-xs space-y-1">
                <div className="font-semibold text-white">
                  {user.name}
                </div>
                <div className="text-slate-300 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Clearance:</span>
                  <span className="font-mono text-amber-300">{user.clearanceLevel}</span>
                </div>
                <div className="text-slate-300 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Department:</span>
                  <span>{user.department}</span>
                </div>
                <div className="text-slate-300 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Roles:</span>
                  <span className="font-mono text-indigo-300 truncate max-w-[130px]" title={user.roles.join(', ')}>
                    [{user.roles.join(', ')}]
                  </span>
                </div>
              </div>
            </div>

            {/* Decision Outcome */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] font-mono text-slate-400 block mb-1">
                Evaluation Outcome
              </span>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  {isAllowed ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACCESS GRANTED
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> {action.toUpperCase()} ENFORCED
                    </span>
                  )}
                </div>
                <div className="text-slate-300 text-[11px]">
                  {activeMatchedRule 
                    ? `Rule [${activeMatchedRule.id}] matched`
                    : 'Default access policy applied'}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{executionTimeMs} ms execution</span>
                </div>
              </div>
            </div>
          </div>

          {/* Evaluation Trace Steps */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Execution Pipeline Timeline</span>
            </h3>

            {steps.length === 0 ? (
              <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/30 text-xs text-slate-400">
                No restricting ACL evaluated for this target; access allowed by baseline table privileges.
              </div>
            ) : (
              <div className="space-y-2">
                {steps.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex items-start gap-3"
                  >
                    <div className="mt-0.5">
                      {st.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-slate-200">
                          {st.step}
                        </span>
                        <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                          st.passed 
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
                            : 'border-rose-500/30 text-rose-400 bg-rose-500/10'
                        }`}>
                          {st.passed ? 'PASSED' : 'DENIED / FAILED'}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1 leading-relaxed">{st.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Script & Rule Definition */}
          {activeMatchedRule && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Script-Controlled ACL Definition: {activeMatchedRule.id}</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeMatchedRule.name}
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-indigo-200 overflow-x-auto">
                <pre className="leading-relaxed">
                  {activeMatchedRule.script}
                </pre>
              </div>

              <p className="text-xs text-slate-400 italic">
                Intent: {activeMatchedRule.description}
              </p>
            </div>
          )}

          {/* Script Execution Console Logs */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>gs.log() Security Event Output</span>
            </h3>

            {logs.length === 0 ? (
              <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/40 text-xs text-slate-500 font-mono">
                No explicit log statements emitted during this evaluation cycle.
              </div>
            ) : (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs space-y-1.5 max-h-40 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-500 tabular-nums">[{log.timestamp}]</span>
                    <span className={
                      log.level === 'error'
                        ? 'text-rose-400 font-semibold'
                        : log.level === 'warn'
                        ? 'text-amber-400 font-semibold'
                        : 'text-emerald-300'
                    }>
                      {log.level.toUpperCase()}:
                    </span>
                    <span className="text-slate-300 flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Field-level security evaluated with sandboxed JavaScript runtime
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
