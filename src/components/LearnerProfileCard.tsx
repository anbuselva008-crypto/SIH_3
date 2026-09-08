import { User, Briefcase, Building, Award, CheckCircle2, TrendingUp, GraduationCap, Calendar, FileText, Sparkles } from 'lucide-react';
import type { LearnerProfile } from '../types/index.ts';

interface LearnerProfileCardProps {
  learner: LearnerProfile;
}

export default function LearnerProfileCard({ learner }: LearnerProfileCardProps) {
  // Determine score color and tier
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div
      id="learner-profile-card"
      className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Learner Identity Details */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
            <User className="w-7 h-7" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="learner-name" className="text-xl font-bold text-slate-900">
                {learner.name}
              </h2>

              {learner.is_demo ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Synthetic / Demo Profile (Arun Kumar)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified Cadre Officer
                </span>
              )}

              {learner.profile_completed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Profile Completed
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5" id="learner-role">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-700">Role:</span> {learner.role}
              </div>

              <span className="text-slate-300 hidden sm:inline">•</span>

              <div className="flex items-center gap-1.5" id="learner-department">
                <Building className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-700">Department:</span> {learner.department}
              </div>

              {learner.email && (
                <>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-slate-500">{learner.email}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overall Competency Metric Block */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              Overall Competency
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Aggregate of {learner.competency_count} Competencies
            </div>
          </div>

          <div
            id="learner-overall-score"
            className={`w-16 h-16 rounded-lg border flex flex-col items-center justify-center font-bold ${getScoreColor(
              learner.overall_score
            )}`}
          >
            <span className="text-2xl leading-none">{learner.overall_score}%</span>
            <span className="text-[10px] uppercase font-semibold mt-1">Score</span>
          </div>
        </div>
      </div>

      {/* Cadre Background Details (Assignment, Qualification, Experience, Training) */}
      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded bg-slate-50/80 border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Current Assignment
          </div>
          <p className="text-slate-800 font-medium line-clamp-2">
            {learner.current_assignment || 'Periodic Labour Force Survey (PLFS) Microdata Validation'}
          </p>
        </div>

        <div className="p-2.5 rounded bg-slate-50/80 border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            Qualification
          </div>
          <p className="text-slate-800 font-medium">
            {learner.educational_qualification || 'M.Sc. Statistics'}
          </p>
        </div>

        <div className="p-2.5 rounded bg-slate-50/80 border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Service Experience
          </div>
          <p className="text-slate-800 font-medium">
            {learner.years_of_experience !== undefined ? `${learner.years_of_experience} Years in Cadre` : '4 Years in Cadre'}
          </p>
        </div>

        <div className="p-2.5 rounded bg-slate-50/80 border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            Previous Training
          </div>
          <p className="text-slate-800 font-medium line-clamp-2">
            {learner.previous_training || 'NSSTA Induction Program on Official Statistics'}
          </p>
        </div>
      </div>

      {/* Summary Highlights */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-md bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            Top Competency
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            {learner.top_competency}
          </p>
        </div>

        <div className="p-3 rounded-md bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            Priority Focus Area
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            {learner.focus_competency}
          </p>
        </div>

        <div className="p-3 rounded-md bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Building className="w-3.5 h-3.5 text-blue-600" />
            Cadre Division
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            {learner.department}
          </p>
        </div>
      </div>
    </div>
  );
}
