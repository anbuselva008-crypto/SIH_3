import type { 
  JobFamily, 
  RoleDefinition, 
  CompetencyCatalogueItem, 
  FutureSkillItem 
} from './domainTypes.ts';

export const JOB_FAMILIES: JobFamily[] = [
  {
    id: 'statistics',
    name: 'Official Statistics',
    code: 'STAT',
    description: 'National statistical operations, survey methodology, macroeconomic aggregates, price indexing, and statistical dissemination',
    icon: 'BarChart3',
    domain_color: 'blue'
  },
  {
    id: 'engineering',
    name: 'Engineering & Public Works',
    code: 'ENG',
    description: 'Infrastructure planning, structural engineering, public works execution, contract administration, and project quality assurance',
    icon: 'HardHat',
    domain_color: 'amber'
  },
  {
    id: 'health',
    name: 'Health & Family Welfare',
    code: 'HEALTH',
    description: 'Public health delivery, clinical governance, health program management, epidemiological surveillance, and digital health records',
    icon: 'Activity',
    domain_color: 'emerald'
  },
  {
    id: 'finance',
    name: 'Finance & Accounts',
    code: 'FIN',
    description: 'Public financial management, budgeting, treasury accounting, statutory audits, and government procurement finance',
    icon: 'Landmark',
    domain_color: 'violet'
  },
  {
    id: 'it',
    name: 'Information Technology & Digital Governance',
    code: 'IT',
    description: 'Software engineering, cloud infrastructure, cybersecurity, national digital public infrastructure, and database operations',
    icon: 'Cpu',
    domain_color: 'indigo'
  },
  {
    id: 'administration',
    name: 'Public Administration',
    code: 'ADMIN',
    description: 'General administration, office management, secretariat workflows, civil service rules, and public grievances',
    icon: 'FileText',
    domain_color: 'slate'
  },
  {
    id: 'other',
    name: 'General Government Services',
    code: 'GEN',
    description: 'Cross-functional public service administration for roles across various ministries and state departments',
    icon: 'Shield',
    domain_color: 'sky'
  }
];

