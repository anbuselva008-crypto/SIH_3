import { ChevronRight, BarChart2, BookOpen, Zap } from 'lucide-react';
import type { CompetencyItem } from '../types/index.ts';

interface CompetencyCardProps {
  key?: string | number;
  competency: CompetencyItem;
  onView: (competency: CompetencyItem) => void;
  onAssess?: (competencyName: string) => void;
}

export default function CompetencyCard({ competency, onView, onAssess }: CompetencyCardProps) {
  // Score color logic
  const getProgressColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-600';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getBadgeStyle = (score: number) => {
    if (score >= 75) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (score >= 50) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-rose-50 text-rose-800 border-rose-200';
  };

  const getStatusLabel = (score: number, target: number) => {
    if (score >= target) return 'Benchmark Met';
    if (score >= 50) return 'Moderate Gap';
    return 'Critical Gap';
  };

  const delta = competency.score - competency.benchmark_target;

  return (
    <div
      id={`competency-card-${competency.id}`}
      className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
    >
      <div>
        {/* Top Header of Card */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              {competency.category}
            </span>
            <h3
              id={`competency-title-${competency.id}`}
              className="text-base font-bold text-slate-900 mt-0.5"
            >
              {competency.name}
            </h3>
          </div>

          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getBadgeStyle(
              competency.score
            )}`}
          >
            {getStatusLabel(competency.score, competency.benchmark_target)}
          </span>
        </div>

        {/* Score Display */}
        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span
              id={`competency-score-${competency.id}`}
              className="text-2xl font-extrabold text-slate-900 tracking-tight"
            >
              {competency.score}
            </span>
            <span className="text-xs font-medium text-slate-500">
              / {competency.max_score}
            </span>
            <span className={`text-[11px] font-bold ${delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ({delta >= 0 ? `+${delta}%` : `${delta}%`})
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Target: <span className="font-semibold text-slate-700">{competency.benchmark_target}%</span>
          </div>
        </div>

        {/* Simple Progress Bar Indicator with Benchmark Pin */}
        <div className="mt-2.5 relative w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            id={`competency-progress-${competency.id}`}
            className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(competency.score)}`}
            style={{ width: `${Math.min(100, Math.max(0, competency.score))}%` }}
            role="progressbar"
            aria-valuenow={competency.score}
            aria-valuemin={0}
            aria-valuemax={competency.max_score}
          />
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-900 z-10"
            style={{ left: `calc(${competency.benchmark_target}% - 2px)` }}
            title={`Benchmark: ${competency.benchmark_target}%`}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>0%</span>
          <span>Target: {competency.benchmark_target}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          id={`view-competency-btn-${competency.id}`}
          onClick={() => onView(competency)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
        >
          View Metric
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {onAssess && (
          <button
            id={`assess-competency-btn-${competency.id}`}
            onClick={() => onAssess(competency.name)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-500" />
            Assess
          </button>
        )}
      </div>
    </div>
  );
}

