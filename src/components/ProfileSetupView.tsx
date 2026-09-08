import { useState, useEffect, type FormEvent } from 'react';
import { 
  Building2, 
  User, 
  Briefcase, 
  Building, 
  GraduationCap, 
  Calendar, 
  FileText, 
  BookOpen, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  LogOut,
  Layers,
  Sparkles,
  Award,
  ChevronRight,
  Globe
} from 'lucide-react';
import { saveProfileSetup, fetchJobFamilies } from '../services/api.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';
import type { LearnerProfile, JobFamily, RoleDefinition, SupportedLanguage } from '../types/index.ts';

interface ProfileSetupViewProps {
  learner: LearnerProfile;
  onProfileComplete: (updatedLearner: LearnerProfile) => void;
  onLogout: () => void;
}

export default function ProfileSetupView({ learner, onProfileComplete, onLogout }: ProfileSetupViewProps) {
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  
  const [jobFamilies, setJobFamilies] = useState<JobFamily[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState<boolean>(true);

  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(learner.job_family_id || 'statistics');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(learner.role_id || 'statistical-officer');

  const [formData, setFormData] = useState({
    name: learner.name || '',
    department: learner.department || 'Survey Division (NSSO)',
    current_assignment: learner.current_assignment || '',
    educational_qualification: learner.educational_qualification || '',
    years_of_experience: learner.years_of_experience !== undefined ? String(learner.years_of_experience) : '3',
    previous_training: learner.previous_training || '',
    language_preference: (learner.language_preference as SupportedLanguage) || language || 'en',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Load Job Families and standard roles
  useEffect(() => {
    let isMounted = true;
    fetchJobFamilies()
      .then((families) => {
        if (isMounted && families.length > 0) {
          setJobFamilies(families);
          setLoadingFamilies(false);

          // If learner has an initial role or default, resolve selection
          const currentFamily = families.find(f => f.id === selectedFamilyId) || families[0];
          if (currentFamily) {
            setSelectedFamilyId(currentFamily.id);
            const rolesList = currentFamily.roles || [];
            const roleExists = rolesList.some(r => r.id === selectedRoleId);
            if (!roleExists && rolesList.length > 0) {
              setSelectedRoleId(rolesList[0].id);
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch job families dynamically, using fallback', err);
        if (isMounted) setLoadingFamilies(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Find active family and role
  const activeFamily = jobFamilies.find(f => f.id === selectedFamilyId) || jobFamilies[0];
  const activeRoles = activeFamily?.roles || [];
  const activeRole = activeRoles.find(r => r.id === selectedRoleId) || activeRoles[0];

  // When job family changes, update selected role to first role in family
  const handleFamilyChange = (familyId: string) => {
    setSelectedFamilyId(familyId);
    const fam = jobFamilies.find(f => f.id === familyId);
    const roles = fam?.roles || [];
    if (roles.length > 0) {
      const firstRole = roles[0];
      setSelectedRoleId(firstRole.id);
      const defaultDept = (firstRole.standard_departments || firstRole.typical_departments || [])[0];
      if (defaultDept && !formData.department) {
        setFormData(prev => ({ ...prev, department: defaultDept }));
      }
      if (firstRole.default_qualification && !formData.educational_qualification) {
        setFormData(prev => ({ ...prev, educational_qualification: firstRole.default_qualification }));
      }
    }
  };

  // When role changes, auto-suggest default department & qualification if blank
  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    const roleDef = activeRoles.find(r => r.id === roleId);
    if (roleDef) {
      const defaultDept = (roleDef.standard_departments || roleDef.typical_departments || [])[0];
      setFormData(prev => ({
        ...prev,
        department: prev.department || defaultDept || '',
        educational_qualification: prev.educational_qualification || roleDef.default_qualification || '',
      }));
    }
  };

  const handleAssignmentSuggestionClick = (assignment: string) => {
    setFormData(prev => ({ ...prev, current_assignment: assignment }));
    if (errors.current_assignment) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.current_assignment;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Full Name is required (at least 2 characters).';
    }
    if (!selectedFamilyId) {
      newErrors.job_family = 'Please select your Job Family / Cadre.';
    }
    if (!selectedRoleId) {
      newErrors.role = 'Please select your Cadre Role / Designation.';
    }
    if (!formData.department.trim()) {
      newErrors.department = 'Department / Division is required.';
    }
    if (!formData.current_assignment.trim() || formData.current_assignment.trim().length < 3) {
      newErrors.current_assignment = 'Please describe your current operational assignment.';
    }
    if (!formData.educational_qualification.trim()) {
      newErrors.educational_qualification = 'Educational qualification is required.';
    }
    const exp = Number(formData.years_of_experience);
    if (isNaN(exp) || exp < 0 || exp > 50) {
      newErrors.years_of_experience = 'Please enter valid years of service (0 to 50).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      const roleTitle = activeRole ? activeRole.name : 'Statistical Officer';
      const updated = await saveProfileSetup({
        learner_id: learner.id,
        name: formData.name.trim(),
        role: roleTitle,
        department: formData.department.trim(),
        current_assignment: formData.current_assignment.trim(),
        educational_qualification: formData.educational_qualification.trim(),
        years_of_experience: Number(formData.years_of_experience),
        previous_training: formData.previous_training.trim(),
        job_family_id: selectedFamilyId,
        role_id: selectedRoleId,
        language_preference: formData.language_preference,
      });

      // Synchronize active language context if user changed language in profile
      if (formData.language_preference && formData.language_preference !== language) {
        setLanguage(formData.language_preference as SupportedLanguage);
      }

      onProfileComplete(updated);
    } catch (err) {
      console.error('Error completing profile setup:', err);
      setServerError(err instanceof Error ? err.message : 'Failed to save profile. Please verify your inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="profile-setup-view" className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Ministry Banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-white to-emerald-600" />
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 flex items-center justify-center text-amber-400 font-bold shadow-sm">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                {t('govt_india')} • {t('mospi_nssta')}
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {t('setup_title')}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Header Language Picker */}
            <LanguageSelector id="setup-header-lang" variant="header" />

            <span className="text-xs text-slate-600 hidden sm:inline">
              {learner.email}
            </span>
            <button
              type="button"
              id="btn-setup-logout"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('sign_out')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* Onboarding Workflow Steps */}
        <div className="mb-6 bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Cadre Capacity Building Lifecycle
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-md bg-amber-50 border border-amber-300 flex items-center gap-2 font-semibold text-amber-900">
              <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">1</div>
              <span>{t('step_cadre_selection')}</span>
            </div>
            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-600">
              <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-bold">2</div>
              <span>{t('tab_dashboard')}</span>
            </div>
            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-600">
              <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-bold">3</div>
              <span>{t('tab_recommendations')}</span>
            </div>
          </div>
        </div>

        {/* Profile Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Universal Government Framework (UGF) Integration</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t('setup_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {t('setup_subtitle')}
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Officer Name & Language Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Officer Name <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="profile-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Chandra, ISS"
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all ${
                      errors.name ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t('language_preference_label')} <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <select
                    id="profile-language"
                    value={formData.language_preference}
                    onChange={(e) => setFormData({ ...formData, language_preference: e.target.value as SupportedLanguage })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    {supportedLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Available across 11 official working languages</p>
              </div>
            </div>

            {/* Step 2: Job Family & Cadre Role Selection */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {t('step_cadre_selection')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Job Family Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {t('select_cadre_label')} <span className="text-rose-600">*</span>
                  </label>
                  {loadingFamilies ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      Loading framework job families...
                    </div>
                  ) : (
                    <select
                      id="profile-job-family"
                      value={selectedFamilyId}
                      onChange={(e) => handleFamilyChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    >
                      {jobFamilies.map((fam) => (
                        <option key={fam.id} value={fam.id}>
                          {fam.name} ({fam.code})
                        </option>
                      ))}
                    </select>
                  )}
                  {activeFamily && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {activeFamily.description}
                    </p>
                  )}
                </div>

                {/* Cadre Role / Designation Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {t('select_role_label')} <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="profile-role-select"
                    value={selectedRoleId}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    {activeRoles.length === 0 ? (
                      <option value="" disabled>
                        No cadre roles available
                      </option>
                    ) : (
                      activeRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))
                    )}
                  </select>
                  {activeRole && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      Focus: {activeRole.future_skills_focus}
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic Role Competencies Preview Card */}
              {activeRole && activeRole.required_competencies && activeRole.required_competencies.length > 0 && (
                <div className="mt-3 p-3 bg-white rounded-md border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('role_competencies_preview')}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {activeRole.required_competencies.length} Competencies Defined
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeRole.required_competencies.map((comp, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-150 flex items-start justify-between gap-1">
                        <div>
                          <div className="font-semibold text-slate-900 text-[11px]">{comp.competency_name || (comp as any).name}</div>
                          <div className="text-[10px] text-slate-500">{comp.category} • Target {comp.benchmark_target}% ({comp.target_level || (comp as any).required_proficiency})</div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                          comp.criticality === 'Core Role Prerequisite' 
                            ? 'bg-rose-100 text-rose-800' 
                            : comp.criticality === 'Operational Necessity'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {comp.criticality}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Operational Assignment & Department */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Department / Division <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="profile-department"
                      list="dept-suggestions"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Survey Division (NSSO)"
                      className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all ${
                        errors.department ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                      }`}
                    />
                    <datalist id="dept-suggestions">
                      {activeRole?.standard_departments?.map((dept, i) => (
                        <option key={i} value={dept} />
                      ))}
                      <option value="National Accounts Division (NAD)" />
                      <option value="Economic Statistics Division (ESD)" />
                      <option value="Field Operations Division (FOD)" />
                      <option value="Price Statistics Division (CPI)" />
                    </datalist>
                  </div>
                  {errors.department && <p className="text-xs text-rose-600 mt-1">{errors.department}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {t('experience_years_label')} <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      id="profile-experience"
                      min="0"
                      max="50"
                      value={formData.years_of_experience}
                      onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                      placeholder="e.g. 3"
                      className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all ${
                        errors.years_of_experience ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.years_of_experience && <p className="text-xs text-rose-600 mt-1">{errors.years_of_experience}</p>}
                </div>
              </div>

              {/* Current Assignment with Clickable Suggestions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Current Operational Assignment <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="profile-assignment"
                    value={formData.current_assignment}
                    onChange={(e) => setFormData({ ...formData, current_assignment: e.target.value })}
                    placeholder="e.g. Periodic Labour Force Survey (PLFS) Microdata Validation & Estimation"
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all ${
                      errors.current_assignment ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.current_assignment && <p className="text-xs text-rose-600 mt-1">{errors.current_assignment}</p>}

                {/* Suggested Assignments from Framework */}
                {activeRole && activeRole.typical_assignments && activeRole.typical_assignments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] text-slate-500 font-medium mb-1">
                      {t('suggested_assignments_label')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeRole.typical_assignments.map((assign, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAssignmentSuggestionClick(assign)}
                          className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-md border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>{assign}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Educational Qualification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Highest Educational Qualification <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="profile-qualification"
                    value={formData.educational_qualification}
                    onChange={(e) => setFormData({ ...formData, educational_qualification: e.target.value })}
                    placeholder={activeRole?.default_qualification || "e.g. M.Sc. in Statistics (University of Delhi) or M.A. in Econometrics"}
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all ${
                      errors.educational_qualification ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.educational_qualification && <p className="text-xs text-rose-600 mt-1">{errors.educational_qualification}</p>}
              </div>

              {/* Previous Training / Courses */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Previous In-Service Training / Certifications <span className="text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none text-slate-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <textarea
                    id="profile-training"
                    rows={2}
                    value={formData.previous_training}
                    onChange={(e) => setFormData({ ...formData, previous_training: e.target.value })}
                    placeholder="e.g. NSSTA Induction Course on Official Statistics, Python Data Analytics Workshop"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  List any workshops at NSSTA, iGOT Karmayogi modules, or in-service statistical courses.
                </p>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Synchronized with Universal Government Framework & PostgreSQL</span>
              </div>

              <button
                type="submit"
                id="btn-save-profile"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('saving')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('complete_onboarding_btn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        Official Statistical Cadre Competency Platform • SIH 2026 Prototype • Ministry of Statistics and Programme Implementation
      </footer>
    </div>
  );
}
