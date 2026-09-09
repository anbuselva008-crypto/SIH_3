import { 
  JOB_FAMILIES, 
  ROLES, 
  FUTURE_SKILLS, 
  ALL_COMPETENCIES_CATALOGUE 
} from '../database/domainPacksData.ts';
import type { 
  JobFamily, 
  RoleDefinition, 
  CompetencyCatalogueItem, 
  FutureSkillItem, 
  RoleProfileResponse 
} from '../database/domainTypes.ts';

export class DomainPackService {
  /**
   * List all available Job Families with their embedded roles
   */
  static getJobFamilies(): JobFamily[] {
    return JOB_FAMILIES.map((jf) => ({
      ...jf,
      roles: this.getRolesByJobFamily(jf.id)
    }));
  }

  static getAllJobFamilies(): JobFamily[] {
    return JOB_FAMILIES.map((jf) => ({
      ...jf,
      roles: this.getRolesByJobFamily(jf.id)
    }));
  }

  /**
   * Get all roles across all job families
   */
  static getAllRoles(): RoleDefinition[] {
    return ROLES;
  }

  /**
   * Get all future skills in framework
   */
  static getAllFutureSkills(): FutureSkillItem[] {
    return FUTURE_SKILLS;
  }

  /**
   * Get specific Job Family by ID with its embedded roles
   */
  static getJobFamilyById(id: string): JobFamily | undefined {
    const jf = JOB_FAMILIES.find((item) => item.id.toLowerCase() === id.toLowerCase());
    if (!jf) return undefined;
    return {
      ...jf,
      roles: this.getRolesByJobFamily(jf.id)
    };
  }

  /**
   * Get all roles belonging to a job family
   */
  static getRolesByJobFamily(jobFamilyId: string): RoleDefinition[] {
    return ROLES.filter((r) => r.job_family_id.toLowerCase() === jobFamilyId.toLowerCase());
  }

  /**
   * Get role definition by role ID
   */
  static getRoleById(roleId: string): RoleDefinition | undefined {
    return ROLES.find((r) => r.id.toLowerCase() === roleId.toLowerCase());
  }

