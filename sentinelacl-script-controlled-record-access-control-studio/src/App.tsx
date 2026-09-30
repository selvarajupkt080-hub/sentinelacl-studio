import React, { useState } from 'react';
import { Header } from './components/Header';
import { RecordExplorer } from './components/RecordExplorer';
import { AclRuleStudio } from './components/AclRuleStudio';
import { ScriptDebugger } from './components/ScriptDebugger';
import { SecurityMatrix } from './components/SecurityMatrix';
import { AuditTrailView } from './components/AuditTrailView';
import { PersonaSelectorModal } from './components/PersonaSelectorModal';
import { AclInspectorModal } from './components/AclInspectorModal';
import { RecordEditorModal } from './components/RecordEditorModal';
import { ExportPolicyModal } from './components/ExportPolicyModal';

import { 
  TableId, 
  TableSchema, 
  UserPersona, 
  AclRule, 
  RecordAclResult, 
  AuditEvent,
  AclOperation
} from './types/acl';

import { 
  TABLE_SCHEMAS, 
  MOCK_PERSONAS, 
  INITIAL_RECORDS, 
  INITIAL_ACL_RULES 
} from './data/mockData';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'explorer' | 'rules' | 'debugger' | 'matrix' | 'audit'>('explorer');
  const [currentTable, setCurrentTable] = useState<TableId>('incident');

  // Personas & Active User
  const [personas, setPersonas] = useState<UserPersona[]>(MOCK_PERSONAS);
  const [activePersona, setActivePersona] = useState<UserPersona>(MOCK_PERSONAS[0]); // Marcus Kane (Support)

  // Rules & Records State
  const [rules, setRules] = useState<AclRule[]>(INITIAL_ACL_RULES);
  const [records, setRecords] = useState<Record<TableId, Record<string, unknown>[]>>(INITIAL_RECORDS);

  // Audit Events
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
    {
      id: 'audit-init-01',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
      userId: 'user_marcus',
      userName: 'Marcus Kane',
      table: 'incident',
      recordId: 'INC0089201',
      operation: 'read',
      granted: true,
      reason: 'Standard incident read allowed by department support policy'
    },
    {
      id: 'audit-init-02',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString(),
      userId: 'user_marcus',
      userName: 'Marcus Kane',
      table: 'incident',
      recordId: 'INC0089244',
      operation: 'read',
      granted: false,
      ruleName: 'Restrict Security Incidents to SecOps',
      reason: 'Field security_incident == true requires sec_ops role; Marcus Kane only has [itil, helpdesk_agent]'
    }
  ]);

  // Modals state
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Inspector modal state
  const [inspectorData, setInspectorData] = useState<{
    isOpen: boolean;
    record: Record<string, unknown>;
    schema: TableSchema;
    aclResult: RecordAclResult;
    selectedField?: string;
  } | null>(null);

  // Record Editor modal state (Create / Edit)
  const [recordEditorData, setRecordEditorData] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    record: Record<string, unknown> | null;
  } | null>(null);

  // Audit logging helper
  const handleRecordAuditEvent = (
    operation: AclOperation,
    recordId: string,
    granted: boolean,
    ruleName?: string,
    reason?: string
  ) => {
    const newEvent: AuditEvent = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      userId: activePersona.id,
      userName: activePersona.name,
      table: currentTable,
      recordId,
      operation,
      granted,
      ruleName,
      reason: reason || (granted ? 'Operation authorized' : 'Restricted by ACL rule')
    };

    setAuditEvents(prev => [newEvent, ...prev]);
  };

  // Rule Studio Handlers
  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, active: !r.active } : r));
  };

  const handleSaveRule = (rule: AclRule) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...rule, lastModified: new Date().toISOString().replace('T', ' ').slice(0, 19) };
        return updated;
      }
      return [{ ...rule, lastModified: new Date().toISOString().replace('T', ' ').slice(0, 19) }, ...prev];
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  };

  // Record Explorer Handlers
  const handleOpenInspector = (
    record: Record<string, unknown>, 
    schema: TableSchema, 
    aclResult: RecordAclResult, 
    field?: string
  ) => {
    setInspectorData({
      isOpen: true,
      record,
      schema,
      aclResult,
      selectedField: field || '*'
    });

    handleRecordAuditEvent(
      'read',
      String(record[schema.keyField] || record.id),
      aclResult.allowed,
      aclResult.matchedRule?.name,
      `Inspected ACL rule trace on target ${field || 'record'}`
    );
  };

  const handleOpenCreateRecord = () => {
    setRecordEditorData({
      isOpen: true,
      mode: 'create',
      record: null
    });
  };

  const handleOpenEditRecord = (record: Record<string, unknown>) => {
    setRecordEditorData({
      isOpen: true,
      mode: 'edit',
      record
    });
  };

  const handleSaveRecord = (recordData: Record<string, unknown>, mode: 'create' | 'edit') => {
    const currentList = records[currentTable] || [];
    const schema = TABLE_SCHEMAS.find(s => s.id === currentTable) || TABLE_SCHEMAS[0];

    if (mode === 'create') {
      setRecords(prev => ({
        ...prev,
        [currentTable]: [recordData, ...currentList]
      }));
    } else {
      setRecords(prev => ({
        ...prev,
        [currentTable]: currentList.map(r => r.id === recordData.id ? recordData : r)
      }));
    }
  };

  // Toast notifications (avoid window.alert in iframe)
  const [toast, setToast] = useState<{
    type: 'error' | 'success' | 'info';
    message: string;
  } | null>(null);

  const showToast = (type: 'error' | 'success' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(prev => prev && prev.message === message ? null : prev);
    }, 4500);
  };

  const handleDeleteRecord = (record: Record<string, unknown>) => {
    const schema = TABLE_SCHEMAS.find(s => s.id === currentTable) || TABLE_SCHEMAS[0];
    const recordId = String(record[schema.keyField] || record.id);

    // Check delete permission: only admin or SecOps can delete security records or closed tickets
    if (record.state === 'Closed' && !activePersona.roles.includes('admin')) {
      handleRecordAuditEvent('delete', recordId, false, 'Record State Immutability', 'Cannot delete closed or archived records without admin role');
      showToast('error', `Deletion Blocked by ACL: Record ${recordId} is Closed and immutable. Only Administrators can purge archived records.`);
      return;
    }

    if (record.security_incident && !activePersona.roles.includes('sec_ops')) {
      handleRecordAuditEvent('delete', recordId, false, 'Security Incident Purge Guard', 'Cannot delete security incident without sec_ops role');
      showToast('error', `Deletion Blocked by ACL: Record ${recordId} is flagged as SecOps Critical. Requires sec_ops role.`);
      return;
    }

    handleRecordAuditEvent('delete', recordId, true, undefined, 'Record deleted by authorized caller');
    setRecords(prev => ({
      ...prev,
      [currentTable]: prev[currentTable].filter(r => r.id !== record.id)
    }));
    showToast('success', `Record ${recordId} was deleted successfully.`);
  };

  const handleResetRecords = () => {
    setRecords(INITIAL_RECORDS);
  };

  const currentSchema = TABLE_SCHEMAS.find(s => s.id === currentTable) || TABLE_SCHEMAS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activePersona={activePersona}
        onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        ruleCount={rules.length}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'explorer' && (
          <RecordExplorer
            currentTable={currentTable}
            onSelectTable={setCurrentTable}
            records={records[currentTable] || []}
            user={activePersona}
            personas={personas}
            onSelectPersona={setActivePersona}
            rules={rules}
            onOpenInspector={handleOpenInspector}
            onOpenCreateRecord={handleOpenCreateRecord}
            onOpenEditRecord={handleOpenEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onResetRecords={handleResetRecords}
          />
        )}

        {activeTab === 'rules' && (
          <AclRuleStudio
            rules={rules}
            onToggleRule={handleToggleRule}
            onSaveRule={handleSaveRule}
            onDeleteRule={handleDeleteRule}
            personas={personas}
          />
        )}

        {activeTab === 'debugger' && (
          <ScriptDebugger />
        )}

        {activeTab === 'matrix' && (
          <SecurityMatrix rules={rules} />
        )}

        {activeTab === 'audit' && (
          <AuditTrailView
            auditEvents={auditEvents}
            onClearAudit={() => setAuditEvents([])}
          />
        )}
      </main>

      {/* Persona Selection & Custom Identity Modal */}
      <PersonaSelectorModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        personas={personas}
        activePersona={activePersona}
        onSelectPersona={setActivePersona}
        onUpdatePersona={(updated) => {
          setPersonas(prev => {
            const exists = prev.some(p => p.id === updated.id);
            if (exists) return prev.map(p => p.id === updated.id ? updated : p);
            return [...prev, updated];
          });
        }}
      />

      {/* ACL Decision Inspector Modal */}
      {inspectorData && inspectorData.isOpen && (
        <AclInspectorModal
          isOpen={inspectorData.isOpen}
          onClose={() => setInspectorData(null)}
          record={inspectorData.record}
          schema={inspectorData.schema}
          user={activePersona}
          recordAclResult={inspectorData.aclResult}
          selectedField={inspectorData.selectedField}
          onSelectField={(f) => setInspectorData(prev => prev ? { ...prev, selectedField: f } : null)}
        />
      )}

      {/* Record Editor / Mutation Modal */}
      {recordEditorData && recordEditorData.isOpen && (
        <RecordEditorModal
          isOpen={recordEditorData.isOpen}
          onClose={() => setRecordEditorData(null)}
          schema={currentSchema}
          initialRecord={recordEditorData.record}
          mode={recordEditorData.mode}
          user={activePersona}
          rules={rules}
          onSaveRecord={handleSaveRecord}
          onRecordAuditEvent={handleRecordAuditEvent}
        />
      )}

      {/* Export Policy Modal */}
      <ExportPolicyModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        rules={rules}
      />

      {/* Non-blocking Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-200">
          <div className={`p-4 rounded-xl border shadow-2xl flex items-start gap-3 backdrop-blur-md ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
          }`}>
            <div className="flex-1 text-xs leading-relaxed font-mono">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
