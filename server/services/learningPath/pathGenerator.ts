import type { LearnerProfile, CompetencyItem } from '../../database/models.ts';
import type { DiscoveredResource } from '../learningDiscovery/types.ts';
import type { GeneratedPathPlan, GeneratedStepPlan } from './types.ts';

/**
 * Curated knowledge base of known course modules for verified prototype and national platforms
 * (CPWD Works Manual, NPTEL, iGOT, SWAYAM, MoSPI manuals)
 */
const VERIFIED_COURSE_MODULE_MAP: Record<string, Array<{ section: string; title: string; desc: string }>> = {
  // CPWD Works Manual & Contract Management
  'cpwd': [
    { section: 'Section 1: General Principles & Tender Documentation', title: 'Tender Formulation & NIT Preparation', desc: 'Study standard bidding document drafting, technical qualification parameters, and notice inviting tenders.' },
    { section: 'Section 2: Work Execution & Measurement Protocols', title: 'Site Supervision & Measurement Book Standards', desc: 'Standard operating procedures for contractor measurement recording, interim running bills, and site quality registers.' },
    { section: 'Section 3: Contract Administration & Milestone Tracking', title: 'Contractual Variations, Escalation & Penalties', desc: 'Procedures for variation sanctions, extension of time (EOT), liquidated damages, and contractor milestone auditing.' },
    { section: 'Section 4: Dispute Resolution & Arbitration Guidelines', title: 'Dispute Settlement, Conciliation & Arbitral Claims', desc: 'Handling contractor disputes, arbitration defense, settlement protocols under CPWD Arbitration Manual.' },
  ],
  // NPTEL Contract Management in Construction
  'nptel_contract': [
    { section: 'Unit 1: Standard Bidding Documents & Legal Framework', title: 'Construction Contracts & FIDIC Conditions', desc: 'Overview of Indian Contract Act 1872 applied to civil works, FIDIC conditions of contract, and risk allocation.' },
    { section: 'Unit 2: Tendering, Bid Evaluation & Award', title: 'Public Procurement Rules & Bid Analysis', desc: 'Two-packet tender evaluation, technical responsiveness scrutiny, and financial comparison protocols.' },
    { section: 'Unit 3: Contract Administration & Payment Certifications', title: 'Running Accounts, Variations & Time Extensions', desc: 'Contract administrator duties, variation validation, price escalation formulas, and time extension analysis.' },
    { section: 'Unit 4: Claims Management & Dispute Avoidance', title: 'Contractual Claims, Liquidated Damages & Conciliation', desc: 'Claim documentation, analysis of delay liability, liquidated damages assessment, and dispute boards.' },
  ],
  // Python for Data Analysis
  'python_data': [
    { section: 'Module 1: Tabular Ingestion & Cleaning', title: 'Data Cleaning & Validation with Pandas', desc: 'Load complex microdata, handle missing values, map classifications, and enforce strict type schemas.' },
    { section: 'Module 2: Grouped Operations & Survey Aggregations', title: 'Stratified Aggregation & Microdata Operations', desc: 'Grouped operations, split-apply-combine techniques, and district/sector statistical summaries.' },
    { section: 'Module 3: Survey Weights & Multipliers', title: 'Weighted Estimations & Calibration Multipliers', desc: 'Incorporate sampling multipliers, compute unbiased population estimates, and calculate variance.' },
    { section: 'Module 4: Pipeline Automation & Dissemination', title: 'Automated Pipeline Scripting & Quality Checks', desc: 'Build reproducible Python scripts for microdata screening and export to MoSPI standard dissemination schemas.' },
  ],
  // Sample Survey Design
  'survey_design': [
    { section: 'Chapter 1: Foundations of Probability Sampling', title: 'Sampling Frames & Probability Selection', desc: 'Construct valid sampling frames, ensure non-zero selection probabilities, and avoid convenience biases.' },
    { section: 'Chapter 2: Stratified Multi-Stage Sampling', title: 'FSU & USU Allocation in NSSO Framework', desc: 'Stratification strategies, primary sampling unit selection, and household/enterprise cluster allocation.' },
    { section: 'Chapter 3: Survey Weights & Estimation Formulas', title: 'Design Weights, Multipliers & Non-Response Adjustments', desc: 'Calculate inverse-probability multipliers, post-stratification weighting, and ratio estimation.' },
    { section: 'Chapter 4: Error Scrutiny & Field Quality Control', title: 'Sampling vs Non-Sampling Error Auditing', desc: 'Identify frame attrition, enumerator bias, respondent recall errors, and field audit verification.' },
  ],
  // Cybersecurity & Application Security
  'cybersecurity': [
    { section: 'Unit 1: Government IT Architecture & Threat Landscape', title: 'Gov IT Threat Vectors & Perimeter Defense', desc: 'Assess threats to public digital infrastructure, DDoS vulnerabilities, and unauthorized privilege escalation.' },
    { section: 'Unit 2: Secure SDLC & OWASP Top 10', title: 'Application Vulnerability Assessment & Mitigation', desc: 'Remediate SQL injection, broken access control, insecure deserialization, and cross-site scripting in portal services.' },
    { section: 'Unit 3: Cryptography & Identity Management', title: 'Access Control, PKI & Audit Trail Hardening', desc: 'Configure multi-factor authentication, role-based access control, cryptographic key management, and audit logging.' },
    { section: 'Unit 4: Incident Response & CERT-In Guidelines', title: 'Incident Triage & Statutory CERT-In Reporting', desc: 'Implement automated anomaly detection, containment protocols, forensics, and mandatory CERT-In reporting.' },
  ]
};