  /**
   * Resolves a role definition from user text or role id.
   * If "other" or unrecognized, falls back safely to General Government Cadre without hallucinating.
   */
  static resolveRole(roleNameOrId: string, departmentText?: string): RoleDefinition {
    const clean = (roleNameOrId || '').trim().toLowerCase();

    // 1. Direct ID match
    const byId = ROLES.find((r) => r.id.toLowerCase() === clean);
    if (byId) return byId;

    // 2. Direct Name match
    const byName = ROLES.find((r) => r.name.toLowerCase() === clean);
    if (byName) return byName;

    // 3. Specific role keyword matches (hierarchical from most specific to general)
    // Engineering
    if (clean.includes('superintending')) return ROLES.find((r) => r.id === 'superintending-engineer')!;
    if (clean.includes('executive engineer')) return ROLES.find((r) => r.id === 'executive-engineer')!;
    if (clean.includes('assistant engineer')) return ROLES.find((r) => r.id === 'assistant-engineer')!;
    if (clean.includes('civil') || clean.includes('engineer') || clean.includes('pwd') || clean.includes('public works')) {
      return ROLES.find((r) => r.id === 'civil-engineer')!;
    }

    // Statistics
    if (clean.includes('senior statistical')) return ROLES.find((r) => r.id === 'senior-statistical-officer')!;
    if (clean.includes('assistant director')) return ROLES.find((r) => r.id === 'assistant-director')!;
    if (clean.includes('statistic') || clean.includes('nsso') || clean.includes('survey')) {
      return ROLES.find((r) => r.id === 'statistical-officer')!;
    }

    // Health
    if (clean.includes('public health officer') || clean.includes('epidemiolog')) return ROLES.find((r) => r.id === 'public-health-officer')!;
    if (clean.includes('health programme') || clean.includes('nhm coordinator')) return ROLES.find((r) => r.id === 'health-programme-officer')!;
    if (clean.includes('doctor') || clean.includes('medical') || clean.includes('health')) {
      return ROLES.find((r) => r.id === 'medical-officer')!;
    }

    // Finance
    if (clean.includes('accounts officer') || clean.includes('pao')) return ROLES.find((r) => r.id === 'accounts-officer')!;
    if (clean.includes('audit officer') || clean.includes('c&ag') || clean.includes('cag')) return ROLES.find((r) => r.id === 'audit-officer')!;
    if (clean.includes('finance') || clean.includes('treasury') || clean.includes('budget')) {
      return ROLES.find((r) => r.id === 'finance-officer')!;
    }

    // IT
    if (clean.includes('cyber') || clean.includes('security') || clean.includes('cert-in')) return ROLES.find((r) => r.id === 'cybersecurity-officer')!;
    if (clean.includes('software') || clean.includes('developer')) return ROLES.find((r) => r.id === 'software-engineer')!;
    if (clean.includes('system admin') || clean.includes('sysadmin') || clean.includes('network admin')) return ROLES.find((r) => r.id === 'system-administrator')!;
    if (clean.includes('it ') || clean.includes('it-') || clean.includes('information tech') || clean.includes('informatics')) {
      return ROLES.find((r) => r.id === 'it-officer')!;
    }

    // Administration
    if (clean.includes('under sec') || clean.includes('under-sec')) return ROLES.find((r) => r.id === 'under-secretary')!;
    if (clean.includes('section officer')) return ROLES.find((r) => r.id === 'section-officer')!;
    if (clean.includes('admin') || clean.includes('secretariat') || clean.includes('dopt')) {
      return ROLES.find((r) => r.id === 'administrative-officer')!;
    }

    // 4. Department text fallback
    if (departmentText) {
      const deptClean = departmentText.toLowerCase();
      if (deptClean.includes('public works') || deptClean.includes('pwd') || deptClean.includes('highway') || deptClean.includes('irrigation')) {
        return ROLES.find((r) => r.id === 'civil-engineer')!;
      }
      if (deptClean.includes('statistic') || deptClean.includes('mospi')) {
        return ROLES.find((r) => r.id === 'statistical-officer')!;
      }
      if (deptClean.includes('health') || deptClean.includes('medical') || deptClean.includes('hospital')) {
        return ROLES.find((r) => r.id === 'medical-officer')!;
      }
      if (deptClean.includes('finance') || deptClean.includes('treasury') || deptClean.includes('audit') || deptClean.includes('cga')) {
        return ROLES.find((r) => r.id === 'finance-officer')!;
      }
      if (deptClean.includes('nic') || deptClean.includes('meity') || deptClean.includes('informatics')) {
        return ROLES.find((r) => r.id === 'it-officer')!;
      }
    }

    // Default to general public service officer
    return ROLES.find((r) => r.id === 'general-officer')!;
  }

  /**
   * Get full Role Profile with Job Family, competencies, and Future Skills
   */
  static getRoleProfile(roleIdOrName: string, departmentText?: string): RoleProfileResponse {
    const role = this.resolveRole(roleIdOrName, departmentText);
    const jobFamily = this.getJobFamilyById(role.job_family_id) || JOB_FAMILIES[JOB_FAMILIES.length - 1];
    const futureSkills = this.getFutureSkillsForRole(role.id);

    return {
      role,
      job_family: jobFamily,
      required_competencies: role.required_competencies,
      future_skills: futureSkills,
      typical_assignments: role.typical_assignments,
    };
  }

  /**
   * Get Future Skills relevant to a specific role
   */
  static getFutureSkillsForRole(roleIdOrName: string): FutureSkillItem[] {
    const role = this.resolveRole(roleIdOrName);
    const targetId = role ? role.id.toLowerCase() : roleIdOrName.toLowerCase().replace(/_/g, '-');
    return FUTURE_SKILLS.filter(
      (fs) => fs.relevant_roles.some((r) => {
        const cleanR = r.toLowerCase().replace(/_/g, '-');
        return cleanR === targetId || cleanR === roleIdOrName.toLowerCase() || r === 'all';
      }) || fs.relevant_roles.includes('all')
    );
  }

  /**
   * Get the primary Future Skill for a role to show in "One Future Skill" Card
   */
  static getPrimaryFutureSkillForRole(roleId: string): FutureSkillItem | null {
    const skills = this.getFutureSkillsForRole(roleId);
    return skills.length > 0 ? skills[0] : null;
  }

  /**
   * Get all competencies in the master catalogue
   */
  static getAllCompetenciesCatalogue(): CompetencyCatalogueItem[] {
    return ALL_COMPETENCIES_CATALOGUE;
  }
}
