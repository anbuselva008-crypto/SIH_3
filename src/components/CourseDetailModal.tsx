import { useState } from 'react';
import { 
  X, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Award, 
  ArrowRight, 
  Info, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import type { RecommendationItem, LearningResource } from '../types/index.ts';

interface CourseDetailModalProps {
  item: RecommendationItem | null;
  resourceFallback?: LearningResource | null;
  onClose: () => void;
}

export default function CourseDetailModal({
  item,
  resourceFallback,
  onClose,
}: CourseDetailModalProps) {
  const [enrolled, setEnrolled] = useState(false);

  const resource = item?.resource || resourceFallback;

  if (!resource) return null;

  const currentScore = item?.current_competency_score ?? 0;
  const targetScore = item?.target_competency_score ?? 70;
  const gap = Math.max(0, targetScore - currentScore);

  const isIGOT = resource.source === 'iGOT';

  const handleStartLearning = () => {
    setEnrolled(true);
  };

  return (
    <div
      id="course-detail-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Source Branding */}
        <div className={`p-6 border-b ${
          isIGOT 
            ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white' 
            : 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                  isIGOT 
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30' 
                    : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                }`}>
                  {resource.source} Official Learning Programme
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/90 border border-white/10 font-medium">
                  {resource.level} Level
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30 font-medium">
                  Prototype Demo Catalogue
                </span>
              </div>
              <h2 className="text-xl font-bold text-white leading-snug">
                {resource.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Why This is Recommended Box */}
          {item?.reason && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2.5">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                    Why This is Recommended for You
                  </h4>
                  <p className="text-sm text-amber-900/90 leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics & Progression */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Primary Skill</span>
              </div>
              <p className="text-sm font-bold text-slate-900 truncate">
                {resource.competency}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>Duration</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {resource.duration}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Current Skill</div>
              <p className="text-sm font-bold text-slate-900">
                {currentScore}%
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Target Benchmark</div>
              <p className="text-sm font-bold text-emerald-700">
                {targetScore}% {gap > 0 && <span className="text-xs text-rose-600 font-normal">(-{gap}%)</span>}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Course Overview
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {resource.description}
            </p>
          </div>

          {/* Expected Outcome */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-1">
                  Expected Learning Outcome
                </h4>
                <p className="text-sm text-blue-900/90 leading-relaxed">
                  {resource.expected_outcome}
                </p>
              </div>
            </div>
          </div>

          {/* Prerequisites */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Prerequisites
                </h4>
                <p className="text-xs text-slate-600">
                  {resource.prerequisites}
                </p>
              </div>
            </div>
          </div>

          {/* Alignment Badges */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Cadre & Department Relevance
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {resource.target_roles.map((role, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Role: {role}
                </span>
              ))}
              {resource.relevant_departments.slice(0, 2).map((dept, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Dept: {dept}
                </span>
              ))}
            </div>
          </div>

          {/* Enrollment Success Notice */}
          {enrolled && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-in fade-in">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-emerald-950">Learning Pathway Registered</p>
                <p className="text-emerald-800 mt-0.5">
                  This course has been bookmarked in your official cadre progression record. (In production, this deep-links directly to {resource.source} Portal).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Platform: <strong className="text-slate-700">{resource.source}</strong> (Civil Services Training)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleStartLearning}
              disabled={enrolled}
              className={`w-full sm:w-auto px-5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                enrolled
                  ? 'bg-emerald-600 text-white cursor-default'
                  : isIGOT
                  ? 'bg-blue-700 hover:bg-blue-800 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {enrolled ? (
                <>
                  <Check className="w-4 h-4" />
                  Enrolled / Bookmarked
                </>
              ) : (
                <>
                  <span>Start / View Learning</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