export const ROLES: RoleDefinition[] = [
  // 1. Official Statistics
  {
    id: 'statistical-officer',
    job_family_id: 'statistics',
    name: 'Statistical Officer',
    domain: 'Official Statistics',
    description: 'Responsible for sample survey scrutiny, microdata validation, official statistics compilation, and field data quality management.',
    typical_departments: [
      'Survey Division (NSSO)',
      'National Accounts Division',
      'Price Statistics Division',
      'Field Operations Division',
      'Economic Statistics Division'
    ],
    typical_assignments: [
      'Periodic Labour Force Survey (PLFS) Microdata Validation',
      'Survey Data Analysis & Sampling',
      'Consumer Price Index (CPI) Compilation & Price Statistics',
      'National Accounts & GSDP Estimation',
      'Geospatial Frame Preparation & UFS Mapping'
    ],
    required_competencies: [
      {
        name: 'Statistics',
        category: 'Methodology & Theory',
        required_proficiency: 'Advanced',
        benchmark_target: 75,
        criticality: 'Foundational Criticality — Core baseline standard for multi-stage stratified sampling and survey variance estimation.',
        is_mandatory: true
      },
      {
        name: 'Python',
        category: 'Programming & Computing',
        required_proficiency: 'Intermediate',
        benchmark_target: 60,
        criticality: 'Technical Criticality — Required for automated survey data pipeline, large-scale NSSO microdata cleansing, and reproducible official statistics.',
        is_mandatory: true
      },
      {
        name: 'Data Analysis',
        category: 'Applied Analysis',
        required_proficiency: 'Intermediate',
        benchmark_target: 70,
        criticality: 'High Operational Criticality — Core duty for sample estimation, outlier screening, and consumer price index computation.',
        is_mandatory: true
      },
      {
        name: 'Data Visualization',
        category: 'Reporting & Dissemination',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Dissemination Criticality — Required for MoSPI publication standards and non-misleading visual reporting.',
        is_mandatory: true
      }
    ],
    future_competencies: ['AI for Statistics', 'Geospatial Analytics', 'Big Data Analytics']
  },
  {
    id: 'senior-statistical-officer',
    job_family_id: 'statistics',
    name: 'Senior Statistical Officer',
    domain: 'Official Statistics',
    description: 'Senior statistical supervisor overseeing survey execution, complex econometric modeling, and inter-cadre statistical reporting.',
    typical_departments: [
      'National Accounts Division',
      'Survey Division',
      'Data Storage & Dissemination Division'
    ],
    typical_assignments: [
      'National Accounts / GDP Compilation',
      'Survey Oversight & Quality Audits',
      'High-Frequency Economic Indicators'
    ],
    required_competencies: [
      {
        name: 'Statistics',
        category: 'Methodology & Theory',
        required_proficiency: 'Advanced',
        benchmark_target: 80,
        criticality: 'Advanced theoretical foundation for macroeconomic estimation and sampling design.',
        is_mandatory: true
      },
      {
        name: 'Data Analysis',
        category: 'Applied Analysis',
        required_proficiency: 'Advanced',
        benchmark_target: 80,
        criticality: 'Multi-round survey comparison and index construction.',
        is_mandatory: true
      },
      {
        name: 'Python',
        category: 'Programming & Computing',
        required_proficiency: 'Intermediate',
        benchmark_target: 65,
        criticality: 'Automated data pipelines and batch microdata verification.',
        is_mandatory: true
      },
      {
        name: 'Data Visualization',
        category: 'Reporting & Dissemination',
        required_proficiency: 'Advanced',
        benchmark_target: 80,
        criticality: 'Executive dashboards for ministerial review.',
        is_mandatory: true
      }
    ],
    future_competencies: ['AI for Statistics', 'Big Data Analytics']
  },

  // 2. Engineering & Public Works
  {
    id: 'civil-engineer',
    job_family_id: 'engineering',
    name: 'Civil Engineer',
    domain: 'Engineering & Public Works',
    description: 'Responsible for public infrastructure project supervision, construction quality assurance, public works contracts, and schedule compliance.',
    typical_departments: [
      'Central Public Works Department (CPWD)',
      'State Public Works Department (PWD)',
      'National Highways Authority of India (NHAI)',
      'Municipal Engineering Department',
      'Irrigation & Water Resources Department'
    ],
    typical_assignments: [
      'Urban Infrastructure & Roadways',
      'Bridge & Highway Construction',
      'Public Works Quality Monitoring',
      'Irrigation & Water Resource Management',
      'Government Building & Housing Projects'
    ],
    required_competencies: [
      {
        name: 'Project Management',
        category: 'Project Execution & Scheduling',
        required_proficiency: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Operational Criticality — Crucial for scheduling milestone tracking, delay mitigation, and contractor timeline enforcement under public works manuals.',
        is_mandatory: true
      },
      {
        name: 'Contract Management',
        category: 'Legal & Public Works Contracts',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Legal & Financial Criticality — Required for FIDIC/CPWD contract clauses, variation orders, liquidated damages, and dispute arbitration.',
        is_mandatory: true
      },
      {
        name: 'Cost Estimation',
        category: 'Financial & Schedule of Rates',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Fiduciary Criticality — Essential for applying Delhi Schedule of Rates (DSR), lead-lift analysis, and administrative approval estimates.',
        is_mandatory: true
      },
      {
        name: 'Quality Assurance',
        category: 'Material Testing & Structural Standards',
        required_proficiency: 'Advanced',
        benchmark_target: 80,
        criticality: 'Structural Safety Criticality — Core duty for concrete cube strength tests, soil compaction verification, and non-destructive testing audits.',
        is_mandatory: true
      },
      {
        name: 'Safety & Compliance',
        category: 'Site Safety & Environmental Compliance',
        required_proficiency: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Statutory Criticality — Mandated for National Building Code (NBC) safety standards, worker PPE enforcement, and environmental clearance norms.',
        is_mandatory: true
      }
    ],
    future_competencies: ['Digital Project Monitoring', 'Building Information Modeling (BIM)', 'Sustainable Construction']
  },

  // 3. Health & Family Welfare
  {
    id: 'medical-officer',
    job_family_id: 'health',
    name: 'Medical Officer',
    domain: 'Health & Family Welfare',
    description: 'Responsible for public healthcare administration, primary healthcare delivery, clinical governance, and national health program execution.',
    typical_departments: [
      'Ministry of Health & Family Welfare',
      'State Directorate of Health Services',
      'National Health Mission (NHM)',
      'District Health Administration',
      'Community Health Centres (CHC)'
    ],
    typical_assignments: [
      'Public Health Programme & Immunization',
      'Hospital Clinical Governance & Quality',
      'Disease Surveillance & Outbreak Response',
      'Maternal & Child Health Monitoring',
      'Digital Health Records & Ayushman Bharat'
    ],
    required_competencies: [
      {
        name: 'Public Health',
        category: 'Community Medicine & Disease Prevention',
        required_proficiency: 'Advanced',
        benchmark_target: 80,
        criticality: 'Foundational Criticality — Core duty for epidemiological control, universal immunization coverage, and community health interventions.',
        is_mandatory: true
      },
      {
        name: 'Health Programme Management',
        category: 'National Health Missions & Resource Planning',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Administrative Criticality — Managing untied funds, RCH portals, and National Health Mission target execution.',
        is_mandatory: true
      },
      {
        name: 'Clinical Governance',
        category: 'Medical Standards & Patient Safety',
        required_proficiency: 'Advanced',
        benchmark_target: 80,
        criticality: 'Healthcare Quality Criticality — Essential for IPHS standards, biomedical waste management, and prescription audit protocols.',
        is_mandatory: true
      },
      {
        name: 'Health Data Management',
        category: 'Health Information Systems & Surveillance',
        required_proficiency: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Surveillance Criticality — Mandatory for IHIP real-time reporting, HMIS indicator monitoring, and outbreak alerts.',
        is_mandatory: true
      }
    ],
    future_competencies: ['Digital Health Systems', 'Health Analytics & Epidemiology AI', 'Telemedicine & Smart Diagnostics']
  },

  // 4. Finance & Accounts
  {
    id: 'finance-officer',
    job_family_id: 'finance',
    name: 'Finance & Accounts Officer',
    domain: 'Finance & Accounts',
    description: 'Responsible for public financial management, treasury accounting, General Financial Rules (GFR) compliance, and budget appropriation.',
    typical_departments: [
      'Ministry of Finance (Department of Expenditure)',
      'Office of Controller General of Accounts (CGA)',
      'State Treasury & Accounts Directorate',
      'Autonomous Public Institutions',
      'Internal Finance Wings of Ministries'
    ],
    typical_assignments: [
      'Government Budget & Accounts Scrutiny',
      'Public Financial Management System (PFMS) Administration',
      'GeM Procurement & Expenditure Control',
      'Statutory & Internal Audit Review',
      'Revenue Reconciliation & Treasury Operations'
    ],
    required_competencies: [
      {
        name: 'Public Financial Management',
        category: 'Fiscal Governance & PFMS',
        required_proficiency: 'Advanced',
        benchmark_target: 80,
        criticality: 'Governance Criticality — Managing Single Nodal Agency (SNA) accounts, Just-in-Time funding, and expenditure ceilings.',
        is_mandatory: true
      },
      {
        name: 'Budgeting',
        category: 'Appropriation & Estimates',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Fiscal Criticality — Required for Budget Estimates (BE), Revised Estimates (RE), and parliamentary re-appropriation rules.',
        is_mandatory: true
      },
      {
        name: 'Government Accounting',
        category: 'Treasury Accounting & Standards',
        required_proficiency: 'Advanced',
        benchmark_target: 80,
        criticality: 'Accounting Integrity Criticality — Balancing suspense heads, RBI settlement reconciliation, and monthly civil accounts.',
        is_mandatory: true
      },
      {
        name: 'Audit',
        category: 'Statutory & Compliance Scrutiny',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Accountability Criticality — Addressing C&AG test audit queries, PAC notes, and internal financial scrutiny.',
        is_mandatory: true
      },
      {
        name: 'Financial Rules',
        category: 'GFR 2017 & Procurement Norms',
        required_proficiency: 'Advanced',
        benchmark_target: 85,
        criticality: 'Regulatory Criticality — Enforcing General Financial Rules (GFR) 2017 and GeM procurement thresholds.',
        is_mandatory: true
      }
    ],
    future_competencies: ['Financial Analytics', 'Data-Driven Audit in Government', 'Digital Payment Systems & e-Treasury']
  },

  // 5. Information Technology & Digital Governance
  {
    id: 'it-officer',
    job_family_id: 'it',
    name: 'Information Technology Officer',
    domain: 'Information Technology & Digital Governance',
    description: 'Responsible for public digital platforms, cybersecurity compliance, cloud hosting, software architecture, and e-governance systems.',
    typical_departments: [
      'National Informatics Centre (NIC)',
      'Ministry of Electronics and Information Technology (MeitY)',
      'Digital India Corporation',
      'Centre for Railway Information Systems (CRIS)',
      'State IT Departments / e-Governance Missions'
    ],
    typical_assignments: [
      'Application Security & Vulnerability Management',
      'Government Cloud Infrastructure & MeghRaj',
      'e-Governance Portal Development & APIs',
      'National Registry Database Administration',
      'Citizen Service Delivery Platform Operations'
    ],
    required_competencies: [
      {
        name: 'Cybersecurity',
        category: 'Security Audits & Vulnerability Assessment',
        required_proficiency: 'Advanced',
        benchmark_target: 85,
        criticality: 'National Security Criticality — Ensuring CERT-In compliance, STQC audit clearances, and vulnerability patching.',
        is_mandatory: true
      },
      {
        name: 'Software Engineering',
        category: 'Application Architecture & APIs',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Engineering Criticality — Adhering to India Enterprise Architecture (IndEA) and secure RESTful API standards.',
        is_mandatory: true
      },
      {
        name: 'Cloud',
        category: 'Government Cloud & Containerization',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Infrastructure Criticality — Managing MeghRaj cloud deployments, auto-scaling, and disaster recovery replication.',
        is_mandatory: true
      },
      {
        name: 'Data Engineering',
        category: 'Database Management & ETL',
        required_proficiency: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Data Architecture Criticality — High-throughput database indexing, citizen registry integrity, and secure data pipelines.',
        is_mandatory: true
      },
      {
        name: 'Digital Governance',
        category: 'e-Governance Frameworks & Standards',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Interoperability Criticality — Integrating with DigiLocker, Aadhaar authentication, and e-Pramaan.',
        is_mandatory: true
      }
    ],
    future_competencies: ['Cloud Security & DevSecOps', 'AI Engineering for Public Services', 'Zero-Trust Architecture']
  },

  // 6. Public Administration
  {
    id: 'administrative-officer',
    job_family_id: 'administration',
    name: 'Administrative Officer',
    domain: 'Public Administration',
    description: 'Responsible for secretariat procedures, file management, e-Office workflows, public procurement, and inter-departmental coordination.',
    typical_departments: [
      'Department of Personnel & Training (DoPT)',
      'Ministry of Home Affairs',
      'Secretariat Administration Department',
      'District Collectorates',
      'Central Ministries Administration Wings'
    ],
    typical_assignments: [
      'Office Workflow & e-Office Administration',
      'Public Procurement & GeM Contracting',
      'Citizen Grievance Redressal (CPGRAMS)',
      'Establishment & Service Rules Administration',
      'Inter-Ministerial Coordination'
    ],
    required_competencies: [
      {
        name: 'Public Administration',
        category: 'CSMOP & Government Operations',
        required_proficiency: 'Advanced',
        benchmark_target: 80,
        criticality: 'Procedural Criticality — Master Central Secretariat Manual of Office Procedure (CSMOP) and official notings.',
        is_mandatory: true
      },
      {
        name: 'Procurement',
        category: 'GeM & Public Tendering',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Commercial Criticality — Transparent procurement through Government e-Marketplace (GeM) and tender scrutiny.',
        is_mandatory: true
      },
      {
        name: 'Citizen Service',
        category: 'Grievance Redressal & Sevottam',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Citizen Delivery Criticality — Resolution of CPGRAMS grievances within stipulated charter deadlines.',
        is_mandatory: true
      },
      {
        name: 'Office Procedures',
        category: 'e-Office & Records Management',
        required_proficiency: 'Advanced',
        benchmark_target: 80,
        criticality: 'Operational Criticality — Smooth file lifecycle, classified dak handling, and digital archival.',
        is_mandatory: true
      }
    ],
    future_competencies: ['Digital Workflow Automation', 'Data-Driven Public Policy', 'Smart Grievance Analytics']
  },

  // 7. General Government Services (fallback for Other / unlisted)
  {
    id: 'general-officer',
    job_family_id: 'other',
    name: 'General Cadre Officer',
    domain: 'General Government Services',
    description: 'General public administration officer across departmental divisions and public programs.',
    typical_departments: [
      'General Administration Department',
      'District Administration',
      'Departmental Field Offices'
    ],
    typical_assignments: [
      'General Operations & Public Service',
      'Departmental Coordination & Public Interface',
      'Program Implementation'
    ],
    required_competencies: [
      {
        name: 'Public Administration',
        category: 'Government Operations',
        required_proficiency: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Baseline standard for government office procedure, official correspondence, and ethical administration.',
        is_mandatory: true
      },
      {
        name: 'Procurement',
        category: 'Public Procurement & GeM',
        required_proficiency: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Standard for goods and services procurement adhering to transparency norms.',
        is_mandatory: true
      },
      {
        name: 'Citizen Service',
        category: 'Public Interface & Grievances',
        required_proficiency: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Effective public grievance redressal and transparent service delivery.',
        is_mandatory: true
      }
    ],
    future_competencies: ['Digital Governance & Fluency', 'Data Literacy for Administrators']
  }
];

