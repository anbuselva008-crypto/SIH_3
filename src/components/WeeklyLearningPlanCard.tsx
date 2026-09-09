import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Sliders,
  Flame,
  RotateCcw,
} from 'lucide-react';
import type {
  WeeklyPlanWithItems,
  LearnerSchedulePreferences,
  SupportedLanguage,
} from '../types/index.ts';
import { getCurrentWeeklyPlan, generateWeeklyPlan, getSchedulePreferences, getLatestWeeklyPlanForLearner } from '../services/api.ts';
import { getWeeklyPlanT } from '../i18n/weeklyPlanTranslations.ts';

interface WeeklyLearningPlanCardProps {
  learningPathId?: number | null;
  learnerId: number;
  language?: SupportedLanguage;
  onOpenWeeklyPlan: (pathId?: number) => void;
  onOpenScheduleSettings?: () => void;
}

export default function WeeklyLearningPlanCard({
  learningPathId,
  learnerId,
  language = 'en',
  onOpenWeeklyPlan,
  onOpenScheduleSettings,
}: WeeklyLearningPlanCardProps) {
  const t = getWeeklyPlanT(language);

  const [loading, setLoading] = useState<boolean>(true);
  const [plan, setPlan] = useState<WeeklyPlanWithItems | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlan() {
      try {
        setLoading(true);
        let activePlan: WeeklyPlanWithItems | null = null;
        if (learningPathId) {
          activePlan = await getCurrentWeeklyPlan(learningPathId, learnerId).catch(async () => {
            return await generateWeeklyPlan(learningPathId, learnerId, false);
          });
        } else {
          activePlan = await getLatestWeeklyPlanForLearner(learnerId);
        }

        if (isMounted) {
          setPlan(activePlan);
        }
      } catch (err) {
        console.warn('Could not load active weekly plan for dashboard card:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPlan();
    return () => {
      isMounted = false;
    };
  }, [learningPathId, learnerId]);

  if (!learningPathId || (!loading && !plan)) {
    return null;
  }

  const nextItem = plan?.items.find((i) => !i.is_completed) || plan?.items[0];

  return (
    <div
      id="weekly-learning-plan-card"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4 hover:border-slate-300 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {t.weekly_learning_plan}
              </span>
              {plan && (
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {t.week_number} {plan.week_number} (v{plan.version})
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {loading ? 'Preparing Weekly Plan...' : plan?.focus_topic}
            </h3>
          </div>
        </div>

        {plan && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                plan.momentum_status === 'On Track'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : plan.momentum_status === 'Steady'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
              {plan.momentum_status}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Synchronizing schedule...</span>
        </div>
      ) : plan ? (
        <>
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                {plan.completed_minutes} of {plan.total_planned_minutes} minutes completed
              </span>
              <span className="font-bold text-indigo-600">{plan.completion_percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(5, plan.completion_percentage))}%` }}
              />
            </div>
          </div>

          {/* Next Up Item Banner */}
          {nextItem && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded shrink-0">
                  {nextItem.day_of_week}
                </span>
                <span className="font-semibold text-slate-800 truncate">
                  {nextItem.title}
                </span>
              </div>
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {nextItem.estimated_minutes}m
              </span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-slate-500">
              Cadence: {plan.schedule_summary?.minutes_per_session || 30}m/session • {plan.schedule_summary?.preferred_period || 'Evening'}
            </div>
            <button
              id="open-weekly-plan-modal-btn"
              type="button"
              onClick={() => onOpenWeeklyPlan(plan.learning_path_id)}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <span>{t.weekly_coach}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