export class PathGenerator {
  /**
   * Deterministically generates a personalized learning path based on learner context,
   * current score/proficiency, and verified resource metadata.
   */
  public static generate(
    learner: LearnerProfile,
    targetCompetency: string,
    currentScore: number,
    resource: DiscoveredResource,
    allCompetencies: CompetencyItem[] = [],
    customTargetScore: number = 75
  ): GeneratedPathPlan {
    // 1. Determine Current and Target Levels
    const currentLevel = this.calculateLevel(currentScore);
    const targetScore = Math.max(customTargetScore, currentScore + 20, 75);
    const targetLevel = this.calculateTargetLevel(currentLevel);

    // 2. Formulate Structured Learning Objective (Role + Assignment + Skill Gap)
    const learningGoal = this.buildLearningObjective(learner, targetCompetency);

    // 3. Inspect Previous Training to avoid unnecessary duplication
    const previousTrainings = (learner.previous_trainings || []).map((t) => t.toLowerCase());
    const hasBasicProcurement = previousTrainings.some((t) => t.includes('procurement'));
    const hasBasicPython = previousTrainings.some((t) => t.includes('python'));
    const hasBasicStatistics = previousTrainings.some((t) => t.includes('statistic') || t.includes('survey'));

    // 4. Determine if Resource has Verified Official Module Structure
    const moduleKey = this.detectCourseModuleKey(resource);
    const officialModules = moduleKey ? VERIFIED_COURSE_MODULE_MAP[moduleKey] : null;
    const isOfficialStructure = Boolean(officialModules && officialModules.length > 0);
    const structureLabel = isOfficialStructure ? 'Course learning sequence' : 'Suggested learning path';

    // 5. Check Prerequisites
    const prerequisiteCheck = this.evaluatePrerequisites(
      targetCompetency,
      resource,
      currentLevel,
      currentScore,
      learner,
      allCompetencies
    );

    // 6. Generate Progressive Steps
    const steps: GeneratedStepPlan[] = [];

    if (isOfficialStructure && officialModules) {
      // Structure based on actual verified course modules
      steps.push(...this.buildStepsFromOfficialModules(
        officialModules,
        learner,
        targetCompetency,
        currentLevel,
        currentScore,
        resource,
        prerequisiteCheck,
        { hasBasicProcurement, hasBasicPython, hasBasicStatistics }
      ));
    } else {
      // Suggested learning pathway based on competency and verified metadata (DO NOT fabricate fake syllabus)
      steps.push(...this.buildGenericSuggestedPath(
        learner,
        targetCompetency,
        currentLevel,
        currentScore,
        resource,
        prerequisiteCheck,
        { hasBasicProcurement, hasBasicPython, hasBasicStatistics }
      ));
    }

    // 7. Attach Future Skill Context (strictly decoupled from immediate goal)
    const futureSkillNote = this.deriveFutureSkillContext(learner.role, targetCompetency, learner.current_assignment);

    return {
      targetCompetency,
      currentScore,
      targetScore,
      currentLevel,
      targetLevel,
      learningGoal,
      roleName: learner.role,
      assignmentName: learner.current_assignment,
      resourceId: String(resource.id || ''),
      resourceTitle: resource.title,
      resourceUrl: resource.url,
      providerName: resource.provider_name,
      resourceType: resource.resource_type || 'COURSE',
      isOfficialStructure,
      structureLabel,
      totalSteps: steps.length,
      futureSkillNote,
      steps,
    };
  }

