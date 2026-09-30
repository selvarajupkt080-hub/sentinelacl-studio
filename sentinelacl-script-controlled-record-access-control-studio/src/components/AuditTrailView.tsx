import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Download, 
  Trash2, 
  Clock, 
  Lock 
} from 'lucide-react';
import { AuditEvent } from '../types/acl';

interface AuditTrailViewProps {
  auditEvents: AuditEvent[];
  onClearAudit: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  auditEvents,
  onClearAudit
}) => {
  const [filterType, setFilterType] = useState<'all' | 'granted' | 'denied'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = auditEvents.filter(ev => {
    if (filterType === 'granted' && !ev.granted) return false;
    if (filterType === 'denied' && ev.granted) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ev.userName.toLowerCase().includes(q) ||
        ev.table.toLowerCase().includes(q) ||
        ev.recordId.toLowerCase().includes(q) ||
        ev.reason.toLowerCase().includes(q) ||
        (ev.ruleName && ev.ruleName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'User', 'Table', 'RecordId', 'Operation', 'Decision', 'RuleName', 'Reason'];
    const rows = filteredEvents.map(e => [
      `"${e.timestamp}"`,
      `"${e.userName}"`,
      `"${e.table}"`,
      `"${e.recordId}"`,
      `"${e.operation}"`,
      `"${e.granted ? 'GRANTED' : 'DENIED'}"`,
      `"${e.ruleName || 'Default'}"`,
      `"${e.reason.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `acl_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deniedCount = auditEvents.filter(e => !e.granted).length;
  const grantedCount = auditEvents.filter(e => e.granted).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <span>Real-Time Security & ACL Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of record read, write, and mutation evaluations with policy violation traces
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={filteredEvents.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onClearAudit}
            disabled={auditEvents.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 block">Total Access Events</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {auditEvents.length}
          </span>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 block">Access Denials / Violations</span>
          <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
            {deniedCount}
          </span>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 block">Authorized Operations</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {grantedCount}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by user, record, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Events ({auditEvents.length})
            </button>
            <button
              onClick={() => setFilterType('denied')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterType === 'denied'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Denials ({deniedCount})
            </button>
            <button
              onClick={() => setFilterType('granted')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterType === 'granted'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Granted ({grantedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-4 font-semibold w-24">Decision</th>
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">User</th>
                <th className="py-2.5 px-4 font-semibold">Table & Record</th>
                <th className="py-2.5 px-4 font-semibold">Op</th>
                <th className="py-2.5 px-4 font-semibold">Matched Rule</th>
                <th className="py-2.5 px-4 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-sm font-semibold text-slate-400">No audit events logged</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Interact with records, run test mutations, or switch users to populate the trail.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      !ev.granted ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      {ev.granted ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                          <ShieldCheck className="w-3 h-3" /> ALLOWED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-rose-500/30 text-rose-300 bg-rose-500/10">
                          <Lock className="w-3 h-3" /> DENIED
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {ev.timestamp}
                    </td>

                    <td className="py-2.5 px-4 font-medium text-white whitespace-nowrap">
                      {ev.userName}
                    </td>

                    <td className="py-2.5 px-4 font-mono">
                      <span className="text-slate-400">{ev.table}</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span className="text-indigo-300">{ev.recordId}</span>
                    </td>

                    <td className="py-2.5 px-4 font-mono uppercase text-slate-300">
                      {ev.operation}
                    </td>

                    <td className="py-2.5 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap truncate max-w-[180px]">
                      {ev.ruleName || 'Baseline Rule'}
                    </td>

                    <td className="py-2.5 px-4 text-slate-400 leading-snug">
                      {ev.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
