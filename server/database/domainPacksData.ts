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
  // 1. Official Statistics (STAT)
  {
    id: 'statistical-officer',
    job_family_id: 'statistics',
    name: 'Statistical Officer',
    domain: 'Official Statistics',
    description: 'Responsible for sample survey scrutiny, microdata validation, official statistics compilation, and field data quality management.',
    typical_departments: [
      'Survey Division (NSSO)',
      'National Accounts Division (NAD)',
      'Price Statistics Division (CPI)',
      'Field Operations Division (FOD)',
      'Economic Statistics Division (ESD)'
    ],
    standard_departments: [
      'Survey Division (NSSO)',
      'National Accounts Division (NAD)',
      'Price Statistics Division (CPI)',
      'Field Operations Division (FOD)',
      'Economic Statistics Division (ESD)'
    ],
    typical_assignments: [
      'Periodic Labour Force Survey (PLFS) Microdata Validation',
      'Survey Data Analysis & Sampling',
      'Consumer Price Index (CPI) Compilation & Price Statistics',
      'National Accounts & GSDP Estimation',
      'Geospatial Frame Preparation & UFS Mapping'
    ],
    default_qualification: 'M.Sc. in Statistics / Applied Statistics / Mathematical Statistics',
    future_skills_focus: 'AI for Statistics, Geospatial Analytics & Survey Pipeline Automation',
    required_competencies: [
      {
        name: 'Statistics',
        competency_name: 'Statistics',
        category: 'Methodology & Theory',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 75,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Survey sampling design, probability, and inference.'
      },
      {
        name: 'Python',
        competency_name: 'Python',
        category: 'Programming & Computing',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 60,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Computing workflows, Pandas, and automated pipelines.'
      },
      {
        name: 'Data Analysis',
        competency_name: 'Data Analysis',
        category: 'Applied Analysis',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Descriptive & inferential statistical computation.'
      },
      {
        name: 'Data Visualization',
        competency_name: 'Data Visualization',
        category: 'Reporting & Dissemination',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Ethical chart design and public reporting.'
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
      'National Accounts Division (NAD)',
      'Survey Division (NSSO)',
      'Data Storage & Dissemination Division (DSDD)',
      'Field Operations Division (FOD)'
    ],
    standard_departments: [
      'National Accounts Division (NAD)',
      'Survey Division (NSSO)',
      'Data Storage & Dissemination Division (DSDD)',
      'Field Operations Division (FOD)'
    ],
    typical_assignments: [
      'National Accounts / GDP Compilation & GVA Balancing',
      'Survey Oversight & Statistical Quality Audits',
      'High-Frequency Economic Indicators & IIP Scrutiny',
      'Annual Survey of Industries (ASI) Estimation'
    ],
    default_qualification: 'M.Sc. in Statistics / Econometrics / Mathematical Economics',
    future_skills_focus: 'Econometric Modeling, Big Data Analytics & High-Frequency Forecasting',
    required_competencies: [
      {
        name: 'Statistics',
        competency_name: 'Statistics',
        category: 'Methodology & Theory',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Advanced theoretical foundation for macroeconomic estimation.'
      },
      {
        name: 'Data Analysis',
        competency_name: 'Data Analysis',
        category: 'Applied Analysis',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Multi-round survey comparison and index construction.'
      },
      {
        name: 'Python',
        competency_name: 'Python',
        category: 'Programming & Computing',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 65,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Automated data pipelines and batch microdata verification.'
      },
      {
        name: 'Data Visualization',
        competency_name: 'Data Visualization',
        category: 'Reporting & Dissemination',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Strategic Enhancement',
        is_mandatory: true,
        description: 'Executive dashboards for ministerial review.'
      }
    ],
    future_competencies: ['AI for Statistics', 'Big Data Analytics']
  },
  {
    id: 'assistant-director',
    job_family_id: 'statistics',
    name: 'Assistant Director',
    domain: 'Official Statistics',
    description: 'Gazetted cadre officer leading survey methodology design, statistical policy direction, and national data standard formulation.',
    typical_departments: [
      'Coordination & Publication Division (CAPD)',
      'National Accounts Division (NAD)',
      'Survey Design and Research Division (SDRD)',
      'Data Quality Assurance Directorate'
    ],
    standard_departments: [
      'Coordination & Publication Division (CAPD)',
      'National Accounts Division (NAD)',
      'Survey Design and Research Division (SDRD)',
      'Data Quality Assurance Directorate'
    ],
    typical_assignments: [
      'National Sample Survey Schedule Design & Stratification',
      'UNSDG Indicator Tracking & Statistical Standards',
      'Inter-Cadre Data Quality Assurance Reviews',
      'Macroeconomic Aggregates & Policy Briefings'
    ],
    default_qualification: 'M.Sc. / Ph.D. in Statistics / Econometrics (Indian Statistical Service / State Cadre)',
    future_skills_focus: 'Data Governance, Nowcasting & Advanced Predictive Econometrics',
    required_competencies: [
      {
        name: 'Statistics',
        competency_name: 'Statistics',
        category: 'Methodology & Theory',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Survey sampling design, probability, and inference.'
      },
      {
        name: 'Data Analysis',
        competency_name: 'Data Analysis',
        category: 'Applied Analysis',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Applied statistical computation and macroeconomic aggregation.'
      },
      {
        name: 'Python',
        competency_name: 'Python',
        category: 'Programming & Computing',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Computational statistical workflows and automated pipeline supervision.'
      },
      {
        name: 'Data Visualization',
        competency_name: 'Data Visualization',
        category: 'Reporting & Dissemination',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Strategic Enhancement',
        is_mandatory: true,
        description: 'Official statistical dissemination, UN reporting, and policy dashboards.'
      }
    ],
    future_competencies: ['AI for Statistics', 'Geospatial Analytics', 'Big Data Analytics']
  },

  // 2. Engineering & Public Works (ENG)
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
    standard_departments: [
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
    default_qualification: 'B.Tech / B.E. in Civil Engineering',
    future_skills_focus: 'Digital Project Monitoring, Drone Surveying & BIM Adoption',
    required_competencies: [
      {
        name: 'Project Management',
        competency_name: 'Project Management',
        category: 'Project Execution & Scheduling',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Crucial for scheduling milestone tracking and timeline enforcement.'
      },
      {
        name: 'Contract Management',
        competency_name: 'Contract Management',
        category: 'Legal & Public Works Contracts',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Required for FIDIC/CPWD contract clauses, variation orders, and claims.'
      },
      {
        name: 'Cost Estimation',
        competency_name: 'Cost Estimation',
        category: 'Financial & Schedule of Rates',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Essential for applying Delhi Schedule of Rates (DSR) and estimates.'
      },
      {
        name: 'Quality Assurance',
        competency_name: 'Quality Assurance',
        category: 'Material Testing & Structural Standards',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Core duty for concrete cube tests, soil compaction, and structural audits.'
      },
      {
        name: 'Safety & Compliance',
        competency_name: 'Safety & Compliance',
        category: 'Site Safety & Environmental Compliance',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Mandated for National Building Code (NBC) safety and clearances.'
      }
    ],
    future_competencies: ['Digital Project Monitoring', 'Building Information Modeling (BIM)', 'Sustainable Construction']
  },
  {
    id: 'assistant-engineer',
    job_family_id: 'engineering',
    name: 'Assistant Engineer',
    domain: 'Engineering & Public Works',
    description: 'Field officer managing site executions, contractor measurement book verification, quality testing, and sub-division work progress.',
    typical_departments: [
      'State Public Works Department (PWD)',
      'Central Public Works Department (CPWD)',
      'National Highways Authority of India (NHAI)',
      'Irrigation & Water Resources Department'
    ],
    standard_departments: [
      'State Public Works Department (PWD)',
      'Central Public Works Department (CPWD)',
      'National Highways Authority of India (NHAI)',
      'Irrigation & Water Resources Department'
    ],
    typical_assignments: [
      'Measurement Book (MB) Entry Verification & Bill Scrutiny',
      'On-Site Material Compaction & Concrete Slump Testing',
      'Contractor Milestone Tracking & Site Safety Enforcement',
      'Preliminary Detailed Project Report (DPR) Field Validation'
    ],
    default_qualification: 'B.Tech / B.E. / Diploma in Civil / Structural Engineering',
    future_skills_focus: 'Digital Measurement Books (e-MB), Drone Inspections & Safety Norms',
    required_competencies: [
      {
        name: 'Project Management',
        competency_name: 'Project Management',
        category: 'Project Execution & Scheduling',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Field execution milestone tracking and daily progress records.'
      },
      {
        name: 'Cost Estimation',
        competency_name: 'Cost Estimation',
        category: 'Financial & Schedule of Rates',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Quantity takeoff, lead calculations, and item rate estimates.'
      },
      {
        name: 'Quality Assurance',
        competency_name: 'Quality Assurance',
        category: 'Material Testing & Structural Standards',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Mandatory field testing of aggregate, bitumen, and cement.'
      },
      {
        name: 'Safety & Compliance',
        competency_name: 'Safety & Compliance',
        category: 'Site Safety & Environmental Compliance',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Enforcement of construction site labor safety regulations.'
      },
      {
        name: 'Contract Management',
        competency_name: 'Contract Management',
        category: 'Legal & Public Works Contracts',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Strategic Enhancement',
        is_mandatory: true,
        description: 'Public works contract clauses and contractor payment verification.'
      }
    ],
    future_competencies: ['Digital Project Monitoring', 'Building Information Modeling (BIM)']
  },
  {
    id: 'executive-engineer',
    job_family_id: 'engineering',
    name: 'Executive Engineer',
    domain: 'Engineering & Public Works',
    description: 'Divisional head responsible for public works division administration, technical sanctions, contract tendering, and fiscal budget controls.',
    typical_departments: [
      'Central Public Works Department (CPWD) Division',
      'State PWD Buildings & Roads Division',
      'National Highways Project Implementation Unit (PIU)',
      'Water Supply & Sanitation Division'
    ],
    standard_departments: [
      'Central Public Works Department (CPWD) Division',
      'State PWD Buildings & Roads Division',
      'National Highways Project Implementation Unit (PIU)',
      'Water Supply & Sanitation Division'
    ],
    typical_assignments: [
      'Divisional Technical Sanctions & Tender Finalization',
      'Capital Outlay Budget Control & Letter of Credit (LoC) Drawal',
      'Contractor Deviation Approval & Dispute Resolution',
      'Inter-Departmental Clearances & Land Acquisition Coordination'
    ],
    default_qualification: 'B.Tech / M.Tech in Civil / Structural / Environmental Engineering',
    future_skills_focus: 'BIM Project Integration, PM-GatiShakti Portal & Sustainable Infrastructure',
    required_competencies: [
      {
        name: 'Project Management',
        competency_name: 'Project Management',
        category: 'Project Execution & Scheduling',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Divisional multi-project portfolio scheduling and milestone control.'
      },
      {
        name: 'Contract Management',
        competency_name: 'Contract Management',
        category: 'Legal & Public Works Contracts',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Tender evaluation, contract disputes, and variation claims.'
      },
      {
        name: 'Cost Estimation',
        competency_name: 'Cost Estimation',
        category: 'Financial & Schedule of Rates',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Detailed estimates approval and schedule of rates harmonization.'
      },
      {
        name: 'Quality Assurance',
        competency_name: 'Quality Assurance',
        category: 'Material Testing & Structural Standards',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Divisional structural audits and compliance certifications.'
      },
      {
        name: 'Safety & Compliance',
        competency_name: 'Safety & Compliance',
        category: 'Site Safety & Environmental Compliance',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Environmental impact compliance and disaster resilience standards.'
      }
    ],
    future_competencies: ['Digital Project Monitoring', 'Building Information Modeling (BIM)', 'Sustainable Construction']
  },
  {
    id: 'superintending-engineer',
    job_family_id: 'engineering',
    name: 'Superintending Engineer',
    domain: 'Engineering & Public Works',
    description: 'Circle commanding authority directing infrastructure policy, macro capital budgeting, inter-divisional quality control, and major arbitration.',
    typical_departments: [
      'Circle Office (CPWD / State PWD)',
      'Ministry of Road Transport and Highways (MoRTH)',
      'Metro Rail / State Infrastructure Corporations',
      'Irrigation Circle Headquarters'
    ],
    standard_departments: [
      'Circle Office (CPWD / State PWD)',
      'Ministry of Road Transport and Highways (MoRTH)',
      'Metro Rail / State Infrastructure Corporations',
      'Irrigation Circle Headquarters'
    ],
    typical_assignments: [
      'Circle-Wide Capital Project Portfolio Governance',
      'High-Value Tender Committee Direction (>₹50 Crore)',
      'Contractual Arbitration & High-Level Dispute Reviews',
      'Circle Safety and Environmental Sustainability Audits'
    ],
    default_qualification: 'B.Tech / M.Tech in Civil Engineering / Infrastructure Management',
    future_skills_focus: 'Smart City Infrastructure, PPP Financing & Digital Twins',
    required_competencies: [
      {
        name: 'Project Management',
        competency_name: 'Project Management',
        category: 'Project Execution & Scheduling',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 90,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Strategic circle project portfolio control and risk mitigation.'
      },
      {
        name: 'Contract Management',
        competency_name: 'Contract Management',
        category: 'Legal & Public Works Contracts',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Arbitration management, FIDIC guidelines, and legal claim defense.'
      },
      {
        name: 'Quality Assurance',
        competency_name: 'Quality Assurance',
        category: 'Material Testing & Structural Standards',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 90,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Circle-wide independent quality auditing and third-party validation.'
      },
      {
        name: 'Cost Estimation',
        competency_name: 'Cost Estimation',
        category: 'Financial & Schedule of Rates',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Macro financial planning and circle annual maintenance outlays.'
      },
      {
        name: 'Safety & Compliance',
        competency_name: 'Safety & Compliance',
        category: 'Site Safety & Environmental Compliance',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Circle environmental clearances and disaster safety protocols.'
      }
    ],
    future_competencies: ['Digital Project Monitoring', 'Building Information Modeling (BIM)', 'Sustainable Construction']
  },

  // 3. Health & Family Welfare (HEALTH)
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
    standard_departments: [
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
    default_qualification: 'MBBS / MD Community Medicine / Public Health',
    future_skills_focus: 'Digital Health Systems, Ayushman Bharat ABDM & Clinical Auditing',
    required_competencies: [
      {
        name: 'Public Health',
        competency_name: 'Public Health',
        category: 'Community Medicine & Disease Prevention',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Epidemiological control, universal immunization, and community health.'
      },
      {
        name: 'Health Programme Management',
        competency_name: 'Health Programme Management',
        category: 'National Health Missions & Resource Planning',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Managing untied funds, RCH portals, and National Health Mission targets.'
      },
      {
        name: 'Clinical Governance',
        competency_name: 'Clinical Governance',
        category: 'Medical Standards & Patient Safety',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Essential for IPHS standards and infection control protocols.'
      },
      {
        name: 'Health Data Management',
        competency_name: 'Health Data Management',
        category: 'Health Information Systems & Surveillance',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Mandatory for IHIP real-time reporting and HMIS indicator monitoring.'
      }
    ],
    future_competencies: ['Digital Health Systems', 'Health Analytics & Epidemiology AI', 'Telemedicine & Smart Diagnostics']
  },
  {
    id: 'public-health-officer',
    job_family_id: 'health',
    name: 'Public Health Officer',
    domain: 'Health & Family Welfare',
    description: 'Officer specializing in disease surveillance, epidemic outbreak investigations, environmental sanitation, and health emergency preparedness.',
    typical_departments: [
      'Integrated Disease Surveillance Programme (IDSP)',
      'National Centre for Disease Control (NCDC)',
      'Municipal Public Health Wing',
      'District Epidemic Response Cell'
    ],
    standard_departments: [
      'Integrated Disease Surveillance Programme (IDSP)',
      'National Centre for Disease Control (NCDC)',
      'Municipal Public Health Wing',
      'District Epidemic Response Cell'
    ],
    typical_assignments: [
      'Epidemic Outbreak Investigation & Contact Tracing',
      'Integrated Health Information Platform (IHIP) Surveillance',
      'Waterborne & Vector-Borne Disease Control Campaign',
      'Public Health Emergency Contingency Drill Coordination'
    ],
    default_qualification: 'MBBS / MPH (Master of Public Health) / MD Community Medicine',
    future_skills_focus: 'Predictive Epidemiology, Genomic Surveillance & One Health Governance',
    required_competencies: [
      {
        name: 'Public Health',
        competency_name: 'Public Health',
        category: 'Community Medicine & Disease Prevention',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Epidemiological surveillance, contact tracing, and outbreak control.'
      },
      {
        name: 'Health Data Management',
        competency_name: 'Health Data Management',
        category: 'Health Information Systems & Surveillance',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Surveillance data analysis, IHIP tracking, and indicator modeling.'
      },
      {
        name: 'Health Programme Management',
        competency_name: 'Health Programme Management',
        category: 'National Health Missions & Resource Planning',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Resource mobilization for vaccination and vector control drives.'
      },
      {
        name: 'Clinical Governance',
        competency_name: 'Clinical Governance',
        category: 'Medical Standards & Patient Safety',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Community infection control and quarantine protocols.'
      }
    ],
    future_competencies: ['Digital Health Systems', 'Health Analytics & Epidemiology AI']
  },
  {
    id: 'health-programme-officer',
    job_family_id: 'health',
    name: 'Health Programme Officer',
    domain: 'Health & Family Welfare',
    description: 'Administrative healthcare coordinator steering National Health Mission (NHM) flagship schemes, budget disbursement, and facility accreditation.',
    typical_departments: [
      'National Health Mission (NHM) Directorate',
      'State Health Society',
      'Reproductive, Maternal, Newborn & Child Health (RMNCH+A) Cell',
      'National Tuberculosis Elimination Programme (NTEP)'
    ],
    standard_departments: [
      'National Health Mission (NHM) Directorate',
      'State Health Society',
      'Reproductive, Maternal, Newborn & Child Health (RMNCH+A) Cell',
      'National Tuberculosis Elimination Programme (NTEP)'
    ],
    typical_assignments: [
      'District Health Action Plan (DHAP) Review & Fund Sanction',
      'Untied Funds & Rogi Kalyan Samiti (RKS) Expenditure Scrutiny',
      'National Health Quality Assurance Standards (NQAS) Audits',
      'HMIS and Mother-Child Tracking System Performance Analysis'
    ],
    default_qualification: 'Post Graduate Degree in Health Administration / Public Health / MBA Health Care',
    future_skills_focus: 'Universal Health Coverage (UHC) Analytics & Digital Supply Chain (eVIN)',
    required_competencies: [
      {
        name: 'Health Programme Management',
        competency_name: 'Health Programme Management',
        category: 'National Health Missions & Resource Planning',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Comprehensive health program execution and NHM conditionalities.'
      },
      {
        name: 'Health Data Management',
        competency_name: 'Health Data Management',
        category: 'Health Information Systems & Surveillance',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'HMIS scorecard tracking and health facility performance metrics.'
      },
      {
        name: 'Public Health',
        competency_name: 'Public Health',
        category: 'Community Medicine & Disease Prevention',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Community health priorities and preventive campaign design.'
      },
      {
        name: 'Clinical Governance',
        competency_name: 'Clinical Governance',
        category: 'Medical Standards & Patient Safety',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Primary health centre accreditation and drug stock monitoring.'
      }
    ],
    future_competencies: ['Digital Health Systems', 'Telemedicine & Smart Diagnostics']
  },

  // 4. Finance & Accounts (FIN)
  {
    id: 'finance-officer',
    job_family_id: 'finance',
    name: 'Finance Officer',
    domain: 'Finance & Accounts',
    description: 'Responsible for public financial management, treasury accounting, General Financial Rules (GFR) compliance, and budget appropriation.',
    typical_departments: [
      'Ministry of Finance (Department of Expenditure)',
      'Office of Controller General of Accounts (CGA)',
      'State Treasury & Accounts Directorate',
      'Autonomous Public Institutions',
      'Internal Finance Wings of Ministries'
    ],
    standard_departments: [
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
    default_qualification: 'M.Com / ICWA / Chartered Accountant / MBA Finance',
    future_skills_focus: 'Financial Analytics, PFMS Deep Integration & Forensic Audit Techniques',
    required_competencies: [
      {
        name: 'Public Financial Management',
        competency_name: 'Public Financial Management',
        category: 'Fiscal Governance & PFMS',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Managing Single Nodal Agency accounts and expenditure ceilings.'
      },
      {
        name: 'Budgeting',
        competency_name: 'Budgeting',
        category: 'Appropriation & Estimates',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Required for Budget Estimates (BE) and parliamentary re-appropriation.'
      },
      {
        name: 'Government Accounting',
        competency_name: 'Government Accounting',
        category: 'Treasury Accounting & Standards',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Balancing suspense heads, treasury reconciliation, and civil accounts.'
      },
      {
        name: 'Audit',
        competency_name: 'Audit',
        category: 'Statutory & Compliance Scrutiny',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Addressing C&AG audit queries and internal financial scrutiny.'
      },
      {
        name: 'Financial Rules',
        competency_name: 'Financial Rules',
        category: 'GFR 2017 & Procurement Norms',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Enforcing General Financial Rules (GFR) 2017 and GeM thresholds.'
      }
    ],
    future_competencies: ['Financial Analytics', 'Data-Driven Audit in Government', 'Digital Payment Systems & e-Treasury']
  },
  {
    id: 'accounts-officer',
    job_family_id: 'finance',
    name: 'Accounts Officer',
    domain: 'Finance & Accounts',
    description: 'Civil accounts officer managing bill passing, pension processing, GPF ledgers, treasury settlements, and monthly statement consolidation.',
    typical_departments: [
      'Pay and Accounts Office (PAO)',
      'Office of Controller General of Accounts (CGA)',
      'State Treasury & Sub-Treasury Offices',
      'Defence Accounts / Railway Accounts'
    ],
    standard_departments: [
      'Pay and Accounts Office (PAO)',
      'Office of Controller General of Accounts (CGA)',
      'State Treasury & Sub-Treasury Offices',
      'Defence Accounts / Railway Accounts'
    ],
    typical_assignments: [
      'Salary & Vendor Bill Scrutiny via PFMS (EAT Module)',
      'Pension Payment Order (PPO) Calculation & Verification',
      'Monthly Civil Account Consolidation & RBI Reconciliation',
      'Suspense Account Clearance & Treasury Deposit Verification'
    ],
    default_qualification: 'B.Com / M.Com / Subordinate Accounts Service (SAS) Certified',
    future_skills_focus: 'Automated Treasury Reconciliation, e-Kuber Portal & Electronic Invoicing',
    required_competencies: [
      {
        name: 'Government Accounting',
        competency_name: 'Government Accounting',
        category: 'Treasury Accounting & Standards',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Treasury ledger reconciliation, civil accounts, and classification rules.'
      },
      {
        name: 'Financial Rules',
        competency_name: 'Financial Rules',
        category: 'GFR 2017 & Procurement Norms',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Central Treasury Rules, Delegation of Financial Power, and GFR.'
      },
      {
        name: 'Public Financial Management',
        competency_name: 'Public Financial Management',
        category: 'Fiscal Governance & PFMS',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'PFMS digital bill processing and vendor payment authorization.'
      },
      {
        name: 'Budgeting',
        competency_name: 'Budgeting',
        category: 'Appropriation & Estimates',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Vote-on-account tracking and expenditure classification control.'
      },
      {
        name: 'Audit',
        competency_name: 'Audit',
        category: 'Statutory & Compliance Scrutiny',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Strategic Enhancement',
        is_mandatory: true,
        description: 'Internal audit inspections and voucher scrutiny checks.'
      }
    ],
    future_competencies: ['Digital Payment Systems & e-Treasury', 'Financial Analytics']
  },
  {
    id: 'audit-officer',
    job_family_id: 'finance',
    name: 'Audit Officer',
    domain: 'Finance & Accounts',
    description: 'Supreme audit institution officer conducting statutory compliance audits, performance audits, proprietary scrutiny, and C&AG report drafting.',
    typical_departments: [
      'Office of Comptroller & Auditor General (C&AG)',
      'Office of Principal Accountant General (Audit)',
      'Director General of Commercial Audit',
      'Ministry Internal Audit Directorate'
    ],
    standard_departments: [
      'Office of Comptroller & Auditor General (C&AG)',
      'Office of Principal Accountant General (Audit)',
      'Director General of Commercial Audit',
      'Ministry Internal Audit Directorate'
    ],
    typical_assignments: [
      'Performance Audit of Central Sector Flagship Schemes',
      'Draft Audit Paragraph & Statement of Facts (SoF) Drafting',
      'Public Accounts Committee (PAC) Action Taken Note Vetting',
      'GeM Procurement Propriety & Contract Deviation Scrutiny'
    ],
    default_qualification: 'M.Com / CA / Indian Audit & Accounts Service (IA&AS) / SAS Qualified',
    future_skills_focus: 'Data-Driven Auditing, Forensic Transaction Screening & OIOS Portal',
    required_competencies: [
      {
        name: 'Audit',
        competency_name: 'Audit',
        category: 'Statutory & Compliance Scrutiny',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Statutory audit guidelines, C&AG manual, and performance audits.'
      },
      {
        name: 'Financial Rules',
        competency_name: 'Financial Rules',
        category: 'GFR 2017 & Procurement Norms',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Rigorous application of GFR 2017, GeM guidelines, and propriety standards.'
      },
      {
        name: 'Government Accounting',
        competency_name: 'Government Accounting',
        category: 'Treasury Accounting & Standards',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Appropriation accounts scrutiny and Finance Accounts examination.'
      },
      {
        name: 'Public Financial Management',
        competency_name: 'Public Financial Management',
        category: 'Fiscal Governance & PFMS',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'PFMS expenditure trail analysis and unspent balance detection.'
      },
      {
        name: 'Budgeting',
        competency_name: 'Budgeting',
        category: 'Appropriation & Estimates',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Strategic Enhancement',
        is_mandatory: true,
        description: 'Excess expenditure over voted grants and supplementary grant analysis.'
      }
    ],
    future_competencies: ['Data-Driven Audit in Government', 'Financial Analytics']
  },

  // 5. Information Technology & Digital Governance (IT)
  {
    id: 'it-officer',
    job_family_id: 'it',
    name: 'IT Officer',
    domain: 'Information Technology & Digital Governance',
    description: 'Responsible for public digital platforms, cybersecurity compliance, cloud hosting, software architecture, and e-governance systems.',
    typical_departments: [
      'National Informatics Centre (NIC)',
      'Ministry of Electronics and Information Technology (MeitY)',
      'Digital India Corporation',
      'Centre for Railway Information Systems (CRIS)',
      'State IT Departments / e-Governance Missions'
    ],
    standard_departments: [
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
    default_qualification: 'B.Tech in Computer Science / IT / MCA / M.Sc. Computer Science',
    future_skills_focus: 'Cloud Security, DevSecOps & IndEA 2.0 Interoperability',
    required_competencies: [
      {
        name: 'Cybersecurity',
        competency_name: 'Cybersecurity',
        category: 'Security Audits & Vulnerability Assessment',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Ensuring CERT-In compliance, STQC audits, and security patching.'
      },
      {
        name: 'Software Engineering',
        competency_name: 'Software Engineering',
        category: 'Application Architecture & APIs',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Adhering to IndEA standards and secure RESTful API architectures.'
      },
      {
        name: 'Cloud',
        competency_name: 'Cloud',
        category: 'Government Cloud & Containerization',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Managing MeghRaj cloud deployments, auto-scaling, and recovery.'
      },
      {
        name: 'Data Engineering',
        competency_name: 'Data Engineering',
        category: 'Database Management & ETL',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Database indexing, citizen registry integrity, and pipelines.'
      },
      {
        name: 'Digital Governance',
        competency_name: 'Digital Governance',
        category: 'e-Governance Frameworks & Standards',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Strategic Enhancement',
        is_mandatory: true,
        description: 'Integration with DigiLocker, Aadhaar authentication, and public APIs.'
      }
    ],
    future_competencies: ['Cloud Security & DevSecOps', 'AI Engineering for Public Services', 'Zero-Trust Architecture']
  },
  {
    id: 'software-engineer',
    job_family_id: 'it',
    name: 'Software Engineer',
    domain: 'Information Technology & Digital Governance',
    description: 'Technical engineer building citizen-facing portals, scalable microservices, secure authentication modules, and automated CI/CD pipelines.',
    typical_departments: [
      'National Informatics Centre (NIC)',
      'Centre for Development of Advanced Computing (C-DAC)',
      'Digital India Corporation',
      'Unique Identification Authority of India (UIDAI) Tech Wing'
    ],
    standard_departments: [
      'National Informatics Centre (NIC)',
      'Centre for Development of Advanced Computing (C-DAC)',
      'Digital India Corporation',
      'Unique Identification Authority of India (UIDAI) Tech Wing'
    ],
    typical_assignments: [
      'Microservice Development for Digital Public Infrastructure',
      'API Gateway Routing & Aadhaar e-Sign Integration',
      'High-Concurrency Citizen Registry Query Optimization',
      'Automated Test Suite & Vulnerability Remediation Sprints'
    ],
    default_qualification: 'B.Tech / B.E. in Computer Science / Information Technology / Software Engineering',
    future_skills_focus: 'Cloud-Native Microservices, Open Source Stacks & Public Sector Tech Stacks',
    required_competencies: [
      {
        name: 'Software Engineering',
        competency_name: 'Software Engineering',
        category: 'Application Architecture & APIs',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Modern clean architecture, reliable microservices, and secure coding.'
      },
      {
        name: 'Cloud',
        competency_name: 'Cloud',
        category: 'Government Cloud & Containerization',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 80,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Docker containerization, Kubernetes pods, and MeghRaj deployment.'
      },
      {
        name: 'Data Engineering',
        competency_name: 'Data Engineering',
        category: 'Database Management & ETL',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Relational query performance tuning, migrations, and caching.'
      },
      {
        name: 'Cybersecurity',
        competency_name: 'Cybersecurity',
        category: 'Security Audits & Vulnerability Assessment',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'OWASP Top 10 prevention, input validation, and token authentication.'
      },
      {
        name: 'Digital Governance',
        competency_name: 'Digital Governance',
        category: 'e-Governance Frameworks & Standards',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Strategic Enhancement',
        is_mandatory: true,
        description: 'Adherence to Open API policy and metadata standards.'
      }
    ],
    future_competencies: ['Cloud Security & DevSecOps', 'AI Engineering for Public Services']
  },
  {
    id: 'system-administrator',
    job_family_id: 'it',
    name: 'System Administrator',
    domain: 'Information Technology & Digital Governance',
    description: 'Infrastructure specialist maintaining government data centres, server uptime, virtualization, database clustering, and disaster recovery replication.',
    typical_departments: [
      'National Data Centre (NDC - NIC)',
      'State Data Centre (SDC)',
      'MeitY Cloud Operations Wing',
      'Ministry Server Management Division'
    ],
    standard_departments: [
      'National Data Centre (NDC - NIC)',
      'State Data Centre (SDC)',
      'MeitY Cloud Operations Wing',
      'Ministry Server Management Division'
    ],
    typical_assignments: [
      'Linux Server Security Hardening & Kernel Patching',
      'PostgreSQL Database High-Availability Replication',
      'Disaster Recovery (DR) Drill Execution & Failover Validation',
      'SAN/NAS Storage Allocation & Network Bandwidth Monitoring'
    ],
    default_qualification: 'B.Tech / B.Sc. IT / Red Hat Certified Engineer (RHCE)',
    future_skills_focus: 'Infrastructure as Code (Terraform), Kubernetes & Zero-Trust Networking',
    required_competencies: [
      {
        name: 'Cloud',
        competency_name: 'Cloud',
        category: 'Government Cloud & Containerization',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Server virtualization, load balancing, and private government cloud.'
      },
      {
        name: 'Cybersecurity',
        competency_name: 'Cybersecurity',
        category: 'Security Audits & Vulnerability Assessment',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Firewall rules, SSH key management, and endpoint detection.'
      },
      {
        name: 'Data Engineering',
        competency_name: 'Data Engineering',
        category: 'Database Management & ETL',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 80,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Database backup scripts, point-in-time recovery, and integrity checks.'
      },
      {
        name: 'Software Engineering',
        competency_name: 'Software Engineering',
        category: 'Application Architecture & APIs',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Bash automation scripting and operational tool integration.'
      },
      {
        name: 'Digital Governance',
        competency_name: 'Digital Governance',
        category: 'e-Governance Frameworks & Standards',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Strategic Enhancement',
        is_mandatory: true,
        description: 'MeitY data centre hosting policies and uptime compliance.'
      }
    ],
    future_competencies: ['Cloud Security & DevSecOps', 'Zero-Trust Architecture']
  },
  {
    id: 'cybersecurity-officer',
    job_family_id: 'it',
    name: 'Cybersecurity Officer',
    domain: 'Information Technology & Digital Governance',
    description: 'Information security authority in charge of vulnerability assessments, CERT-In compliance, STQC audit clearances, and incident mitigation.',
    typical_departments: [
      'Indian Computer Emergency Response Team (CERT-In)',
      'National Critical Information Infrastructure Protection Centre (NCIIPC)',
      'Ministry Chief Information Security Officer (CISO) Cell',
      'Standardisation Testing and Quality Certification (STQC)'
    ],
    standard_departments: [
      'Indian Computer Emergency Response Team (CERT-In)',
      'National Critical Information Infrastructure Protection Centre (NCIIPC)',
      'Ministry Chief Information Security Officer (CISO) Cell',
      'Standardisation Testing and Quality Certification (STQC)'
    ],
    typical_assignments: [
      'Vulnerability Assessment and Penetration Testing (VAPT)',
      'Cyber Crisis Management Plan (CCMP) Implementation',
      'Security Operations Centre (SOC) SIEM Alert Monitoring',
      'CERT-In 6-Hour Mandatory Cyber Incident Reporting Compliance'
    ],
    default_qualification: 'B.Tech / M.Tech in Information Security / CEH / CISSP / CISM',
    future_skills_focus: 'Zero-Trust Architecture, Threat Intelligence & Automated SOAR',
    required_competencies: [
      {
        name: 'Cybersecurity',
        competency_name: 'Cybersecurity',
        category: 'Security Audits & Vulnerability Assessment',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 90,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'National security critical standards, STQC audits, and threat defense.'
      },
      {
        name: 'Cloud',
        competency_name: 'Cloud',
        category: 'Government Cloud & Containerization',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Cloud security posture management and IAM isolation.'
      },
      {
        name: 'Software Engineering',
        competency_name: 'Software Engineering',
        category: 'Application Architecture & APIs',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Secure code review, dependency scanning, and cryptographic algorithms.'
      },
      {
        name: 'Digital Governance',
        competency_name: 'Digital Governance',
        category: 'e-Governance Frameworks & Standards',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Information Technology Act, DPDP Act 2023, and CERT-In mandates.'
      },
      {
        name: 'Data Engineering',
        competency_name: 'Data Engineering',
        category: 'Database Management & ETL',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Strategic Enhancement',
        is_mandatory: true,
        description: 'Audit log retention, SIEM log pipelines, and tamper-evident storage.'
      }
    ],
    future_competencies: ['Zero-Trust Architecture', 'Cloud Security & DevSecOps', 'AI Engineering for Public Services']
  },

  // 6. Public Administration (ADMIN)
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
    standard_departments: [
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
    default_qualification: 'Master’s Degree in Public Administration / Business Administration / Arts',
    future_skills_focus: 'Digital Workflow Automation, Citizen Sevottam & e-Office Efficiency',
    required_competencies: [
      {
        name: 'Public Administration',
        competency_name: 'Public Administration',
        category: 'CSMOP & Government Operations',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Secretariat manual procedures, official drafting, and civil service code.'
      },
      {
        name: 'Procurement',
        competency_name: 'Procurement',
        category: 'GeM & Public Tendering',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Government e-Marketplace, competitive bids, and contract terms.'
      },
      {
        name: 'Citizen Service',
        competency_name: 'Citizen Service',
        category: 'Grievance Redressal & Sevottam',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Citizen charter compliance, CPGRAMS redressal, and feedback.'
      },
      {
        name: 'Office Procedures',
        competency_name: 'Office Procedures',
        category: 'e-Office & Records Management',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'e-Office docketing, classified files, and records retention.'
      }
    ],
    future_competencies: ['Digital Workflow Automation', 'Citizen Sevottam Framework', 'Data-Driven Policy Analysis']
  },
  {
    id: 'section-officer',
    job_family_id: 'administration',
    name: 'Section Officer',
    domain: 'Public Administration',
    description: 'Central Secretariat Service (CSS) supervisory officer managing section dockets, parliamentary questions, file noting, and rule interpretation.',
    typical_departments: [
      'Central Ministries (Secretariat Wings)',
      'Cabinet Secretariat',
      'Prime Minister’s Office (PMO) Administration',
      'NITI Aayog Administration'
    ],
    standard_departments: [
      'Central Ministries (Secretariat Wings)',
      'Cabinet Secretariat',
      'Prime Minister’s Office (PMO) Administration',
      'NITI Aayog Administration'
    ],
    typical_assignments: [
      'Parliamentary Question (Starred / Unstarred) Draft Formulation',
      'Cabinet Note Scrutiny & Inter-Ministerial Comments Consolidation',
      'RTI Application Disposal & First Appellate Authority Coordination',
      'Central Secretariat Manual of Office Procedure (CSMOP) Compliance'
    ],
    default_qualification: 'Bachelor’s / Master’s Degree (Central Secretariat Service Cadre)',
    future_skills_focus: 'e-Office 7.0 Advanced Workflows, Parliamentary Digital Portals & RTI Analytics',
    required_competencies: [
      {
        name: 'Public Administration',
        competency_name: 'Public Administration',
        category: 'CSMOP & Government Operations',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Detailed file noting, draft cabinet papers, and service rules.'
      },
      {
        name: 'Office Procedures',
        competency_name: 'Office Procedures',
        category: 'e-Office & Records Management',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Strict e-Office workflows, file movement tracking, and archiving.'
      },
      {
        name: 'Citizen Service',
        competency_name: 'Citizen Service',
        category: 'Grievance Redressal & Sevottam',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'RTI disposal timeframes and public grievance tracking.'
      },
      {
        name: 'Procurement',
        competency_name: 'Procurement',
        category: 'GeM & Public Tendering',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Section level GeM requisitioning and service procurement.'
      }
    ],
    future_competencies: ['Digital Workflow Automation', 'Data-Driven Policy Analysis']
  },
  {
    id: 'under-secretary',
    job_family_id: 'administration',
    name: 'Under Secretary',
    domain: 'Public Administration',
    description: 'Gazetted executive directing branch administration, statutory rules vetting, parliamentary committee responses, and policy implementation.',
    typical_departments: [
      'Department of Expenditure / Revenue',
      'Department of Personnel & Training (DoPT)',
      'Ministry of External Affairs',
      'Ministry of Home Affairs'
    ],
    standard_departments: [
      'Department of Expenditure / Revenue',
      'Department of Personnel & Training (DoPT)',
      'Ministry of External Affairs',
      'Ministry of Home Affairs'
    ],
    typical_assignments: [
      'Branch Administration & Inter-Ministerial Policy Vetting',
      'Assurance Tracking before Parliamentary Standing Committees',
      'Statutory Rule Amendments & Notification Drafting',
      'High-Level Grievance Escalation & Disciplinary Authority Files'
    ],
    default_qualification: 'Master’s Degree in Public Administration / Law / Social Sciences',
    future_skills_focus: 'Evidence-Based Public Policy, Administrative Law & Digital Governance',
    required_competencies: [
      {
        name: 'Public Administration',
        competency_name: 'Public Administration',
        category: 'CSMOP & Government Operations',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 90,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Executive policy drafting, constitutional norms, and administrative law.'
      },
      {
        name: 'Office Procedures',
        competency_name: 'Office Procedures',
        category: 'e-Office & Records Management',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 85,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Secretariat coordination, record classifications, and executive briefs.'
      },
      {
        name: 'Citizen Service',
        competency_name: 'Citizen Service',
        category: 'Grievance Redressal & Sevottam',
        required_proficiency: 'Advanced',
        target_level: 'Advanced',
        benchmark_target: 80,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'High-level public complaint resolution and institutional responsiveness.'
      },
      {
        name: 'Procurement',
        competency_name: 'Procurement',
        category: 'GeM & Public Tendering',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Departmental tender approval and GeM threshold approvals.'
      }
    ],
    future_competencies: ['Digital Workflow Automation', 'Evidence-Based Public Policy']
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
    standard_departments: [
      'General Administration Department',
      'District Administration',
      'Departmental Field Offices'
    ],
    typical_assignments: [
      'General Operations & Public Service',
      'Departmental Coordination & Public Interface',
      'Program Implementation'
    ],
    default_qualification: 'Bachelor’s Degree in any discipline from a recognized University',
    future_skills_focus: 'Digital Governance & Fluency, Data Literacy for Administrators',
    required_competencies: [
      {
        name: 'Public Administration',
        competency_name: 'Public Administration',
        category: 'Government Operations',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Baseline standard for government office procedure and ethics.'
      },
      {
        name: 'Procurement',
        competency_name: 'Procurement',
        category: 'Public Procurement & GeM',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 70,
        criticality: 'Operational Necessity',
        is_mandatory: true,
        description: 'Standard for goods and services procurement adhering to transparency norms.'
      },
      {
        name: 'Citizen Service',
        competency_name: 'Citizen Service',
        category: 'Public Interface & Grievances',
        required_proficiency: 'Intermediate',
        target_level: 'Intermediate',
        benchmark_target: 75,
        criticality: 'Core Role Prerequisite',
        is_mandatory: true,
        description: 'Effective public grievance redressal and transparent service delivery.'
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
    relevant_roles: ['statistical-officer', 'senior-statistical-officer', 'assistant-director'],
    prerequisites: ['Python', 'Statistics', 'Data Analysis'],
    recommended_proficiency: 'Advanced',
    explanation: 'This emerging capability automates industrial classification (NIC/NCO) and outlier detection in high-frequency economic datasets.',
    suggested_resource_id: 10
  },
  {
    id: 'future-stat-gis',
    name: 'Geospatial Analytics',
    job_family_id: 'statistics',
    relevant_roles: ['statistical-officer', 'senior-statistical-officer', 'assistant-director'],
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
    relevant_roles: ['civil-engineer', 'assistant-engineer', 'executive-engineer', 'superintending-engineer'],
    prerequisites: ['Project Management', 'Quality Assurance'],
    recommended_proficiency: 'Intermediate',
    explanation: 'This skill can support your current infrastructure project work as digital monitoring, drone surveys, and PM-GatiShakti GIS expand across public works.',
    suggested_resource_id: 101
  },
  {
    id: 'future-eng-bim',
    name: 'Building Information Modeling (BIM)',
    job_family_id: 'engineering',
    relevant_roles: ['civil-engineer', 'assistant-engineer', 'executive-engineer', 'superintending-engineer'],
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
    relevant_roles: ['medical-officer', 'public-health-officer', 'health-programme-officer'],
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
    relevant_roles: ['finance-officer', 'accounts-officer', 'audit-officer'],
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
    relevant_roles: ['it-officer', 'software-engineer', 'system-administrator', 'cybersecurity-officer'],
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
    relevant_roles: ['administrative-officer', 'section-officer', 'under-secretary', 'general-officer'],
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
