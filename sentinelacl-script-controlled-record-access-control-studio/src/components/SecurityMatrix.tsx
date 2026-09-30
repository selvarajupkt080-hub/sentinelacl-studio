import React, { useState } from 'react';
import { 
  FileCode2, 
  ShieldCheck, 
  Lock, 
  X
} from 'lucide-react';
import { AclRule, TableId } from '../types/acl';
import { TABLE_SCHEMAS } from '../data/mockData';

interface SecurityMatrixProps {
  rules: AclRule[];
}

const ROLES_TO_DISPLAY = [
  'itil',
  'sec_ops',
  'admin',
  'physician',
  'clinical_staff',
  'hr_admin',
  'finance_officer',
  'wealth_manager'
];

interface MatrixRowItem {
  tableId: TableId;
  target: string;
  isField: boolean;
  sensitive?: boolean;
  label: string;
}

export const SecurityMatrix: React.FC<SecurityMatrixProps> = ({ rules }) => {
  const [selectedCell, setSelectedCell] = useState<{
    row: MatrixRowItem;
    role: string;
    matchingRules: AclRule[];
  } | null>(null);

  // Generate rows: Table records and sensitive fields
  const rows: MatrixRowItem[] = [];
  TABLE_SCHEMAS.forEach(schema => {
    // Record level
    rows.push({
      tableId: schema.id,
      target: '*',
      isField: false,
      label: `${schema.label} (Row-Level Access)`
    });

    // Sensitive fields
    schema.fields.filter(f => f.sensitive).forEach(f => {
      rows.push({
        tableId: schema.id,
        target: f.name,
        isField: true,
        sensitive: true,
        label: `${schema.label} · ${f.label} (${f.name})`
      });
    });
  });

  const getCellStatus = (row: MatrixRowItem, role: string) => {
    // Check if any rule targets this table and field/record
    const matching = rules.filter(r => 
      r.active && 
      (r.table === row.tableId || r.table === '*') &&
      (row.isField ? (r.field === row.target || r.field === '*') : (r.targetType === 'record'))
    );

    if (matching.length === 0) {
      return { status: 'open', label: 'Default Open', color: 'text-slate-400 bg-slate-900/40', rules: [] };
    }

    // If role has admin, almost always allowed
    if (role === 'admin') {
      return { status: 'allowed', label: 'Full Access (Admin)', color: 'text-emerald-400 bg-emerald-950/30', rules: matching };
    }

    // Check if any rule has explicit required roles that include this role or restrict
    const hasRoleRestricted = matching.some(r => r.requiredRoles && r.requiredRoles.length > 0 && !r.requiredRoles.includes(role));
    const hasMasking = matching.some(r => r.denyAction === 'mask');
    const hasScript = matching.some(r => r.conditionMode === 'script' || r.conditionMode === 'both');

    if (hasMasking) {
      return { 
        status: 'conditional_mask', 
        label: 'Field Value Masked', 
        color: 'text-amber-400 bg-amber-950/40 border border-amber-800/50', 
        rules: matching 
      };
    }

    if (hasScript) {
      return { 
        status: 'script_controlled', 
        label: 'Field-Value Script', 
        color: 'text-indigo-300 bg-indigo-950/40 border border-indigo-800/50', 
        rules: matching 
      };
    }

    if (hasRoleRestricted) {
      return { 
        status: 'restricted', 
        label: 'Role Restricted', 
        color: 'text-rose-400 bg-rose-950/40 border border-rose-800/50', 
        rules: matching 
      };
    }

    return { status: 'allowed', label: 'Authorized', color: 'text-emerald-400 bg-emerald-950/30', rules: matching };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-indigo-400" />
            <span>Role & Field Access Control Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Two-dimensional mapping of roles against protected records and sensitive fields
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" />
            <span className="text-slate-300">Authorized</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/60" />
            <span className="text-slate-300">Masked by Value</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/60" />
            <span className="text-slate-300">Field-Value Script</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/60" />
            <span className="text-slate-300">Restricted</span>
          </div>
        </div>
      </div>

      {/* Sensitive Fields Protection Audit Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 block">Total Active ACL Rules</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {rules.filter(r => r.active).length}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Across 4 enterprise tables</span>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 block">Protected Sensitive Fields</span>
          <span className="text-xl font-bold font-mono text-indigo-400 mt-1 block">
            8 / 8
          </span>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">100% Policy Shielded</span>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 block">Script-Controlled Rules</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {rules.filter(r => r.active && (r.conditionMode === 'script' || r.conditionMode === 'both')).length}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Dynamic JS evaluation</span>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 block">Field Masking Policies</span>
          <span className="text-xl font-bold font-mono text-sky-400 mt-1 block">
            {rules.filter(r => r.active && r.denyAction === 'mask').length}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Dynamic redaction active</span>
        </div>
      </div>

      {/* 2D Matrix Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-mono text-[11px]">
                <th className="py-3 px-4 font-semibold min-w-[240px]">
                  Protected Scope / Field
                </th>
                {ROLES_TO_DISPLAY.map(role => (
                  <th key={role} className="py-3 px-3 font-semibold text-center whitespace-nowrap min-w-[110px]">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {rows.map((row, idx) => {
                return (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {row.sensitive ? (
                          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-white text-xs">
                            {row.label}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Table: {row.tableId} · Target: {row.target}
                          </div>
                        </div>
                      </div>
                    </td>

                    {ROLES_TO_DISPLAY.map(role => {
                      const info = getCellStatus(row, role);
                      return (
                        <td key={role} className="py-3 px-2 text-center">
                          <button
                            onClick={() => setSelectedCell({ row, role, matchingRules: info.rules })}
                            className={`w-full py-1.5 px-2 rounded font-mono text-[10px] font-semibold transition-all cursor-pointer truncate ${info.color}`}
                            title={`Click to view policy details for ${row.target} on role ${role}`}
                          >
                            {info.label}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Cell Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Access Policy Breakdown</h3>
                <p className="text-xs text-slate-400">
                  Target: <span className="text-indigo-300 font-mono">{selectedCell.row.label}</span> · Role: <span className="text-amber-300 font-mono">{selectedCell.role}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedCell.matchingRules.length === 0 ? (
                <div className="text-xs text-slate-400 p-3 bg-slate-950 rounded-lg">
                  No specific restrictive ACL governs this field for this role. Baseline table read permissions apply.
                </div>
              ) : (
                selectedCell.matchingRules.map(r => (
                  <div key={r.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-indigo-300">{r.id}</span>
                      <span className="text-slate-400 text-[10px]">{r.denyAction.toUpperCase()}</span>
                    </div>
                    <div className="text-white font-medium">{r.name}</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{r.description}</p>
                    <div className="pt-2">
                      <pre className="p-2 bg-slate-900 rounded font-mono text-[10px] text-emerald-300 overflow-x-auto">
                        {r.script.slice(0, 150)}...
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