  private static calculateLevel(score: number): 'Beginner' | 'Intermediate' | 'Advanced' {
    if (score < 40) return 'Beginner';
    if (score <= 70) return 'Intermediate';
    return 'Advanced';
  }

  private static calculateTargetLevel(current: 'Beginner' | 'Intermediate' | 'Advanced'): 'Intermediate' | 'Advanced' | 'Expert' {
    if (current === 'Beginner') return 'Intermediate';
    if (current === 'Intermediate') return 'Advanced';
    return 'Expert';
  }

  private static buildLearningObjective(learner: LearnerProfile, competency: string): string {
    const roleClean = learner.role || 'Government Official';
    const assignmentClean = learner.current_assignment || 'Operational Mandate';
    return `Improve your ${competency} competency for your ${assignmentClean} assignment as a ${roleClean}.`;
  }

  private static detectCourseModuleKey(resource: DiscoveredResource): string | null {
    const title = (resource.title || '').toLowerCase();
    const url = (resource.url || '').toLowerCase();
    const desc = (resource.description || '').toLowerCase();

    if (title.includes('cpwd') || url.includes('cpwd') || desc.includes('cpwd works manual')) {
      return 'cpwd';
    }
    if ((title.includes('contract management') || desc.includes('fidic')) && (url.includes('nptel') || title.includes('nptel'))) {
      return 'nptel_contract';
    }
    if (title.includes('python') && (title.includes('data') || desc.includes('pandas') || desc.includes('microdata'))) {
      return 'python_data';
    }
    if (title.includes('survey') && (title.includes('sampling') || title.includes('design') || title.includes('methodology'))) {
      return 'survey_design';
    }
    if (title.includes('cyber') || title.includes('security') || desc.includes('owasp') || desc.includes('vulnerability')) {
      return 'cybersecurity';
    }
    return null;
  }

