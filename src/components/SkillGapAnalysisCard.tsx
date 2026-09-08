import { AlertTriangle, TrendingUp, CheckCircle2, Target, ArrowRight, ShieldAlert, Zap, Compass } from 'lucide-react';
import type { SkillGapReport, SkillGapItem } from '../types/index.ts';

interface SkillGapAnalysisProps {
  report: SkillGapReport | null;
  loading: boolean;
  onStartAssessment: (competencyName?: string) => void;
  onFindResources?: (competencyName: string) => void;
}

export default function SkillGapAnalysisCard({
  report,
  loading,
  onStartAssessment,
  onFindResources,
}: SkillGapAnalysisProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="h-36 bg-slate-100 rounded"></div>
          <div className="h-36 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div id="skill-gap-analysis-card" className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              Stage 2 Core Feature
            </span>
            <span className="text-xs text-slate-500 font-medium">Cadre Role: Statistical Officer</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-700" />
            Competency Gap Analysis & Priority Focus Areas
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time variance between Arun Kumar's assessed performance and official MoSPI benchmark targets.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            id="start-full-assessment-btn"
            onClick={() => onStartAssessment()}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Launch Diagnostic Assessment
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 divide-x divide-slate-200 bg-slate-50/50">
        <div className="p-4 text-center sm:text-left">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Assessed Average</span>
          <div className="flex items-baseline gap-1 mt-1 justify-center sm:justify-start">
            <span className="text-2xl font-black text-slate-900">{report.overall_score}%</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
        </div>

        <div className="p-4 text-center sm:text-left">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Benchmark Target</span>
          <div className="flex items-baseline gap-1 mt-1 justify-center sm:justify-start">
            <span className="text-2xl font-black text-blue-700">{report.target_average}%</span>
            <span className="text-xs text-slate-500">cadre goal</span>
          </div>
        </div>

        <div className="p-4 text-center sm:text-left">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Critical Gaps</span>
          <div className="flex items-baseline gap-1.5 mt-1 justify-center sm:justify-start">
            <span className={`text-2xl font-black ${report.critical_gaps_count > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {report.critical_gaps_count}
            </span>
            <span className="text-xs text-slate-500">competencies (&gt;15%)</span>
          </div>
        </div>

        <div className="p-4 text-center sm:text-left">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Targets Achieved</span>
          <div className="flex items-baseline gap-1.5 mt-1 justify-center sm:justify-start">
            <span className="text-2xl font-black text-emerald-700">{report.met_count}</span>
            <span className="text-xs text-slate-500">of {report.all_competencies.length} met</span>
          </div>
        </div>
      </div>

      {/* Main Analysis Body */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Cadre Priority Matrix (Ranked by Deficit)
          </h3>
          <span className="text-[11px] text-slate-500">
            Formula: Gap = max(0, Benchmark - Assessed Score)
          </span>
        </div>

        {/* Priority List */}
        <div className="space-y-3">
          {report.all_competencies.map((item) => {
            const isCritical = item.status === 'critical_gap';
            const isModerate = item.status === 'moderate_gap';
            const isMet = item.status === 'benchmark_met';

            return (
              <div
                key={item.competency_id}
                id={`skill-gap-item-${item.competency_id}`}
                className={`p-4 rounded-lg border transition-all ${
                  isCritical
                    ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70'
                    : isModerate
                    ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
                    : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCritical
                          ? 'bg-rose-600 text-white'
                          : isModerate
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {item.priority_rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{item.name}</span>
                        <span className="text-xs text-slate-500 font-normal">({item.category})</span>
                        
                        {isCritical && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3 h-3" /> Priority 1: Critical Deficit ({item.gap}% gap)
                          </span>
                        )}
                        {isModerate && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <TrendingUp className="w-3 h-3" /> Priority 2: Moderate Deficit ({item.gap}% gap)
                          </span>
                        )}
                        {isMet && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Benchmark Satisfied (+{item.score - item.benchmark_target}%)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {item.role_criticality}
                      </p>
                    </div>
                  </div>

                  {/* Score vs Target Delta display & Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/80 shrink-0">
                    <div className="text-xs font-semibold text-slate-700">
                      Score: <span className="font-bold text-slate-900">{item.score}%</span> / Target: {item.benchmark_target}%
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                      {onFindResources && (
                        <button
                          onClick={() => onFindResources(item.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                          title="Discover web and catalogue courses for this skill"
                        >
                          <Compass className="w-3 h-3 text-amber-300" />
                          <span>Find Resources</span>
                        </button>
                      )}

                      <button
                        onClick={() => onStartAssessment(item.name)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        Assess <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Visual Benchmark Comparison Bar */}
                <div className="mt-3 pt-2">
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
                    <span>Current Assessed: {item.score}%</span>
                    <span>Target Goal: {item.benchmark_target}%</span>
                  </div>
                  <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    {/* Current Score Progress */}
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isCritical
                          ? 'bg-rose-500'
                          : isModerate
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, item.score)}%` }}
                    />
                    {/* Target Marker Needle */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-slate-900 shadow-sm z-10"
                      style={{ left: `calc(${item.benchmark_target}% - 2px)` }}
                      title={`Target Benchmark: ${item.benchmark_target}%`}
                    />
                  </div>
                </div>

                {/* Directive */}
                <div className="mt-2.5 text-xs text-slate-600 italic bg-white/70 px-2.5 py-1.5 rounded border border-slate-200/60">
                  <span className="font-semibold not-italic text-slate-700">Cadre Directive: </span>
                  {item.action_directive}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
