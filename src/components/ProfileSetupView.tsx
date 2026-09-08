import { useState, type FormEvent } from 'react';
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
  LogOut
} from 'lucide-react';
import { saveProfileSetup } from '../services/api.ts';
import type { LearnerProfile } from '../types/index.ts';

interface ProfileSetupViewProps {
  learner: LearnerProfile;
  onProfileComplete: (updatedLearner: LearnerProfile) => void;
  onLogout: () => void;
}

export default function ProfileSetupView({ learner, onProfileComplete, onLogout }: ProfileSetupViewProps) {
  const [formData, setFormData] = useState({
    name: learner.name || '',
    role: learner.role || 'Statistical Officer',
    department: learner.department || 'Survey Division (NSSO)',
    current_assignment: learner.current_assignment || '',
    educational_qualification: learner.educational_qualification || '',
    years_of_experience: learner.years_of_experience !== undefined ? String(learner.years_of_experience) : '2',
    previous_training: learner.previous_training || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Full Name is required (at least 2 characters).';
    }
    if (!formData.role.trim()) {
      newErrors.role = 'Designation is required.';
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
      const updated = await saveProfileSetup({
        learner_id: learner.id,
        name: formData.name.trim(),
        role: formData.role.trim(),
        department: formData.department.trim(),
        current_assignment: formData.current_assignment.trim(),
        educational_qualification: formData.educational_qualification.trim(),
        years_of_experience: Number(formData.years_of_experience),
        previous_training: formData.previous_training.trim(),
      });
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
      <header className="bg-white border-b border-slate-200">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-white to-emerald-600" />
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 flex items-center justify-center text-amber-400 font-bold shadow-sm">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                Government of India • MoSPI
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Cadre Onboarding & Service Profile Setup
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 hidden sm:inline">
              Authenticated: <strong>{learner.email}</strong>
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {/* Onboarding Workflow Steps */}
        <div className="mb-8 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Officer Onboarding Workflow
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-md bg-amber-50 border border-amber-300 flex items-center gap-2 font-semibold text-amber-900">
              <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">1</div>
              <span>Profile & Background</span>
            </div>
            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-600">
              <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-bold">2</div>
              <span>Diagnostic Assessment</span>
            </div>
            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-600">
              <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-bold">3</div>
              <span>Skill Gap Dashboard</span>
            </div>
          </div>
        </div>

        {/* Profile Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Complete Official Cadre Profile
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Please provide your designation, operational division, and technical background. This information will personalize your competency gap benchmarks and training paths.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name & Designation */}
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
                    placeholder="e.g. Ramesh Chandra"
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all ${
                      errors.name ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Designation / Cadre Role <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="profile-role"
                    list="role-suggestions"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Statistical Officer"
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all ${
                      errors.role ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                    }`}
                  />
                  <datalist id="role-suggestions">
                    <option value="Statistical Officer" />
                    <option value="Senior Statistical Officer" />
                    <option value="Assistant Director (Statistics)" />
                    <option value="Deputy Director (Data Analytics)" />
                    <option value="Data Processing Assistant" />
                  </datalist>
                </div>
                {errors.role && <p className="text-xs text-rose-600 mt-1">{errors.role}</p>}
              </div>
            </div>

            {/* Department & Experience */}
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
                    <option value="Survey Division (NSSO)" />
                    <option value="National Accounts Division (NAD)" />
                    <option value="Economic Statistics Division (ESD)" />
                    <option value="Field Operations Division (FOD)" />
                    <option value="Price Statistics Division (CPI)" />
                    <option value="Data Storage & Dissemination Division" />
                  </datalist>
                </div>
                {errors.department && <p className="text-xs text-rose-600 mt-1">{errors.department}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Years of Experience in Official Statistics <span className="text-rose-600">*</span>
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

            {/* Current Assignment */}
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
                  placeholder="e.g. M.Sc. in Statistics (University of Delhi) or M.A. in Econometrics"
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
                Previous Training / Certifications <span className="text-slate-400">(Optional)</span>
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
                  placeholder="e.g. NSSTA Induction Training on Official Statistics, Python for Data Analytics Workshop (2024)"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                List any workshops at NSSTA, iGOT Karmayogi modules, or in-service statistical courses.
              </p>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Profile data stored persistently in PostgreSQL database
              </div>

              <button
                type="submit"
                id="btn-save-profile"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Officer Profile...
                  </>
                ) : (
                  <>
                    Save Profile & Proceed to Diagnostic Assessment
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
