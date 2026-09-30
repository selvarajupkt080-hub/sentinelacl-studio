import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check 
} from 'lucide-react';
import { UserPersona, AclOperation } from '../types/acl';
import { AclEngine } from '../services/aclEngine';
import { MOCK_PERSONAS, INITIAL_RECORDS } from '../data/mockData';

const TEST_SCENARIOS = [
  {
    name: 'Scenario 1: SecOps Field Restriction (Security Incident)',
    description: 'Tier 1 Agent attempts to read a critical security incident with security_incident=true',
    user: MOCK_PERSONAS[0], // Marcus
    record: INITIAL_RECORDS.incident[1], // Credential stuffing (security_incident: true)
    operation: 'read' as AclOperation,
    script: `// Restrict incident access if security_incident == true
if (current.security_incident === true) {
  gs.log("Evaluating ticket " + current.number + " flagged as SecOps Critical");
  if (user.hasRole('sec_ops') || user.clearanceLevel === 'Top Secret') {
    gs.log("Access granted: Caller satisfies sec_ops clearance criteria");
    answer = true;
  } else {
    gs.log("Access DENIED: Classified ticket requires sec_ops role. Caller has: " + user.roles.join(', '));
    answer = false;
  }
} else {
  answer = user.hasRole('itil');
}`
  },
  {
    name: 'Scenario 2: State Lockout Immutability (Closed Ticket)',
    description: 'User attempts to write/update an incident whose state is already Closed',
    user: MOCK_PERSONAS[0], // Marcus
    record: INITIAL_RECORDS.incident[3], // Closed incident
    operation: 'write' as AclOperation,
    script: `// State-based write lockout
gs.log("Evaluating write request for record state: " + current.state);
if (current.state === 'Closed') {
  if (user.hasRole('admin')) {
    gs.log("Admin override permitted for ticket maintenance.");
    answer = true;
  } else {
    gs.log("Write DENIED: Incident is closed and legally archived for audit.");
    answer = false;
  }
} else {
  answer = (user.name === current.assigned_to) || user.hasRole('itil');
}`
  },
  {
    name: 'Scenario 3: Private Wealth SSN Access Threshold',
    description: 'Finance officer attempts to view SSN on account with balance > ₹25,00,000 (₹25 Lakhs)',
    user: MOCK_PERSONAS[5], // Arthur Vance
    record: INITIAL_RECORDS.customer_financial[0], // Apex Robotics, balance ₹14,50,000
    operation: 'read' as AclOperation,
    script: `// Restrict sensitive tax ID based on account balance threshold (> ₹25 Lakhs)
const balance = Number(current.balance || 0);
gs.log("Checking account " + current.account_number + " with balance ₹" + balance.toLocaleString('en-IN'));

if (balance > 2500000) {
  if (user.name === current.assigned_officer || user.hasRole('wealth_manager')) {
    gs.log("Access GRANTED: Caller is designated relationship officer (" + current.assigned_officer + ")");
    answer = true;
  } else {
    gs.log("Access DENIED: High wealth account masked from general finance staff.");
    answer = false;
  }
} else {
  answer = user.hasRole('finance_officer');
}`
  },
  {
    name: 'Scenario 4: HIPAA Psychiatric Record Isolation',
    description: 'Nurse specialist attempting to read psychiatric care notes',
    user: MOCK_PERSONAS[3], // Sarah Lin (nurse)
    record: INITIAL_RECORDS.patient_record[2], // Claire Delgado (mental_health_flag: true)
    operation: 'read' as AclOperation,
    script: `// Enhanced HIPAA privacy shield for psychiatric diagnoses
if (current.mental_health_flag === true) {
  gs.log("Evaluating psychiatric record: " + current.mrn);
  if (user.hasRole('physician') && (user.name === current.attending_physician || user.department === 'Psychiatry')) {
    gs.log("Authorized: Attending psychiatrist identity validated.");
    answer = true;
  } else {
    gs.log("HIPAA violation prevention: Diagnosis masked. Caller lacks attending physician authorization.");
    answer = false;
  }
} else {
  answer = user.hasRole('clinical_staff') || user.hasRole('physician');
}`
  }
];