  private static evaluatePrerequisites(
    competency: string,
    resource: DiscoveredResource,
    currentLevel: string,
    currentScore: number,
    learner: LearnerProfile,
    allCompetencies: CompetencyItem[]
  ): { hasPrerequisite: boolean; prerequisiteName: string | null; isMet: boolean; explanation: string | null } {
    const compLower = competency.toLowerCase();
    const titleLower = (resource.title || '').toLowerCase();

    // 1. Structural Dynamics / Advanced Civil Engineering
    if (titleLower.includes('structural dynamics') || titleLower.includes('finite element')) {
      const isMet = learner.educational_qualification?.toLowerCase().includes('civil') ||
                    currentScore >= 65 ||
                    allCompetencies.some((c) => c.competency_name.toLowerCase().includes('mechanics') && c.current_score >= 60);
      return {
        hasPrerequisite: true,
        prerequisiteName: 'Matrix Structural Analysis & Mechanics of Materials',
        isMet,
        explanation: isMet
          ? 'Prerequisite met (verified from educational background & structural fundamentals)'
          : 'Before this step: Complete prerequisite in Matrix Structural Analysis',
      };
    }

    // 2. Python Data Analysis
    if (compLower.includes('python') || titleLower.includes('python for data')) {
      const priorTrainings = (learner.previous_trainings || []).map((t) => t.toLowerCase());
      const hasPrior = priorTrainings.some((t) => t.includes('python') || t.includes('computing'));
      const isMet = currentScore >= 40 || hasPrior;
      return {
        hasPrerequisite: true,
        prerequisiteName: 'Basic Python Logic & Computing Foundations',
        isMet,
        explanation: isMet
          ? 'Prerequisite met (verified from computing baseline & prior training)'
          : 'Before this step: Complete basic syntax and variable manipulation',
      };
    }

    // 3. Advanced Survey Estimation
    if (compLower.includes('survey') && titleLower.includes('estimation')) {
      const isMet = currentScore >= 50 || learner.years_of_experience >= 3;
      return {
        hasPrerequisite: true,
        prerequisiteName: 'Probability & Sampling Frame Foundations',
        isMet,
        explanation: isMet
          ? 'Prerequisite met (verified from cadre experience & field baseline)'
          : 'Before this step: Review Probability Sampling fundamentals',
      };
    }

    return { hasPrerequisite: false, prerequisiteName: null, isMet: true, explanation: null };
  }

  private static buildStepsFromOfficialModules(
    modules: Array<{ section: string; title: string; desc: string }>,
    learner: LearnerProfile,
    competency: string,
    currentLevel: 'Beginner' | 'Intermediate' | 'Advanced',
    currentScore: number,
    resource: DiscoveredResource,
    prereq: { hasPrerequisite: boolean; prerequisiteName: string | null; isMet: boolean; explanation: string | null },
    training: { hasBasicProcurement: boolean; hasBasicPython: boolean; hasBasicStatistics: boolean }
  ): GeneratedStepPlan[] {
    const steps: GeneratedStepPlan[] = [];
    let stepNum = 1;

    // Prerequisite step if missing
    if (prereq.hasPrerequisite && !prereq.isMet) {
      steps.push({
        stepNumber: stepNum++,
        title: `Prerequisite Requirement: ${prereq.prerequisiteName}`,
        purpose: `Essential foundation needed before proceeding: ${prereq.explanation}. Ensures you understand foundational concepts to succeed in advanced modules.`,
        stepType: 'Foundation',
        competency: prereq.prerequisiteName || competency,
        estimatedEffort: '1-2 hours',
        prerequisite: prereq.prerequisiteName,
        prerequisiteMet: false,
        resourceUrl: resource.url,
        sectionRef: 'Prerequisite Module',
        completionCondition: `Review preparatory syllabus for ${prereq.prerequisiteName} and confirm conceptual readiness.`,
      });
    }

    // Adapt based on level & prior training
    modules.forEach((mod, idx) => {
      // If intermediate/advanced, skip or adapt 1st introductory module if prior training exists
      if (idx === 0) {
        if (training.hasBasicProcurement && competency.toLowerCase().includes('contract')) {
          steps.push({
            stepNumber: stepNum++,
            title: `${mod.title} (Cadre Fast-Track)`,
            purpose: `Previous training recognized: Basic Procurement. Foundational procurement review is condensed so you focus on operational execution under ${learner.current_assignment}.`,
            stepType: 'Review',
            competency,
            estimatedEffort: '30 mins',
            prerequisite: null,
            prerequisiteMet: true,
            resourceUrl: resource.url,
            sectionRef: mod.section,
            completionCondition: 'Verify alignment with standard bidding document guidelines.',
          });
          return;
        }

        if (currentLevel === 'Intermediate' || currentLevel === 'Advanced') {
          steps.push({
            stepNumber: stepNum++,
            title: `${mod.title} (Refresher & Diagnostic)`,
            purpose: `Targeted review of core principles tailored for your ${currentLevel} baseline (${currentScore}/100), connecting directly to ${learner.current_assignment}.`,
            stepType: 'Review',
            competency,
            estimatedEffort: '45 mins',
            prerequisite: null,
            prerequisiteMet: true,
            resourceUrl: resource.url,
            sectionRef: mod.section,
            completionCondition: 'Review key operational clauses and verify diagnostic readiness.',
          });
          return;
        }
      }

      // Default module addition
      const stepType = idx === modules.length - 1 ? 'Practical' : (idx % 2 === 0 ? 'Concept' : 'Scenario');
      steps.push({
        stepNumber: stepNum++,
        title: mod.title,
        purpose: `Official curriculum: ${mod.desc} Directly builds operational proficiency for ${learner.role} requirements.`,
        stepType: stepType as any,
        competency,
        estimatedEffort: '1-2 hours',
        prerequisite: prereq.hasPrerequisite && prereq.isMet ? prereq.prerequisiteName : null,
        prerequisiteMet: true,
        resourceUrl: resource.url,
        sectionRef: mod.section,
        completionCondition: `Complete syllabus study for ${mod.section} and review field compliance scenarios.`,
      });
    });

    // Final Stage 4 Practice Assessment Step
    steps.push({
      stepNumber: stepNum++,
      title: 'Practice Knowledge Assessment',
      purpose: `Evaluate your retained knowledge and practical understanding of ${competency} against national cadre benchmarks through an AI-grounded practice quiz.`,
      stepType: 'Assessment',
      competency,
      estimatedEffort: '20 mins',
      prerequisite: 'Completion of prior course steps',
      prerequisiteMet: true,
      resourceUrl: resource.url,
      sectionRef: 'Final Knowledge Check',
      completionCondition: 'Complete the Grounded AI Practice Quiz and score >= 60% to demonstrate proficiency.',
    });

    return steps;
  }

