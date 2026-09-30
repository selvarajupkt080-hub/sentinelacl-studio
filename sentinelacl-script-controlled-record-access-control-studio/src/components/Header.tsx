import React from 'react';
import { Shield, FileCode2, Sliders, Table2, Terminal, ShieldAlert, Download, UserCheck } from 'lucide-react';
import { UserPersona } from '../types/acl';

interface HeaderProps {
  activeTab: 'explorer' | 'rules' | 'debugger' | 'matrix' | 'audit';
  onSelectTab: (tab: 'explorer' | 'rules' | 'debugger' | 'matrix' | 'audit') => void;
  activePersona: UserPersona;
  onOpenPersonaModal: () => void;
  onOpenExportModal: () => void;
  ruleCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  activePersona,
  onOpenPersonaModal,
  onOpenExportModal,
  ruleCount
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Shield className="w-4 h-4" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold tracking-tight text-white">
            SentinelACL
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Field-Aware Access Control
          </span>
        </div>
      </div>

      {/* Zone 2: Clean text navigation links */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800 text-xs font-medium">
        <button
          onClick={() => onSelectTab('explorer')}
          className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'explorer'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Table2 className="w-3.5 h-3.5" />
          <span>Record Explorer</span>
        </button>

        <button
          onClick={() => onSelectTab('rules')}
          className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>ACL Rules</span>
          <span className="font-mono text-[10px] bg-slate-800/80 px-1.5 py-0.2 rounded text-slate-300">
            {ruleCount}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('debugger')}
          className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'debugger'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Script Debugger</span>
        </button>

        <button
          onClick={() => onSelectTab('matrix')}
          className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Security Matrix</span>
        </button>

        <button
          onClick={() => onSelectTab('audit')}
          className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Audit Trail</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2.5">
        {/* Active Persona Badge & Switcher */}
        <button
          onClick={onOpenPersonaModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-left transition-colors cursor-pointer group"
          title="Click to switch caller persona or clearance level"
        >
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center border border-indigo-500/30">
            {activePersona.avatar}
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
                {activePersona.name}
              </span>
              <span className="text-[10px] font-mono text-indigo-400 border border-indigo-500/30 px-1 rounded">
                {activePersona.clearanceLevel}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>{activePersona.department}</span>
              <span>·</span>
              <span className="font-mono truncate max-w-[100px]">{activePersona.roles[0] || 'no-role'}</span>
            </div>
          </div>
          <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 ml-1" />
        </button>

        {/* Export Code / Policies */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export Policy</span>
        </button>
      </div>
    </header>
  );
};
