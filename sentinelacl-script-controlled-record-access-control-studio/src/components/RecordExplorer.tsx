import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  SlidersHorizontal, 
  RotateCcw,
  Unlock,
  CheckSquare
} from 'lucide-react';
import { 
  TableId, 
  TableSchema, 
  UserPersona, 
  AclRule, 
  RecordAclResult, 
  AclOperation 
} from '../types/acl';
import { AclEngine } from '../services/aclEngine';
import { TABLE_SCHEMAS } from '../data/mockData';

interface RecordExplorerProps {
  currentTable: TableId;
  onSelectTable: (tableId: TableId) => void;
  records: Record<string, unknown>[];
  user: UserPersona;
  personas?: UserPersona[];
  onSelectPersona?: (persona: UserPersona) => void;
  rules: AclRule[];
  adminMode?: boolean;
  onToggleAdminMode?: (enabled: boolean) => void;
  onOpenInspector: (record: Record<string, unknown>, schema: TableSchema, aclResult: RecordAclResult, field?: string) => void;
  onOpenCreateRecord: () => void;
  onOpenEditRecord: (record: Record<string, unknown>) => void;
  onDeleteRecord: (record: Record<string, unknown>) => void;
  onBulkDeleteRecords?: (recordIds: string[]) => void;
  onDeleteAllRecords?: () => void;
  onResetRecords: () => void;
}