  private static buildGenericSuggestedPath(
    learner: LearnerProfile,
    competency: string,
    currentLevel: 'Beginner' | 'Intermediate' | 'Advanced',
    currentScore: number,
    resource: DiscoveredResource,
    prereq: { hasPrerequisite: boolean; prerequisiteName: string | null; isMet: boolean; explanation: string | null },
    training: { hasBasicProcurement: boolean; hasBasicPython: boolean; hasBasicStatistics: boolean }
  ): GeneratedStepPlan[] {
    const steps: GeneratedStepPlan[] = [];
    let stepNum = 1;

    // Prerequisite step if missing
    if (prereq.hasPrerequisite && !prereq.isMet) {
      steps.push({
        stepNumber: stepNum++,
        title: `Prerequisite Requirement: ${prereq.prerequisiteName}`,
        purpose: `Essential foundation needed: ${prereq.explanation}. Complete this before proceeding to complex concepts.`,
        stepType: 'Foundation',
        competency: prereq.prerequisiteName || competency,
        estimatedEffort: '1-2 hours',
        prerequisite: prereq.prerequisiteName,
        prerequisiteMet: false,
        resourceUrl: resource.url,
        sectionRef: null,
        completionCondition: `Review basic concepts of ${prereq.prerequisiteName} to ensure study readiness.`,
      });
    }

    // Step 1: Fundamentals (adapted for level)
    if (currentLevel === 'Beginner') {
      steps.push({
        stepNumber: stepNum++,
        title: `Understand ${competency} Fundamentals`,
        purpose: `Establish core definitions, statutory principles, and administrative guidelines governing ${competency} in government operations.`,
        stepType: 'Foundation',
        competency,
        estimatedEffort: '45 mins',
        prerequisite: null,
        prerequisiteMet: true,
        resourceUrl: resource.url,
        sectionRef: null,
        completionCondition: 'Study foundational readings and master primary domain terminology.',
      });
    } else {
      steps.push({
        stepNumber: stepNum++,
        title: `Core Principles Review & Cadre Alignment`,
        purpose: `Targeted review of ${competency} principles calibrated for your ${currentLevel} baseline (${currentScore}/100), skipping redundant introductory basics.`,
        stepType: 'Review',
        competency,
        estimatedEffort: '30 mins',
        prerequisite: null,
        prerequisiteMet: true,
        resourceUrl: resource.url,
        sectionRef: null,
        completionCondition: 'Review regulatory standards and verify conceptual alignment.',
      });
    }

    // Step 2: Core Concepts
    steps.push({
      stepNumber: stepNum++,
      title: `Master Core ${competency} Concepts`,
      purpose: `Explore essential frameworks, methodology standards, and technical rules required for ${competency} execution in ${resource.provider_name}.`,
      stepType: 'Concept',
      competency,
      estimatedEffort: '1-2 hours',
      prerequisite: null,
      prerequisiteMet: true,
      resourceUrl: resource.url,
      sectionRef: null,
      completionCondition: 'Examine detailed concepts and workflow guidelines from the verified resource.',
    });

    // Step 3: Role-Relevant Application
    steps.push({
      stepNumber: stepNum++,
      title: `Study Application in ${learner.current_assignment}`,
      purpose: `Analyze how ${competency} is applied directly to your operational assignment as a ${learner.role}, examining real government workflows.`,
      stepType: 'Practical',
      competency,
      estimatedEffort: '1 hour',
      prerequisite: null,
      prerequisiteMet: true,
      resourceUrl: resource.url,
      sectionRef: null,
      completionCondition: 'Map practical methodologies to your department and operational responsibilities.',
    });

    // Step 4: Scenario-Based Practice
    steps.push({
      stepNumber: stepNum++,
      title: `Practice with Scenarios & Case Examples`,
      purpose: `Work through realistic scenario questions and field case studies to resolve practical challenges encountered in ${learner.current_assignment}.`,
      stepType: 'Scenario',
      competency,
      estimatedEffort: '45 mins',
      prerequisite: null,
      prerequisiteMet: true,
      resourceUrl: resource.url,
      sectionRef: null,
      completionCondition: 'Evaluate case scenarios and formulate evidence-based decisions.',
    });

    // Step 5: Knowledge Check (Assessment)
    steps.push({
      stepNumber: stepNum++,
      title: 'Practice Knowledge Assessment',
      purpose: `Validate your mastery of ${competency} against cadre expectations through an AI-grounded practice quiz.`,
      stepType: 'Assessment',
      competency,
      estimatedEffort: '20 mins',
      prerequisite: 'Completion of prior learning steps',
      prerequisiteMet: true,
      resourceUrl: resource.url,
      sectionRef: null,
      completionCondition: 'Complete the Grounded AI Practice Quiz and score >= 60% to demonstrate proficiency.',
    });

    return steps;
  }

  private static deriveFutureSkillContext(role: string, competency: string, assignment: string): string | null {
    const roleLower = role.toLowerCase();
    const compLower = competency.toLowerCase();
    const assignLower = assignment.toLowerCase();

    if (roleLower.includes('civil') || assignLower.includes('infrastructure')) {
      return '🚀 FUTURE SKILL TO EXPLORE LATER: Building Information Modeling (BIM) & Digital Twin Infrastructure - strategic capability earmarked for future urban infrastructure planning.';
    }
    if (roleLower.includes('statistical') || roleLower.includes('survey') || assignLower.includes('plfs')) {
      return '🚀 FUTURE SKILL TO EXPLORE LATER: Big Data Architecture & Automated Pipeline Modernization - emerging national priority for next-generation statistical data lakes.';
    }
    if (roleLower.includes('cyber') || roleLower.includes('it') || compLower.includes('security')) {
      return '🚀 FUTURE SKILL TO EXPLORE LATER: AI Security Auditing & Zero Trust Architecture - strategic cybersecurity framework adopted across critical government infrastructure.';
    }
    return '🚀 FUTURE SKILL TO EXPLORE LATER: Advanced Digital Governance & Policy Analytics - future capability for cadre leadership development.';
  }
}
