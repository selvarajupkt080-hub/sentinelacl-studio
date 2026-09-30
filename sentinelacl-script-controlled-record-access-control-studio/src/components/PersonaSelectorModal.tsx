import React, { useState } from 'react';
import { X, Check, User, Briefcase, Award, Plus } from 'lucide-react';
import { UserPersona, ClearanceLevel } from '../types/acl';

interface PersonaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  personas: UserPersona[];
  activePersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
  onUpdatePersona: (persona: UserPersona) => void;
}

const CLEARANCE_LEVELS: ClearanceLevel[] = ['Public', 'Standard', 'Confidential', 'Secret', 'Top Secret'];

const COMMON_ROLES = [
  'itil', 'helpdesk_agent', 'sec_ops', 'admin', 
  'physician', 'hipaa_certified', 'clinical_staff',
  'hr_admin', 'payroll_reader', 
  'finance_officer', 'wealth_manager'
];

export const PersonaSelectorModal: React.FC<PersonaSelectorModalProps> = ({
  isOpen,
  onClose,
  personas,
  activePersona,
  onSelectPersona,
  onUpdatePersona
}) => {
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customForm, setCustomForm] = useState<UserPersona>({
    id: 'user_custom',
    name: 'Custom Identity',
    email: 'custom.agent@sentinel.corp',
    avatar: 'CI',
    department: 'Engineering',
    title: 'Security Architect',
    roles: ['itil'],
    clearanceLevel: 'Standard',
    delegatedLimit: 50000
  });

  const [newRoleInput, setNewRoleInput] = useState('');

  if (!isOpen) return null;

  const handleSaveCustom = () => {
    onUpdatePersona(customForm);
    onSelectPersona(customForm);
    setIsEditingCustom(false);
    onClose();
  };

  const handleToggleRole = (role: string) => {
    const exists = customForm.roles.includes(role);
    const updated = exists 
      ? customForm.roles.filter(r => r !== role)
      : [...customForm.roles, role];
    setCustomForm({ ...customForm, roles: updated });
  };

  const handleAddCustomRole = () => {
    if (newRoleInput.trim() && !customForm.roles.includes(newRoleInput.trim())) {
      setCustomForm({
        ...customForm,
        roles: [...customForm.roles, newRoleInput.trim()]
      });
      setNewRoleInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Simulate Caller Persona</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Switch caller identity to test real-time Script-Controlled ACL evaluation across records and fields
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!isEditingCustom ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {personas.map((persona) => {
                  const isActive = activePersona.id === persona.id;
                  return (
                    <div
                      key={persona.id}
                      onClick={() => {
                        onSelectPersona(persona);
                        onClose();
                      }}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 font-mono font-bold flex items-center justify-center text-sm">
                            {persona.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">
                                {persona.name}
                              </span>
                              {isActive && (
                                <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{persona.title}</p>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300">
                          {persona.clearanceLevel}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-500" />
                          <span>{persona.department}</span>
                        </div>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-slate-500" />
                          <span className="font-mono text-[11px] text-indigo-300">
                            {persona.roles.join(', ')}
                          </span>
                        </div>
                        {persona.delegatedLimit !== undefined && (
                          <>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="font-mono text-[11px] text-emerald-400">
                              Limit: ₹{persona.delegatedLimit.toLocaleString('en-IN')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Identity Option */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Custom Dynamic Persona</h4>
                  <p className="text-xs text-slate-400">
                    Configure custom departments, clearance, and role combinations
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingCustom(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Configure Custom Persona
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={customForm.title}
                    onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={customForm.department}
                    onChange={(e) => setCustomForm({ ...customForm, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Support">Support</option>
                    <option value="Security">Security</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Wealth Management">Wealth Management</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Security Clearance
                  </label>
                  <select
                    value={customForm.clearanceLevel}
                    onChange={(e) => setCustomForm({ ...customForm, clearanceLevel: e.target.value as ClearanceLevel })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    {CLEARANCE_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Delegated Financial Authority Limit (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={customForm.delegatedLimit || 0}
                    onChange={(e) => setCustomForm({ ...customForm, delegatedLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 500000"
                  />
                </div>
              </div>

              {/* Roles Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Assigned Roles
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                  {COMMON_ROLES.map((role) => {
                    const isChecked = customForm.roles.includes(role);
                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => handleToggleRole(role)}
                        className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {role}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Add custom role tag..."
                    value={newRoleInput}
                    onChange={(e) => setNewRoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomRole();
                      }
                    }}
                    className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono flex-1 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomRole}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingCustom(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  Apply Custom Persona
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
