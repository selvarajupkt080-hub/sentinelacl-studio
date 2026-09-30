import { TableSchema, UserPersona, AclRule, TableId } from '../types/acl';

export const TABLE_SCHEMAS: TableSchema[] = [
  {
    id: 'incident',
    label: 'ITSM Incidents',
    description: 'IT Service Management operational incident tickets and outages',
    keyField: 'number',
    fields: [
      { name: 'number', label: 'Ticket #', type: 'badge' },
      { name: 'short_description', label: 'Summary', type: 'string' },
      { name: 'category', label: 'Category', type: 'string', options: ['Security', 'Infrastructure', 'Software', 'Network', 'Database'] },
      { name: 'urgency', label: 'Urgency', type: 'status', options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'state', label: 'State', type: 'status', options: ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed'] },
      { name: 'department', label: 'Department', type: 'string', options: ['Support', 'Security', 'Engineering', 'Finance', 'Operations'] },
      { name: 'assigned_to', label: 'Assignee', type: 'string' },
      { name: 'security_incident', label: 'SecOps Critical', type: 'boolean', sensitive: true },
      { name: 'work_notes_internal', label: 'Internal Work Notes (Sensitive)', type: 'string', sensitive: true },
      { name: 'resolution_code', label: 'Resolution Code', type: 'string' }
    ]
  },
  {
    id: 'customer_financial',
    label: 'Customer Financials',
    description: 'Banking client accounts, credit limits, balances, and risk assessments',
    keyField: 'account_number',
    fields: [
      { name: 'account_number', label: 'Account #', type: 'badge' },
      { name: 'client_name', label: 'Client / Entity', type: 'string' },
      { name: 'account_tier', label: 'Tier', type: 'badge', options: ['Standard', 'Gold', 'Private Wealth', 'Corporate'] },
      { name: 'balance', label: 'Balance', type: 'currency' },
      { name: 'credit_limit', label: 'Credit Limit', type: 'currency' },
      { name: 'risk_score', label: 'Risk Score (0-100)', type: 'number' },
      { name: 'assigned_officer', label: 'Relationship Mgr', type: 'string' },
      { name: 'kyc_status', label: 'KYC Status', type: 'status', options: ['Verified', 'Pending', 'Flagged'] },
      { name: 'ssn_tax_id', label: 'Tax ID / SSN', type: 'string', sensitive: true },
      { name: 'routing_number', label: 'Wire Routing', type: 'string', sensitive: true }
    ]
  },
  {
    id: 'patient_record',
    label: 'Clinical Patient Records',
    description: 'HIPAA protected health records, diagnoses, and restricted care plans',
    keyField: 'mrn',
    fields: [
      { name: 'mrn', label: 'Medical Record #', type: 'badge' },
      { name: 'patient_name', label: 'Patient Name', type: 'string' },
      { name: 'dob', label: 'Date of Birth', type: 'date' },
      { name: 'attending_physician', label: 'Physician', type: 'string' },
      { name: 'department', label: 'Ward / Clinic', type: 'string', options: ['Cardiology', 'Oncology', 'Psychiatry', 'Pediatrics', 'Neurology'] },
      { name: 'diagnosis', label: 'Primary Diagnosis', type: 'string', sensitive: true },
      { name: 'medications', label: 'Active Regimen', type: 'string', sensitive: true },
      { name: 'is_vip', label: 'VIP Patient', type: 'boolean', sensitive: true },
      { name: 'mental_health_flag', label: 'Psych Care Flag', type: 'boolean', sensitive: true },
      { name: 'insurance_policy', label: 'Policy #', type: 'string' }
    ]
  },
  {
    id: 'hr_payroll',
    label: 'HR Compensation & Payroll',
    description: 'Internal employee compensation, salary structures, bonuses, and ratings',
    keyField: 'emp_id',
    fields: [
      { name: 'emp_id', label: 'Employee ID', type: 'badge' },
      { name: 'employee_name', label: 'Employee Name', type: 'string' },
      { name: 'department', label: 'Department', type: 'string', options: ['Engineering', 'Support', 'Security', 'Human Resources', 'Finance'] },
      { name: 'job_title', label: 'Title', type: 'string' },
      { name: 'base_salary', label: 'Base Salary (Annual)', type: 'currency', sensitive: true },
      { name: 'bonus_target', label: 'Bonus Target %', type: 'number', sensitive: true },
      { name: 'performance_rating', label: 'Rating (1-5)', type: 'number', sensitive: true },
      { name: 'disciplinary_flag', label: 'Disciplinary Status', type: 'boolean', sensitive: true },
      { name: 'direct_manager', label: 'Reporting Manager', type: 'string' }
    ]
  }
];

export const MOCK_PERSONAS: UserPersona[] = [
  {
    id: 'user_marcus',
    name: 'Marcus Kane',
    email: 'marcus.kane@sentinel.corp',
    avatar: 'MK',
    department: 'Support',
    title: 'Senior Service Desk Analyst',
    roles: ['itil', 'helpdesk_agent'],
    clearanceLevel: 'Standard',
    managerId: 'David Chen',
    delegatedLimit: 100000
  },
  {
    id: 'user_elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@sentinel.corp',
    avatar: 'ER',
    department: 'Security',
    title: 'SecOps Lead & Threat Responder',
    roles: ['itil', 'sec_ops', 'admin'],
    clearanceLevel: 'Top Secret',
    managerId: 'Chief Information Security Officer',
    delegatedLimit: 2500000
  },
  {
    id: 'user_dr_julian',
    name: 'Dr. Julian Hayes',
    email: 'julian.hayes@medcenter.org',
    avatar: 'JH',
    department: 'Cardiology',
    title: 'Chief Attending Cardiologist',
    roles: ['physician', 'hipaa_certified'],
    clearanceLevel: 'Secret',
    managerId: 'Chief Medical Officer',
    delegatedLimit: 500000
  },
  {
    id: 'user_sarah_nurse',
    name: 'Sarah Lin',
    email: 'sarah.lin@medcenter.org',
    avatar: 'SL',
    department: 'Cardiology',
    title: 'Charge Nurse & Clinical Care',
    roles: ['clinical_staff'],
    clearanceLevel: 'Standard',
    managerId: 'Dr. Julian Hayes',
    delegatedLimit: 50000
  },
  {
    id: 'user_rajesh',
    name: 'Rajesh Patel',
    email: 'rajesh.patel@sentinel.corp',
    avatar: 'RP',
    department: 'Human Resources',
    title: 'HR People Operations Partner',
    roles: ['hr_admin', 'payroll_reader'],
    clearanceLevel: 'Confidential',
    managerId: 'VP HR',
    delegatedLimit: 750000
  },
  {
    id: 'user_arthur',
    name: 'Arthur Vance',
    email: 'arthur.vance@sentinel.corp',
    avatar: 'AV',
    department: 'Wealth Management',
    title: 'Private Wealth Relationship Officer',
    roles: ['finance_officer', 'wealth_manager'],
    clearanceLevel: 'Confidential',
    managerId: 'Managing Director Wealth',
    delegatedLimit: 10000000
  }
];

export const INITIAL_RECORDS: Record<TableId, Record<string, unknown>[]> = {
  incident: [
    {
      id: 'inc-001',
      number: 'INC0089201',
      short_description: 'Core VPN gateway latency spike across EMEA gateway',
      category: 'Network',
      urgency: 'Medium',
      state: 'In Progress',
      department: 'Support',
      assigned_to: 'Marcus Kane',
      security_incident: false,
      work_notes_internal: 'Restarted node 4B; ping times stabilized at 22ms. Pending DNS propagation check.',
      resolution_code: 'Pending'
    },
    {
      id: 'inc-002',
      number: 'INC0089244',
      short_description: 'Suspected credential stuffing attack on SSO customer portal',
      category: 'Security',
      urgency: 'Critical',
      state: 'In Progress',
      department: 'Security',
      assigned_to: 'Elena Rostova',
      security_incident: true,
      work_notes_internal: 'Origin IP range 185.220.101.0/24 attacking auth service. Revoked active session tokens and alerted SOC tier 3.',
      resolution_code: 'Investigating'
    },
    {
      id: 'inc-003',
      number: 'INC0089190',
      short_description: 'Quarterly financial ledger database indexing job stalled',
      category: 'Database',
      urgency: 'High',
      state: 'Resolved',
      department: 'Finance',
      assigned_to: 'David Chen',
      security_incident: false,
      work_notes_internal: 'Vacuum full completed on ledger_entries table. Lock cleared without transaction rollback.',
      resolution_code: 'Config Fix'
    },
    {
      id: 'inc-004',
      number: 'INC0089155',
      short_description: 'Production zero-day vulnerability CVE-2026-4412 patched on egress router',
      category: 'Security',
      urgency: 'Critical',
      state: 'Closed',
      department: 'Security',
      assigned_to: 'Elena Rostova',
      security_incident: true,
      work_notes_internal: 'Firmware upgraded to v14.2-hotfix3 under emergency change CHG003921. Hash validated.',
      resolution_code: 'Patched'
    },
    {
      id: 'inc-005',
      number: 'INC0089302',
      short_description: 'Customer onboarding portal email verification timeout',
      category: 'Software',
      urgency: 'Low',
      state: 'New',
      department: 'Support',
      assigned_to: 'Unassigned',
      security_incident: false,
      work_notes_internal: 'SMTP queue rate limiting observed during 9 AM UTC peak load.',
      resolution_code: 'Pending'
    }
  ],

  customer_financial: [
    {
      id: 'fin-101',
      account_number: 'ACC-883019',
      client_name: 'Apex Robotics LLC',
      account_tier: 'Corporate',
      balance: 1450000,
      credit_limit: 5000000,
      risk_score: 18,
      assigned_officer: 'Arthur Vance',
      kyc_status: 'Verified',
      ssn_tax_id: '94-3829104',
      routing_number: '021000021'
    },
    {
      id: 'fin-102',
      account_number: 'ACC-883042',
      client_name: 'Kensington Global Trust',
      account_tier: 'Private Wealth',
      balance: 8400000,
      credit_limit: 12000000,
      risk_score: 12,
      assigned_officer: 'Arthur Vance',
      kyc_status: 'Verified',
      ssn_tax_id: '13-9081245',
      routing_number: '026009593'
    },
    {
      id: 'fin-103',
      account_number: 'ACC-883088',
      client_name: 'Vanguard Retail Holdings',
      account_tier: 'Standard',
      balance: 42500,
      credit_limit: 150000,
      risk_score: 64,
      assigned_officer: 'Michael Scott',
      kyc_status: 'Pending',
      ssn_tax_id: '47-1928374',
      routing_number: '121000358'
    },
    {
      id: 'fin-104',
      account_number: 'ACC-883112',
      client_name: 'Starlight Media Ventures',
      account_tier: 'Gold',
      balance: 890000,
      credit_limit: 2000000,
      risk_score: 41,
      assigned_officer: 'David Chen',
      kyc_status: 'Flagged',
      ssn_tax_id: '82-5591203',
      routing_number: '071000013'
    }
  ],

  patient_record: [
    {
      id: 'pat-201',
      mrn: 'MRN-44910',
      patient_name: 'Eleanor Vance',
      dob: '1974-05-14',
      attending_physician: 'Dr. Julian Hayes',
      department: 'Cardiology',
      diagnosis: 'Severe Mitral Valve Regurgitation, NYHA Class III',
      medications: 'Furosemide 40mg daily, Lisinopril 10mg, Metoprolol 50mg',
      is_vip: false,
      mental_health_flag: false,
      insurance_policy: 'POL-BLUE-9942'
    },
    {
      id: 'pat-202',
      mrn: 'MRN-44933',
      patient_name: 'Senator Robert Sterling',
      dob: '1962-11-29',
      attending_physician: 'Dr. Julian Hayes',
      department: 'Cardiology',
      diagnosis: 'Hypertensive Cardiomyopathy, Recurrent Syncope',
      medications: 'Amlodipine 10mg, Hydrochlorothiazide 25mg',
      is_vip: true,
      mental_health_flag: false,
      insurance_policy: 'POL-CONGRESS-001'
    },
    {
      id: 'pat-203',
      mrn: 'MRN-44980',
      patient_name: 'Claire Delgado',
      dob: '1989-08-03',
      attending_physician: 'Dr. Evelyn Reed',
      department: 'Psychiatry',
      diagnosis: 'Major Depressive Disorder with Psychotic Features',
      medications: 'Sertraline 150mg, Quetiapine 100mg QHS',
      is_vip: false,
      mental_health_flag: true,
      insurance_policy: 'POL-AETNA-8812'
    },
    {
      id: 'pat-204',
      mrn: 'MRN-45012',
      patient_name: 'Jonathan Miller',
      dob: '1995-02-18',
      attending_physician: 'Dr. Julian Hayes',
      department: 'Cardiology',
      diagnosis: 'Supraventricular Tachycardia, post-cardiac ablation',
      medications: 'Propranolol 20mg PRN',
      is_vip: false,
      mental_health_flag: false,
      insurance_policy: 'POL-UNITED-3301'
    }
  ],

  hr_payroll: [
    {
      id: 'hr-301',
      emp_id: 'EMP-0012',
      employee_name: 'Marcus Kane',
      department: 'Support',
      job_title: 'Senior Service Desk Analyst',
      base_salary: 820000,
      bonus_target: 8,
      performance_rating: 4.2,
      disciplinary_flag: false,
      direct_manager: 'David Chen'
    },
    {
      id: 'hr-302',
      emp_id: 'EMP-0004',
      employee_name: 'Elena Rostova',
      department: 'Security',
      job_title: 'SecOps Lead & Threat Responder',
      base_salary: 1650000,
      bonus_target: 20,
      performance_rating: 4.9,
      disciplinary_flag: false,
      direct_manager: 'Chief Information Security Officer'
    },
    {
      id: 'hr-303',
      emp_id: 'EMP-0028',
      employee_name: 'Rajesh Patel',
      department: 'Human Resources',
      job_title: 'HR People Operations Partner',
      base_salary: 1150000,
      bonus_target: 15,
      performance_rating: 4.5,
      disciplinary_flag: false,
      direct_manager: 'VP HR'
    },
    {
      id: 'hr-304',
      emp_id: 'EMP-0099',
      employee_name: 'Thomas Drake',
      department: 'Engineering',
      job_title: 'Staff Distributed Systems Engineer',
      base_salary: 1980000,
      bonus_target: 25,
      performance_rating: 3.8,
      disciplinary_flag: true,
      direct_manager: 'VP Engineering'
    }
  ]
};

export const INITIAL_ACL_RULES: AclRule[] = [
  // 1. INCIDENT: Record-Level READ Restriction based on field: security_incident
  {
    id: 'ACL-INC-01',
    name: 'Restrict Security Incidents to SecOps and Top Secret Clearance',
    table: 'incident',
    targetType: 'record',
    field: '*',
    operation: 'read',
    active: true,
    requiredRoles: [],
    conditionMode: 'both',
    fieldConditions: [
      { field: 'security_incident', operator: 'equals', value: true }
    ],
    script: `// Restrict incident access if security_incident == true
if (current.security_incident === true) {
  gs.log("Evaluating security ticket: " + current.number);
  // Allowed if user has 'sec_ops' role or Top Secret clearance
  if (user.hasRole('sec_ops') || user.clearanceLevel === 'Top Secret') {
    gs.log("Access GRANTED: User holds SecOps role or Top Secret clearance.");
    answer = true;
  } else {
    gs.log("Access DENIED: Classified security incident requires sec_ops role.");
    answer = false;
  }
} else {
  // Non-security incidents are accessible to ITIL / helpdesk staff
  answer = user.hasRole('itil') || user.hasRole('helpdesk_agent');
}`,
    denyAction: 'hide',
    description: 'When an incident has security_incident=true, only callers with sec_ops role or Top Secret clearance can read the record. Others cannot see or query it.',
    lastModified: '2026-09-28 14:20:00'
  },

  // 2. INCIDENT: Field-Level READ Restriction: work_notes_internal
  {
    id: 'ACL-INC-02',
    name: 'Mask Internal Work Notes on High/Critical Incidents for Non-Assignees',
    table: 'incident',
    targetType: 'field',
    field: 'work_notes_internal',
    operation: 'read',
    active: true,
    requiredRoles: [],
    conditionMode: 'both',
    fieldConditions: [
      { field: 'urgency', operator: 'in_list', value: 'High,Critical' }
    ],
    script: `// High or Critical incident internal notes require assignee match or admin/sec_ops
if (current.urgency === 'High' || current.urgency === 'Critical') {
  if (user.name === current.assigned_to || user.hasRole('admin') || user.hasRole('sec_ops')) {
    answer = true;
  } else {
    gs.log("Field Masked: Work notes restricted to assignee (" + current.assigned_to + ") or Admin.");
    answer = false;
  }
} else {
  answer = true;
}`,
    denyAction: 'mask',
    description: 'Masks sensitive internal work notes on High/Critical incidents unless the viewer is the assigned owner, admin, or sec_ops.',
    lastModified: '2026-09-29 09:12:00'
  },

  // 3. INCIDENT: Record-Level WRITE Restriction: state == 'Closed'
  {
    id: 'ACL-INC-03',
    name: 'Lock Closed Incidents from Modification (Immutability)',
    table: 'incident',
    targetType: 'record',
    field: '*',
    operation: 'write',
    active: true,
    requiredRoles: [],
    conditionMode: 'both',
    fieldConditions: [
      { field: 'state', operator: 'equals', value: 'Closed' }
    ],
    script: `// Once an incident is 'Closed', records are read-only except for system administrators
if (current.state === 'Closed') {
  if (user.hasRole('admin')) {
    gs.log("Admin override allowed for closed ticket modification.");
    answer = true;
  } else {
    gs.log("Write DENIED: Incident is closed and locked for audit compliance.");
    answer = false;
  }
} else {
  // Open tickets can be updated if user belongs to same department or is assignee
  answer = (user.name === current.assigned_to) || (user.department === current.department) || user.hasRole('admin');
}`,
    denyAction: 'readonly',
    description: 'Prevents updates or deletions to any incident where state == Closed, unless the user possesses the admin role.',
    lastModified: '2026-09-25 11:45:00'
  },

  // 4. CUSTOMER FINANCIAL: Field-Level Restriction on SSN and Routing
  {
    id: 'ACL-FIN-01',
    name: 'Mask Client Tax ID & Routing for Accounts Balance > ₹25,00,000 (₹25 Lakhs)',
    table: 'customer_financial',
    targetType: 'field',
    field: 'ssn_tax_id',
    operation: 'read',
    active: true,
    requiredRoles: ['finance_officer'],
    conditionMode: 'both',
    fieldConditions: [
      { field: 'balance', operator: 'greater_than', value: 2500000 }
    ],
    script: `// For high balance accounts (> ₹25 Lakhs), SSN is only visible to the assigned Relationship Officer or Wealth Managers
if (Number(current.balance) > 2500000) {
  if (user.name === current.assigned_officer || user.hasRole('wealth_manager')) {
    answer = true;
  } else {
    gs.log("SSN Masked: High wealth account reserved to assigned officer " + current.assigned_officer);
    answer = false;
  }
} else {
  // Standard accounts visible to finance officers
  answer = user.hasRole('finance_officer');
}`,
    denyAction: 'mask',
    description: 'Enforces field-level masking on SSN and Routing Number for high-value accounts (> ₹25 Lakhs) unless caller is the specific assigned officer or wealth_manager.',
    lastModified: '2026-09-27 16:30:00'
  },

  // 5. PATIENT RECORD: Field-Level Restriction on Mental Health / Psych Care
  {
    id: 'ACL-PAT-01',
    name: 'HIPAA Psychiatric Care & Medication Shield',
    table: 'patient_record',
    targetType: 'field',
    field: 'diagnosis',
    operation: 'read',
    active: true,
    requiredRoles: [],
    conditionMode: 'both',
    fieldConditions: [
      { field: 'mental_health_flag', operator: 'equals', value: true }
    ],
    script: `// Specialized protection for psychiatric diagnoses under enhanced HIPAA rules
if (current.mental_health_flag === true) {
  // Only attending physician or certified psychiatrist with secret clearance
  if (user.hasRole('physician') && (user.name === current.attending_physician || user.department === 'Psychiatry')) {
    answer = true;
  } else {
    gs.log("HIPAA Psych Shield: Diagnosis masked. Caller lacks attending physician authorization.");
    answer = false;
  }
} else {
  // Standard medical diagnosis accessible to clinical staff and physicians
  answer = user.hasRole('clinical_staff') || user.hasRole('physician');
}`,
    denyAction: 'mask',
    description: 'When mental_health_flag=true, the diagnosis field is strictly masked from general clinical staff and only visible to the attending physician or psychiatry department.',
    lastModified: '2026-09-29 17:10:00'
  },

  // 6. PATIENT RECORD: VIP Record Access Control
  {
    id: 'ACL-PAT-02',
    name: 'VIP Patient Record Access Isolation',
    table: 'patient_record',
    targetType: 'record',
    field: '*',
    operation: 'read',
    active: true,
    requiredRoles: [],
    conditionMode: 'both',
    fieldConditions: [
      { field: 'is_vip', operator: 'equals', value: true }
    ],
    script: `// VIP records require attending physician match or Secret clearance
if (current.is_vip === true) {
  if (user.name === current.attending_physician || user.clearanceLevel === 'Secret' || user.clearanceLevel === 'Top Secret') {
    gs.log("VIP access authorized for " + user.name);
    answer = true;
  } else {
    gs.log("VIP record access denied: Caller clearance is " + user.clearanceLevel);
    answer = false;
  }
} else {
  answer = true;
}`,
    denyAction: 'hide',
    description: 'Hides entire patient records flagged with is_vip=true from staff lacking Secret clearance or attending physician designation.',
    lastModified: '2026-09-29 18:00:00'
  },

  // 7. HR PAYROLL: Record-Level & Field-Level Access Control
  {
    id: 'ACL-HR-01',
    name: 'Salary & Compensation Visibility Restricted to Self or HR Admin',
    table: 'hr_payroll',
    targetType: 'field',
    field: 'base_salary',
    operation: 'read',
    active: true,
    requiredRoles: [],
    conditionMode: 'script',
    script: `// Employees may only view their own salary, or HR Admins
if (user.hasRole('hr_admin') || user.hasRole('payroll_reader')) {
  answer = true;
} else if (user.name === current.employee_name) {
  gs.log("Self-access granted for employee " + user.name);
  answer = true;
} else {
  gs.log("Salary masked: Caller is not the employee or HR Admin.");
  answer = false;
}`,
    denyAction: 'mask',
    description: 'Salary and bonus fields are masked unless the viewer is the employee themselves or an authorized HR Admin/Payroll Reader.',
    lastModified: '2026-09-26 13:00:00'
  }
];

export const SCRIPT_TEMPLATES = [
  {
    title: 'Department Match Isolation',
    description: 'Allows access only if current record department matches caller department',
    script: `// Restrict access to records matching caller's department
if (current.department === user.department || user.hasRole('admin')) {
  gs.log("Access granted: Department match (" + user.department + ")");
  answer = true;
} else {
  gs.log("Access denied: Record department " + current.department + " != " + user.department);
  answer = false;
}`
  },
  {
    title: 'Clearance Level Hierarchy',
    description: 'Compares user clearance level against record classification',
    script: `const levels = { 'Public': 1, 'Standard': 2, 'Confidential': 3, 'Secret': 4, 'Top Secret': 5 };
const reqLevel = current.security_incident ? 5 : (current.is_vip ? 4 : 2);
const userLevel = levels[user.clearanceLevel] || 1;

if (userLevel >= reqLevel) {
  gs.log("Clearance verified: User level " + userLevel + " >= required " + reqLevel);
  answer = true;
} else {
  gs.log("Clearance insufficient: User level " + userLevel + " < required " + reqLevel);
  answer = false;
}`
  },
  {
    title: 'Record State Lockout (Immutable)',
    description: 'Blocks write/edit operations once record enters terminal state',
    script: `// Prevent updates when record is in final state
const lockedStates = ['Closed', 'Resolved', 'Archived', 'Cancelled'];
if (lockedStates.includes(current.state)) {
  if (user.hasRole('admin')) {
    gs.log("Admin override for locked record state: " + current.state);
    answer = true;
  } else {
    gs.log("Record immutable: State is " + current.state);
    answer = false;
  }
} else {
  answer = true;
}`
  },
  {
    title: 'Record Owner / Assignee / Manager Hierarchy',
    description: 'Allows access if caller is owner, assignee, or direct reporting manager',
    script: `// Allow owner, direct assignee, or their manager
const isAssignee = (current.assigned_to === user.name || current.employee_name === user.name);
const isManager = (current.direct_manager === user.name || current.assigned_officer === user.name);

if (isAssignee || isManager || user.hasRole('admin')) {
  gs.log("Authorized: Assignee/Manager role confirmed.");
  answer = true;
} else {
  gs.log("Unauthorized: Caller is neither assignee nor assigned manager.");
  answer = false;
}`
  },
  {
    title: 'Financial Threshold Delegation',
    description: 'Restricts approval or view based on balance exceeding delegated authority',
    script: `const limit = user.delegatedLimit || 0;
const amount = Number(current.balance || current.credit_limit || 0);

if (amount <= limit || user.hasRole('wealth_manager')) {
  gs.log("Transaction authorized within delegated limit: ₹" + limit.toLocaleString('en-IN'));
  answer = true;
} else {
  gs.log("Exceeds authority: Amount ₹" + amount.toLocaleString('en-IN') + " > limit ₹" + limit.toLocaleString('en-IN'));
  answer = false;
}`
  }
];