export const FUTURE_SKILLS: FutureSkillItem[] = [
  // Statistics
  {
    id: 'future-stat-ai',
    name: 'AI for Statistics',
    job_family_id: 'statistics',
    relevant_roles: ['statistical-officer', 'senior-statistical-officer'],
    prerequisites: ['Python', 'Statistics', 'Data Analysis'],
    recommended_proficiency: 'Advanced',
    explanation: 'This emerging capability automates industrial classification (NIC/NCO) and outlier detection in high-frequency economic datasets.',
    suggested_resource_id: 10
  },
  {
    id: 'future-stat-gis',
    name: 'Geospatial Analytics',
    job_family_id: 'statistics',
    relevant_roles: ['statistical-officer'],
    prerequisites: ['Statistics', 'Data Visualization'],
    recommended_proficiency: 'Intermediate',
    explanation: 'Spatial analysis and digital boundary mapping for Urban Frame Survey (UFS) and district census microdata.',
    suggested_resource_id: 8
  },

  // Engineering
  {
    id: 'future-eng-dpm',
    name: 'Digital Project Monitoring',
    job_family_id: 'engineering',
    relevant_roles: ['civil-engineer'],
    prerequisites: ['Project Management', 'Quality Assurance'],
    recommended_proficiency: 'Intermediate',
    explanation: 'This skill can support your current infrastructure project work as digital monitoring, drone surveys, and PM-GatiShakti GIS expand across public works.',
    suggested_resource_id: 101
  },
  {
    id: 'future-eng-bim',
    name: 'Building Information Modeling (BIM)',
    job_family_id: 'engineering',
    relevant_roles: ['civil-engineer'],
    prerequisites: ['Cost Estimation', 'Project Management'],
    recommended_proficiency: 'Intermediate',
    explanation: '3D digital twins and clash-detection systems increasingly mandated for CPWD and NHAI public infrastructure mega-projects.',
    suggested_resource_id: 106
  },

  // Health
  {
    id: 'future-health-digital',
    name: 'Digital Health Systems',
    job_family_id: 'health',
    relevant_roles: ['medical-officer'],
    prerequisites: ['Public Health', 'Health Data Management'],
    recommended_proficiency: 'Intermediate',
    explanation: 'This skill will empower your health facility administration as Ayushman Bharat Digital Mission (ABDM) electronic health records scale nationally.',
    suggested_resource_id: 201
  },

  // Finance
  {
    id: 'future-fin-analytics',
    name: 'Financial Analytics',
    job_family_id: 'finance',
    relevant_roles: ['finance-officer'],
    prerequisites: ['Government Accounting', 'Budgeting'],
    recommended_proficiency: 'Intermediate',
    explanation: 'Applies automated data-driven auditing techniques to scrutinize treasury ledger variations and detect scheme expenditure anomalies.',
    suggested_resource_id: 301
  },

  // IT
  {
    id: 'future-it-devsecops',
    name: 'Cloud Security & DevSecOps',
    job_family_id: 'it',
    relevant_roles: ['it-officer'],
    prerequisites: ['Cybersecurity', 'Cloud'],
    recommended_proficiency: 'Advanced',
    explanation: 'Integrates automated security testing pipelines into government microservices following CERT-In zero-trust directives.',
    suggested_resource_id: 401
  },

  // Administration
  {
    id: 'future-admin-workflow',
    name: 'Digital Workflow Automation',
    job_family_id: 'administration',
    relevant_roles: ['administrative-officer', 'general-officer'],
    prerequisites: ['Public Administration', 'Office Procedures'],
    recommended_proficiency: 'Intermediate',
    explanation: 'Leverages modern citizen portal automation and smart workflow routing to accelerate inter-ministerial file disposals.',
    suggested_resource_id: 501
  }
];

