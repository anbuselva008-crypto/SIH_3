import { Target, Compass, BookOpen, Clock, ArrowRight, Award } from 'lucide-react';
import type { RecommendationItem } from '../types/index.ts';

interface NextLearningStepCardProps {
  item: RecommendationItem | null;
  onViewDetails: (item: RecommendationItem) => void;
}

export default function NextLearningStepCard({
  item,
  onViewDetails,
}: NextLearningStepCardProps) {
  if (!item) {
    return (
      <div 
        id="next-learning-step-card"
        className="bg-white rounded-xl border border-slate-200 p-6 text-center"
      >
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3">
          <Target className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Your Next Learning Step</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Complete the diagnostic competency assessment to generate your immediate, personalized training recommendation.
        </p>
      </div>
    );
  }

  const { resource } = item;
  const isIGOT = resource.source === 'iGOT';

  return (
    <div
      id="next-learning-step-card"
      className="relative overflow-hidden rounded-xl border-2 border-blue-600/30 bg-gradient-to-br from-white via-blue-50/20 to-slate-50 shadow-sm"
    >
      {/* Top Banner Stripe */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center">
            <Target className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">
            Your Next Learning Step
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-medium">
            Priority Recommendation #1
          </span>
          <span className="text-[11px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded font-bold">
            Demo Catalogue
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            {/* Title and Badges */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  isIGOT 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  Source: {resource.source}
                </span>

                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                  Level: {resource.level}
                </span>

                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Duration: {resource.duration}
                </span>

                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Focus: {resource.competency}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {resource.title}
              </h3>
            </div>

            {/* Why This is Recommended */}
            <div className="bg-white/80 border border-blue-100 rounded-lg p-4 shadow-2xs">
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-700" />
                Why this is recommended:
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {item.reason}
              </p>
            </div>
          </div>

          {/* Action CTA Panel */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-center gap-3 shrink-0 lg:border-l lg:border-slate-200 lg:pl-6">
            <div className="text-left lg:text-right">
              <p className="text-xs text-slate-500">Cadre Relevance Score</p>
              <p className="text-2xl font-black text-blue-700">
                {item.recommendation_score}
                <span className="text-xs font-normal text-slate-400 ml-1">/100</span>
              </p>
            </div>

            <button
              id="view-next-learning-step-btn"
              onClick={() => onViewDetails(item)}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer group"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Learning</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
