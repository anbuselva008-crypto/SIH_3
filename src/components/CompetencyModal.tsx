import { X, Award, Target, BookOpen, Layers } from 'lucide-react';
import type { CompetencyItem, LearnerProfile } from '../types/index.ts';

interface CompetencyModalProps {
  competency: CompetencyItem | null;
  learner: LearnerProfile | null;
  onClose: () => void;
}

export default function CompetencyModal({ competency, learner, onClose }: CompetencyModalProps) {
  if (!competency) return null;

  const getTier = (score: number) => {
    if (score >= 80) return { level: 'Proficient / Advanced', desc: 'Meets national standards for statistical production & dissemination.' };
    if (score >= 70) return { level: 'Competent', desc: 'Capable of performing operational duties with standard supervisory review.' };
    if (score >= 50) return { level: 'Developing', desc: 'Foundational concepts understood; practical application needs consolidation.' };
    return { level: 'Novice / Action Required', desc: 'Competency gap detected below benchmark threshold.' };
  };

  const tier = getTier(competency.score);

  return (
    <div
      id="competency-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Competency Specification
            </span>
            <h3 id="modal-title" className="text-lg font-bold text-slate-900">
              {competency.name}
            </h3>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Top Score Banner */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Assessed Score</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
                {competency.score} <span className="text-sm font-normal text-slate-500">/ {competency.max_score}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-500 uppercase">Benchmark Target</div>
              <div className="text-lg font-bold text-slate-700 mt-0.5">
                {competency.benchmark_target}%
              </div>
            </div>
          </div>

          {/* Progress Visual */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
              <span>Attainment Level</span>
              <span>{competency.score}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full ${
                  competency.score >= 75 ? 'bg-emerald-600' : competency.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${competency.score}%` }}
              />
            </div>
          </div>

          {/* Details Table / Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Category
              </div>
              <div className="font-semibold text-slate-800 mt-1">{competency.category}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                Gap to Target
              </div>
              <div className="font-semibold text-slate-800 mt-1">
                {competency.score >= competency.benchmark_target ? (
                  <span className="text-emerald-700">None (Target Met)</span>
                ) : (
                  <span className="text-rose-700">-{competency.benchmark_target - competency.score}% gap</span>
                )}
              </div>
            </div>
          </div>

          {/* Proficiency Evaluation */}
          <div className="p-3.5 bg-blue-50/60 rounded-md border border-blue-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
              <Award className="w-4 h-4 text-blue-700" />
              Proficiency Status: {tier.level}
            </div>
            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
              {tier.desc}
            </p>
          </div>

          {learner && (
            <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
              Evaluated for Cadre Officer: <strong className="text-slate-700">{learner.name}</strong> ({learner.role}, {learner.department})
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            id="modal-close-action-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