export const ALL_COMPETENCIES_CATALOGUE: CompetencyCatalogueItem[] = [
  // Official Statistics
  { id: 'c-stat', name: 'Statistics', category: 'Methodology & Theory', type: 'domain_specific', job_family_id: 'statistics', description: 'Survey sampling design, probability, and inference.' },
  { id: 'c-py', name: 'Python', category: 'Programming & Computing', type: 'domain_specific', job_family_id: 'statistics', description: 'Computing workflows, Pandas, and automated pipelines.' },
  { id: 'c-da', name: 'Data Analysis', category: 'Applied Analysis', type: 'domain_specific', job_family_id: 'statistics', description: 'Descriptive & inferential statistical computation.' },
  { id: 'c-dv', name: 'Data Visualization', category: 'Reporting & Dissemination', type: 'domain_specific', job_family_id: 'statistics', description: 'Ethical chart design and public reporting.' },

  // Engineering
  { id: 'c-pm', name: 'Project Management', category: 'Project Execution & Scheduling', type: 'domain_specific', job_family_id: 'engineering', description: 'Critical path scheduling, delay mitigation, and contractor tracking.' },
  { id: 'c-cm', name: 'Contract Management', category: 'Legal & Public Works Contracts', type: 'domain_specific', job_family_id: 'engineering', description: 'Public works contract clauses, arbitration, and variations.' },
  { id: 'c-ce', name: 'Cost Estimation', category: 'Financial & Schedule of Rates', type: 'domain_specific', job_family_id: 'engineering', description: 'Schedule of Rates, lead-lift analysis, and estimates.' },
  { id: 'c-qa', name: 'Quality Assurance', category: 'Material Testing & Structural Standards', type: 'domain_specific', job_family_id: 'engineering', description: 'Material testing, compaction verification, and structural audits.' },
  { id: 'c-sc', name: 'Safety & Compliance', category: 'Site Safety & Environmental Compliance', type: 'domain_specific', job_family_id: 'engineering', description: 'National Building Code norms, worker safety, and clearances.' },

  // Health
  { id: 'c-ph', name: 'Public Health', category: 'Community Medicine & Disease Prevention', type: 'domain_specific', job_family_id: 'health', description: 'Epidemiology, immunization coverage, and disease control.' },
  { id: 'c-hpm', name: 'Health Programme Management', category: 'National Health Missions & Resource Planning', type: 'domain_specific', job_family_id: 'health', description: 'NHM targets, healthcare financing, and health facility supervision.' },
  { id: 'c-cg', name: 'Clinical Governance', category: 'Medical Standards & Patient Safety', type: 'domain_specific', job_family_id: 'health', description: 'Hospital quality standards, infection control, and audit.' },
  { id: 'c-hdm', name: 'Health Data Management', category: 'Health Information Systems & Surveillance', type: 'domain_specific', job_family_id: 'health', description: 'IHIP reporting, HMIS metrics, and epidemic tracking.' },

  // Finance
  { id: 'c-pfm', name: 'Public Financial Management', category: 'Fiscal Governance & PFMS', type: 'domain_specific', job_family_id: 'finance', description: 'Single Nodal Agency, expenditure limits, and fiscal prudence.' },
  { id: 'c-bdg', name: 'Budgeting', category: 'Appropriation & Estimates', type: 'domain_specific', job_family_id: 'finance', description: 'Budget preparation, parliamentary appropriation, and re-appropriation.' },
  { id: 'c-ga', name: 'Government Accounting', category: 'Treasury Accounting & Standards', type: 'domain_specific', job_family_id: 'finance', description: 'Ledger reconciliation, treasury bills, and civil accounts.' },
  { id: 'c-aud', name: 'Audit', category: 'Statutory & Compliance Scrutiny', type: 'domain_specific', job_family_id: 'finance', description: 'C&AG audit query compliance and internal financial reviews.' },
  { id: 'c-fr', name: 'Financial Rules', category: 'GFR 2017 & Procurement Norms', type: 'domain_specific', job_family_id: 'finance', description: 'General Financial Rules 2017 compliance and delegation of powers.' },

  // IT
  { id: 'c-cyber', name: 'Cybersecurity', category: 'Security Audits & Vulnerability Assessment', type: 'domain_specific', job_family_id: 'it', description: 'CERT-In compliance, STQC audits, and threat mitigation.' },
  { id: 'c-swe', name: 'Software Engineering', category: 'Application Architecture & APIs', type: 'domain_specific', job_family_id: 'it', description: 'Clean architecture, secure APIs, and e-governance standards.' },
  { id: 'c-cld', name: 'Cloud', category: 'Government Cloud & Containerization', type: 'domain_specific', job_family_id: 'it', description: 'MeghRaj cloud hosting, high availability, and containerization.' },
  { id: 'c-de', name: 'Data Engineering', category: 'Database Management & ETL', type: 'domain_specific', job_family_id: 'it', description: 'Citizen database optimization, ETL pipelines, and integrity.' },
  { id: 'c-dg', name: 'Digital Governance', category: 'e-Governance Frameworks & Standards', type: 'domain_specific', job_family_id: 'it', description: 'IndEA standards, DigiLocker integration, and public service APIs.' },

  // Administration & Cross-Functional
  { id: 'c-pa', name: 'Public Administration', category: 'CSMOP & Government Operations', type: 'cross_functional', description: 'Secretariat manual procedures, official drafting, and ethics.' },
  { id: 'c-proc', name: 'Procurement', category: 'GeM & Public Tendering', type: 'cross_functional', description: 'Government e-Marketplace, competitive bids, and contract terms.' },
  { id: 'c-cs', name: 'Citizen Service', category: 'Grievance Redressal & Sevottam', type: 'cross_functional', description: 'Citizen charter compliance, CPGRAMS redressal, and feedback.' },
  { id: 'c-op', name: 'Office Procedures', category: 'e-Office & Records Management', type: 'cross_functional', description: 'e-Office docketing, classified files, and records retention.' }
];