export const RecordExplorer: React.FC<RecordExplorerProps> = ({
  currentTable,
  onSelectTable,
  records,
  user,
  personas = [],
  onSelectPersona,
  rules,
  adminMode = false,
  onToggleAdminMode,
  onOpenInspector,
  onOpenCreateRecord,
  onOpenEditRecord,
  onDeleteRecord,
  onBulkDeleteRecords,
  onDeleteAllRecords,
  onResetRecords
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlockedRows, setShowBlockedRows] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [simulatedOperation, setSimulatedOperation] = useState<AclOperation>('read');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => String(r.record.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} selected records?`)) {
      onBulkDeleteRecords && onBulkDeleteRecords(selectedIds);
      setSelectedIds([]);
    }
  };

  const currentSchema = TABLE_SCHEMAS.find(s => s.id === currentTable) || TABLE_SCHEMAS[0];

  // Evaluate ACL for all records in the table under current user and active rules
  const evaluatedRecords = useMemo(() => {
    return records.map(record => {
      const aclResult = AclEngine.evaluateRecordAccess(
        currentTable,
        record,
        user,
        rules,
        simulatedOperation
      );
      return {
        record,
        aclResult
      };
    });
  }, [records, currentTable, user, rules, simulatedOperation]);

  // Filter based on search query, category, and showBlockedRows setting
  const filteredRecords = useMemo(() => {
    return evaluatedRecords.filter(({ record, aclResult }) => {
      // If user toggled off blocked rows and record is denied at row level
      if (!showBlockedRows && !aclResult.allowed) {
        return false;
      }

      // Category / Dept filter
      if (selectedCategory !== 'all') {
        const catVal = record.category || record.department || record.account_tier;
        if (catVal !== selectedCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = Object.values(record).some(v => 
          String(v ?? '').toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [evaluatedRecords, showBlockedRows, selectedCategory, searchQuery]);

  const blockedCount = evaluatedRecords.filter(r => !r.aclResult.allowed).length;
  const maskedCount = evaluatedRecords.reduce((acc, curr) => {
    const fields = Object.values(curr.aclResult.fieldResults);
    const masked = fields.filter(f => !f.allowed && f.action === 'mask').length;
    return acc + masked;
  }, 0);

  // Helper to format values
  const renderCellValue = (
    fieldName: string, 
    value: unknown, 
    fieldResult?: { allowed: boolean; action: string; maskedValue?: string | number }
  ) => {
    if (fieldResult && !fieldResult.allowed) {
      if (fieldResult.action === 'mask') {
        return (
          <span 
            className="inline-flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 font-semibold cursor-pointer hover:bg-amber-900/50"
            title="Field masked by Script-Controlled ACL. Click to inspect rule trace."
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>{fieldResult.maskedValue || '••••••••'}</span>
          </span>
        );
      }
      if (fieldResult.action === 'hide') {
        return (
          <span className="text-xs text-slate-500 italic">
            [Hidden by policy]
          </span>
        );
      }
    }

    if (value === null || value === undefined || value === '') {
      return <span className="text-slate-600 font-mono">—</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded ${
          value 
            ? 'bg-rose-950/50 text-rose-300 border border-rose-800/60' 
            : 'bg-slate-800 text-slate-400'
        }`}>
          {value ? 'True' : 'False'}
        </span>
      );
    }

    if (typeof value === 'number') {
      if (fieldName.includes('salary') || fieldName.includes('balance') || fieldName.includes('limit')) {
        return <span className="font-mono tabular-nums text-slate-200">₹{value.toLocaleString('en-IN')}</span>;
      }
      return <span className="font-mono tabular-nums text-slate-300">{value}</span>;
    }

    return <span className="text-slate-200">{String(value)}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Table Navigation & Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Table Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          {TABLE_SCHEMAS.map(schema => {
            const isActive = currentTable === schema.id;
            return (
              <button
                key={schema.id}
                onClick={() => onSelectTable(schema.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {schema.label}
              </button>
            );
          })}
        </div>

        {/* Security Metric Strip */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Evaluating as:</span>
            <span className="text-indigo-300 font-semibold">{user.name}</span>
            <span className="text-[10px] text-slate-500 font-sans border border-slate-700 px-1 rounded">
              {user.clearanceLevel}
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Restricted Rows:</span>
            <span className={`font-semibold ${blockedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {blockedCount}
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Masked Fields:</span>
            <span className={`font-semibold ${maskedCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {maskedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Caller Simulation Switcher */}
      {personas.length > 0 && onSelectPersona && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="font-semibold text-slate-300">Quick Test Caller:</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">(Switch to Elena for Admin / Unlocked view)</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {personas.map(p => {
              const isActive = p.id === user.id;
              const isAdmin = p.roles.includes('admin') || p.roles.includes('sec_ops');
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPersona(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                  title={`${p.name} (${p.title}) - Roles: [${p.roles.join(', ')}]`}
                >
                  <span>{p.name.split(' ')[0]} ({p.roles[0]})</span>
                  {isAdmin && <span className="text-[10px] text-emerald-400 font-bold">★</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[300px]">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${currentSchema.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Operation Selector (Simulate Read vs Write ACLs) */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setSimulatedOperation('read')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                simulatedOperation === 'read'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              READ
            </button>
            <button
              onClick={() => setSimulatedOperation('write')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                simulatedOperation === 'write'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              WRITE
            </button>
          </div>

          {/* Toggle Blocked Records Visibility */}
          <button
            onClick={() => setShowBlockedRows(!showBlockedRows)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
              showBlockedRows
                ? 'border-indigo-500/40 bg-indigo-950/30 text-indigo-300'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle whether denied rows are visible in red audit styling or filtered out as end users see"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Show Blocked Records ({blockedCount})</span>
          </button>
        </div>

        {/* Right side: Admin Mode, Clear All, Restore data, Add record */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Bypass Mode */}
          {onToggleAdminMode && (
            <button
              onClick={() => onToggleAdminMode(!adminMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                adminMode
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="When enabled, bypass all delete and write security checks"
            >
              <Unlock className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Admin Mode:</span>
              <span>{adminMode ? 'BYPASS ON' : 'OFF'}</span>
            </button>
          )}

          {/* Delete All Records / Clear Table */}
          {onDeleteAllRecords && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ALL records in ${currentSchema.label}?`)) {
                  onDeleteAllRecords();
                  setSelectedIds([]);
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-900/50 cursor-pointer"
              title="Delete all records from this table"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Table</span>
            </button>
          )}

          {/* Restore sample records */}
          <button
            onClick={() => {
              onResetRecords();
              setSelectedIds([]);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 cursor-pointer"
            title="Reset dataset to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Restore Defaults</span>
          </button>

          {/* Add record */}
          <button
            onClick={onOpenCreateRecord}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 animate-in fade-in shadow-lg">
          <div className="flex items-center gap-2 font-mono">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <span>{selectedIds.length} of {filteredRecords.length} records selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 rounded-md text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-4 font-semibold w-12 text-center">Status</th>
                {currentSchema.fields.map(f => (
                  <th key={f.name} className="py-2.5 px-4 font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{f.label}</span>
                      {f.sensitive && (
                        <span title="Restricted field under ACL">
                          <Lock className="w-3 h-3 text-amber-400" />
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-4 font-semibold text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={currentSchema.fields.length + 2} className="py-12 text-center text-slate-500">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-sm font-semibold text-slate-400">No records found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {blockedCount > 0 && !showBlockedRows
                        ? `${blockedCount} records are completely hidden by current ACL policies for ${user.name}. Enable "Show Blocked Records" to inspect.`
                        : 'No records match your search filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(({ record, aclResult }) => {
                  const isBlocked = !aclResult.allowed;
                  const rowKey = String(record[currentSchema.keyField] || record.id);

                  return (
                    <tr
                      key={rowKey}
                      className={`transition-colors group ${
                        isBlocked
                          ? 'bg-rose-950/20 hover:bg-rose-950/30'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Security Status Indicator */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onOpenInspector(record, currentSchema, aclResult, '*')}
                          className="cursor-pointer"
                          title={`Click to inspect ACL: ${aclResult.reason}`}
                        >
                          {isBlocked ? (
                            <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                              <Lock className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Fields */}
                      {currentSchema.fields.map(f => {
                        const fRes = aclResult.fieldResults[f.name];
                        const val = record[f.name];

                        // If entire row is blocked and we are inspecting
                        if (isBlocked && f.name !== currentSchema.keyField && f.name !== 'category' && f.name !== 'department') {
                          return (
                            <td key={f.name} className="py-3 px-4">
                              <span className="font-mono text-slate-600 text-xs select-none">
                                ••••••••
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={f.name} 
                            className="py-3 px-4 max-w-xs truncate"
                            onClick={() => {
                              if (fRes && !fRes.allowed) {
                                onOpenInspector(record, currentSchema, aclResult, f.name);
                              }
                            }}
                          >
                            {renderCellValue(f.name, val, fRes)}
                          </td>
                        );
                      })}

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => onOpenInspector(record, currentSchema, aclResult, '*')}
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                            title="Inspect ACL rule decision and script trace"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenEditRecord(record)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                            title="Test Write ACL mutation"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteRecord(record)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Test Delete ACL restriction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing {filteredRecords.length} of {records.length} records in {currentSchema.label}</span>
            {blockedCount > 0 && (
              <span className="text-rose-400 font-mono">
                ({blockedCount} restricted by Script-Controlled ACLs)
              </span>
            )}
          </div>
          <div className="text-slate-500 font-mono">
            Table ID: {currentSchema.id}
          </div>
        </div>
      </div>
    </div>
  );
};
