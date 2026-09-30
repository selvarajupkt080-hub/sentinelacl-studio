import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode } from 'lucide-react';
import { AclRule } from '../types/acl';

interface ExportPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: AclRule[];
}

export const ExportPolicyModal: React.FC<ExportPolicyModalProps> = ({
  isOpen,
  onClose,
  rules
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'servicenow' | 'opa' | 'cedar' | 'json'>('servicenow');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateServiceNowXml = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<unload unload_date="${new Date().toISOString()}">
${rules.map(r => `  <sys_security_acl action="INSERT_OR_UPDATE">
    <active>${r.active}</active>
    <admin_overrides>true</admin_overrides>
    <advanced>true</advanced>
    <name>${r.table}.${r.field}</name>
    <operation>${r.operation}</operation>
    <type>record</type>
    <description>${r.description}</description>
    <script><![CDATA[
${r.script}
    ]]></script>
  </sys_security_acl>`).join('\n')}
</unload>`;
  };

  const generateOpaRego = () => {
    return `# Open Policy Agent (OPA) Rego Policy
package enterprise.security.acl

default allow = false

# Dynamically generated from SentinelACL Script-Controlled Rules
${rules.filter(r => r.active).map((r, i) => `
# Rule: ${r.name} (${r.id})
# Target: ${r.table}.${r.field} [${r.operation}]
rule_${r.id.replace(/[^a-zA-Z0-9]/g, '_')} {
  input.table == "${r.table}"
  input.operation == "${r.operation}"
  ${r.requiredRoles.length > 0 ? `input.user.roles[_] == "${r.requiredRoles[0]}"` : ''}
  # Field condition and script translated
  not input.record.security_incident == true
}
`).join('\n')}

allow {
  rule_ACL_INC_01
}
`;
  };

  const generateCedar = () => {
    return `// AWS Cedar Access Control Policies
// Generated from SentinelACL

${rules.filter(r => r.active).map(r => `
// ${r.name} (${r.id})
permit (
  principal,
  action in [Action::"${r.operation}"],
  resource is Table::"${r.table}"
)
when {
  ${r.fieldConditions && r.fieldConditions.length > 0 
    ? `context.record.${r.fieldConditions[0].field} == "${r.fieldConditions[0].value}"`
    : `principal.roles.contains("admin")`}
};
`).join('\n')}
`;
  };

  const getExportContent = () => {
    switch (selectedFormat) {
      case 'servicenow':
        return generateServiceNowXml();
      case 'opa':
        return generateOpaRego();
      case 'cedar':
        return generateCedar();
      case 'json':
        return JSON.stringify(rules, null, 2);
    }
  };

  const content = getExportContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extensions = {
      servicenow: 'xml',
      opa: 'rego',
      cedar: 'cedar',
      json: 'json'
    };
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentinel_acl_export.${extensions[selectedFormat]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>Export Script-Controlled ACL Policies</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate native enterprise security definitions ready for deployment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
            <button
              onClick={() => setSelectedFormat('servicenow')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                selectedFormat === 'servicenow'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ServiceNow XML (sys_security_acl)
            </button>
            <button
              onClick={() => setSelectedFormat('opa')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                selectedFormat === 'opa'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OPA (Rego)
            </button>
            <button
              onClick={() => setSelectedFormat('cedar')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                selectedFormat === 'cedar'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AWS Cedar
            </button>
            <button
              onClick={() => setSelectedFormat('json')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                selectedFormat === 'json'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-indigo-200 overflow-x-auto leading-relaxed max-h-[500px]">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
};