export const ScriptDebugger: React.FC = () => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [scriptContent, setScriptContent] = useState(TEST_SCENARIOS[0].script);
  const [recordJson, setRecordJson] = useState(JSON.stringify(TEST_SCENARIOS[0].record, null, 2));
  const [userJson, setUserJson] = useState(JSON.stringify(TEST_SCENARIOS[0].user, null, 2));
  const [operation, setOperation] = useState<AclOperation>('read');
  const [copied, setCopied] = useState(false);

  const [executionResult, setExecutionResult] = useState<{
    passed: boolean;
    logs: { timestamp: string; level: string; message: string }[];
    error?: string;
    executionTimeMs: number;
    executedAt: string;
  } | null>(null);

  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIndex(index);
    const scen = TEST_SCENARIOS[index];
    setScriptContent(scen.script);
    setRecordJson(JSON.stringify(scen.record, null, 2));
    setUserJson(JSON.stringify(scen.user, null, 2));
    setOperation(scen.operation);
    setExecutionResult(null);
  };

  const handleRunEvaluation = () => {
    let parsedRecord: Record<string, unknown> = {};
    let parsedUser: UserPersona;

    try {
      parsedRecord = JSON.parse(recordJson);
    } catch {
      setExecutionResult({
        passed: false,
        logs: [{ timestamp: new Date().toLocaleTimeString(), level: 'error', message: 'Invalid JSON in current record editor.' }],
        error: 'Invalid JSON in current record',
        executionTimeMs: 0,
        executedAt: new Date().toLocaleTimeString()
      });
      return;
    }

    try {
      parsedUser = JSON.parse(userJson);
    } catch {
      setExecutionResult({
        passed: false,
        logs: [{ timestamp: new Date().toLocaleTimeString(), level: 'error', message: 'Invalid JSON in user profile editor.' }],
        error: 'Invalid JSON in user profile',
        executionTimeMs: 0,
        executedAt: new Date().toLocaleTimeString()
      });
      return;
    }

    const res = AclEngine.executeScript(scriptContent, parsedRecord, parsedUser, operation);
    setExecutionResult({
      ...res,
      executedAt: new Date().toLocaleTimeString()
    });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Title & Scenario Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Interactive ACL Script Debugger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test and step through script-controlled access logic with custom record payloads and simulated caller tokens
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyScript}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Script'}</span>
          </button>

          <button
            onClick={handleRunEvaluation}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Evaluation</span>
          </button>
        </div>
      </div>

      {/* Scenarios bar */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
        <span className="text-xs font-semibold text-slate-300 block">
          Preset Enterprise Scenarios:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {TEST_SCENARIOS.map((scen, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectScenario(idx)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                selectedScenarioIndex === idx
                  ? 'border-indigo-500 bg-indigo-950/40 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-semibold truncate">{scen.name}</div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{scen.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Script Editor (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-2 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>JavaScript Sandbox Script</span>
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Operation:</span>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as AclOperation)}
                className="px-2 py-0.5 text-xs bg-slate-950 border border-slate-700 rounded text-indigo-300 font-mono"
              >
                <option value="read">read</option>
                <option value="write">write</option>
                <option value="create">create</option>
                <option value="delete">delete</option>
              </select>
            </div>
          </div>

          <textarea
            rows={18}
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            className="w-full flex-1 p-3 font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
            spellCheck={false}
          />

          <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-1">
            <span>Runtime exposes: current, user, gs, operation, answer</span>
            <span>Timeout: 500ms</span>
          </div>
        </div>

        {/* Right Column: Data Payloads & Live Output (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          {/* Top Half: Current & User JSONs in tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Record JSON */}
            <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-300 block font-mono">
                Payload: current (Record)
              </span>
              <textarea
                rows={9}
                value={recordJson}
                onChange={(e) => setRecordJson(e.target.value)}
                className="w-full p-2.5 font-mono text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                spellCheck={false}
              />
            </div>

            {/* User JSON */}
            <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-300 block font-mono">
                Payload: user (Caller)
              </span>
              <textarea
                rows={9}
                value={userJson}
                onChange={(e) => setUserJson(e.target.value)}
                className="w-full p-2.5 font-mono text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Bottom Half: Live Execution Output */}
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                <span>Execution Trace & Output</span>
              </span>

              {executionResult && (
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-400">{executionResult.executionTimeMs} ms</span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span className="text-slate-500">{executionResult.executedAt}</span>
                </div>
              )}
            </div>

            {!executionResult ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                <Play className="w-6 h-6 mb-2 text-slate-600" />
                <p className="text-xs text-slate-400">Click &quot;Run Evaluation&quot; to test script execution</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Evaluation logs and answer output will render here</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 flex flex-col">
                {/* Result Banner */}
                <div className={`p-3 rounded-lg border flex items-center justify-between ${
                  executionResult.passed
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {executionResult.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="font-mono text-xs font-bold">
                      {executionResult.passed ? 'ACCESS GRANTED (answer = true)' : 'ACCESS RESTRICTED (answer = false)'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/40">
                    Operation: {operation.toUpperCase()}
                  </span>
                </div>

                {/* gs.log output box */}
                <div className="flex-1 min-h-[140px] bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs space-y-1.5 overflow-y-auto">
                  <div className="text-[11px] text-slate-500 border-b border-slate-800/80 pb-1 mb-1">
                    Security Event Log Stream (gs.log):
                  </div>
                  {executionResult.logs.length === 0 ? (
                    <div className="text-slate-600 italic">No gs.log() statements emitted.</div>
                  ) : (
                    executionResult.logs.map((l, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <span className="text-slate-500 tabular-nums">[{l.timestamp}]</span>
                        <span className={
                          l.level === 'error' ? 'text-rose-400 font-bold' :
                          l.level === 'warn' ? 'text-amber-400 font-bold' :
                          'text-indigo-300 font-medium'
                        }>
                          {l.level.toUpperCase()}:
                        </span>
                        <span className="text-slate-200 flex-1">{l.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
