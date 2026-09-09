import { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  Flame,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
  BookOpen,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Sliders,
  Check,
  History,
  FileCheck2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import type {
  WeeklyPlanWithItems,
  WeeklyLearningItem,
  WeeklyCheckpointQuestion,
  WeeklyCheckpointResult,
  LearnerSchedulePreferences,
  SupportedLanguage,
  PlanAdjustmentInput,
} from '../types/index.ts';
import {
  generateWeeklyPlan,
  getCurrentWeeklyPlan,
  getWeeklyPlanHistory,
  toggleWeeklyItem,
  startWeeklyCheckpoint,
  submitWeeklyCheckpoint,
  generateNextWeekPlan,
  adjustWeeklyPlan,
  getSchedulePreferences,
  getLatestWeeklyPlanForLearner,
} from '../services/api.ts';
import { getWeeklyPlanT } from '../i18n/weeklyPlanTranslations.ts';
import WeeklyScheduleModal from './WeeklyScheduleModal.tsx';

interface WeeklyPlanModalProps {
  learningPathId?: number | null;
  learnerId: number;
  language?: SupportedLanguage;
  onClose: () => void;
  onOpenPracticeQuiz?: (quizId: number) => void;
}

export default function WeeklyPlanModal({
  learningPathId,
  learnerId,
  language = 'en',
  onClose,
  onOpenPracticeQuiz,
}: WeeklyPlanModalProps) {
  const t = getWeeklyPlanT(language);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<WeeklyPlanWithItems | null>(null);
  const [planHistory, setPlanHistory] = useState<WeeklyPlanWithItems[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);

  // Schedule preferences state
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<LearnerSchedulePreferences | null>(null);

  // Checkpoint Quiz flow state
  const [checkpointActive, setCheckpointActive] = useState<boolean>(false);
  const [checkpointLoading, setCheckpointLoading] = useState<boolean>(false);
  const [checkpointQuestions, setCheckpointQuestions] = useState<WeeklyCheckpointQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [checkpointResult, setCheckpointResult] = useState<WeeklyCheckpointResult | null>(null);
  const [submittingCheckpoint, setSubmittingCheckpoint] = useState<boolean>(false);

  // Action in flight
  const [itemTogglingId, setItemTogglingId] = useState<number | null>(null);
  const [adaptingNextWeek, setAdaptingNextWeek] = useState<boolean>(false);
  const [adjustingPlan, setAdjustingPlan] = useState<boolean>(false);

  // Fetch initial plan and schedule preferences
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch preferences
        const prefs = await getSchedulePreferences(learnerId);
        if (isMounted) setPreferences(prefs);

        // Fetch current active plan (or auto-generate if first time)
        let activePlan: WeeklyPlanWithItems | null = null;
        if (learningPathId) {
          activePlan = await getCurrentWeeklyPlan(learningPathId, learnerId).catch(async () => {
            return await generateWeeklyPlan(learningPathId, learnerId, false);
          });
        } else {
          activePlan = await getLatestWeeklyPlanForLearner(learnerId);
        }

        if (isMounted && activePlan) {
          setPlan(activePlan);
          setSelectedWeekId(activePlan.id);
          if (activePlan.latest_result) {
            setCheckpointResult(activePlan.latest_result);
          }

          // Fetch history
          const history = await getWeeklyPlanHistory(activePlan.learning_path_id, learnerId);
          if (isMounted) {
            setPlanHistory(history);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load weekly learning plan.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [learningPathId, learnerId]);

  // Handle plan item completion toggle
  const handleToggleItem = async (itemId: number) => {
    if (!plan || itemTogglingId) return;

    try {
      setItemTogglingId(itemId);
      const updatedPlan = await toggleWeeklyItem(plan.id, itemId, learnerId);
      setPlan(updatedPlan);

      // Update history reference
      setPlanHistory((prev) => prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
    } catch (err) {
      console.error('Failed to toggle item:', err);
    } finally {
      setItemTogglingId(null);
    }
  };

  // Start checkpoint quiz
  const handleStartCheckpoint = async () => {
    if (!plan) return;
    try {
      setCheckpointLoading(true);
      const data = await startWeeklyCheckpoint(plan.id, learnerId);
      setCheckpointQuestions(data.questions);
      setSelectedAnswers({});
      setCheckpointActive(true);
    } catch (err) {
      console.error('Failed to start checkpoint:', err);
    } finally {
      setCheckpointLoading(false);
    }
  };

  // Select quiz answer
  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Submit checkpoint quiz
  const handleSubmitCheckpoint = async () => {
    if (!plan || submittingCheckpoint) return;

    try {
      setSubmittingCheckpoint(true);
      const result = await submitWeeklyCheckpoint(plan.id, learnerId, selectedAnswers);
      setCheckpointResult(result);
      setCheckpointActive(false);

      // Refresh plan details to reflect completion
      const refreshedPlan = await getCurrentWeeklyPlan(plan.learning_path_id, learnerId);
      setPlan(refreshedPlan);
      setPlanHistory((prev) => prev.map((p) => (p.id === refreshedPlan.id ? refreshedPlan : p)));
    } catch (err) {
      console.error('Failed to submit checkpoint:', err);
    } finally {
      setSubmittingCheckpoint(false);
    }
  };

  // Generate next week's adaptive plan
  const handleGenerateNextWeek = async () => {
    if (!plan || adaptingNextWeek) return;

    try {
      setAdaptingNextWeek(true);
      const nextPlan = await generateNextWeekPlan(plan.id, learnerId);
      setPlan(nextPlan);
      setSelectedWeekId(nextPlan.id);
      setCheckpointResult(null);
      setCheckpointActive(false);

      // Refresh history
      const history = await getWeeklyPlanHistory(plan.learning_path_id, learnerId);
      setPlanHistory(history);
    } catch (err) {
      console.error('Failed to generate next week:', err);
    } finally {
      setAdaptingNextWeek(false);
    }
  };

  // Quick Plan Adjustment
  const handleQuickAdjust = async (type: PlanAdjustmentInput['adjustment_type']) => {
    if (!plan || adjustingPlan) return;

    try {
      setAdjustingPlan(true);
      const adjusted = await adjustWeeklyPlan(plan.id, learnerId, { adjustment_type: type });
      setPlan(adjusted);
      setPlanHistory((prev) => prev.map((p) => (p.id === adjusted.id ? adjusted : p)));
    } catch (err) {
      console.error('Failed to adjust plan:', err);
    } finally {
      setAdjustingPlan(false);
    }
  };

  // Switch between week versions
  const handleSelectWeek = (targetPlan: WeeklyPlanWithItems) => {
    setPlan(targetPlan);
    setSelectedWeekId(targetPlan.id);
    setCheckpointActive(false);
    setCheckpointResult(targetPlan.latest_result || null);
  };

  return (
    <div
      id="weekly-plan-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        id="weekly-plan-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 relative border-b border-slate-700/60 shrink-0">
          <button
            id="close-weekly-plan-btn"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                    {t.weekly_learning_plan}
                  </span>
                  {plan && (
                    <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                      {t.week_number} {plan.week_number} (v{plan.version})
                    </span>
                  )}
                  {plan && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        plan.momentum_status === 'On Track'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                          : plan.momentum_status === 'Steady'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                      }`}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                      {plan.momentum_status}
                    </span>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
                  {plan ? plan.focus_topic : 'Loading Weekly Plan...'}
                </h1>
              </div>
            </div>

            {/* History Selector Dropdown */}
            {planHistory.length > 1 && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <History className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedWeekId || ''}
                  onChange={(e) => {
                    const found = planHistory.find((p) => p.id === parseInt(e.target.value, 10));
                    if (found) handleSelectWeek(found);
                  }}
                  className="bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  {planHistory.map((hist) => (
                    <option key={hist.id} value={hist.id}>
                      Week {hist.week_number} {hist.status === 'ACTIVE' ? '(Current)' : '(Completed)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && (
            <div className="py-16 text-center text-slate-500">
              <RotateCcw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
              <p className="text-sm font-medium">Calibrating weekly schedule and cadre competencies...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && plan && (
            <>
              {/* Adaptive Recalibration Callout Banner (Week 2+ or if adapted) */}
              {plan.adaptation_reason && (
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 flex items-start gap-3 text-amber-900 animate-in fade-in duration-200">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      {t.adaptation_reason}
                    </h4>
                    <p className="text-sm font-medium mt-0.5 text-amber-950 leading-relaxed">
                      {plan.adaptation_reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Why This Matters for Cadre & Assignment */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t.why_this_matters}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed pl-6">
                  {plan.why_this_matters}
                </p>
              </div>

              {/* Schedule & Progress Metrics Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t.completed_mins}
                      </span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {plan.completion_percentage}% done
                      </span>
                    </div>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {plan.completed_minutes} / {plan.total_planned_minutes} mins{' '}
                      <span className="text-xs font-normal text-slate-500">
                        (~{Math.round((plan.completed_minutes / 60) * 10) / 10}h of {Math.round((plan.total_planned_minutes / 60) * 10) / 10}h target)
                      </span>
                    </p>
                  </div>
                </div>

                {/* Schedule details & Adjust trigger */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <p className="text-xs font-medium text-slate-500">Active Schedule Cadence</p>
                    <p className="text-xs font-semibold text-slate-800">
                      {preferences?.minutes_per_session || 30}m/session • {preferences?.preferred_period || 'Evening'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{t.adjust_schedule}</span>
                  </button>
                </div>
              </div>

              {/* Actionable Weekly Schedule Activities */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    {t.weekly_items} ({plan.items.length} sessions planned)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Click checkbox to log completed study
                  </span>
                </div>

                <div className="space-y-3">
                  {plan.items.map((item) => {
                    const isToggling = itemTogglingId === item.id;
                    const activityColors = {
                      LEARN: 'bg-blue-50 text-blue-700 border-blue-200',
                      PRACTICE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
                      REFLECT: 'bg-purple-50 text-purple-700 border-purple-200',
                      CHECK: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    };

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all ${
                          item.is_completed
                            ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleItem(item.id)}
                              disabled={isToggling}
                              className={`mt-0.5 rounded-lg p-0.5 transition-colors focus:outline-none ${
                                item.is_completed
                                  ? 'text-emerald-600 hover:text-emerald-700'
                                  : 'text-slate-300 hover:text-slate-400'
                              }`}
                            >
                              {item.is_completed ? (
                                <CheckCircle2 className="w-6 h-6 fill-emerald-100" />
                              ) : (
                                <Circle className="w-6 h-6" />
                              )}
                            </button>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                  {item.day_of_week}
                                </span>
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                                    activityColors[item.activity_type] || 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {item.activity_type}
                                </span>
                                {item.is_carried_forward && (
                                  <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                                    {t.carried_forward}
                                  </span>
                                )}
                                {item.priority_level === 'REINFORCEMENT' && (
                                  <span className="text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded">
                                    {t.reinforcement}
                                  </span>
                                )}
                                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                  <Clock className="w-3.5 h-3.5" />
                                  {item.estimated_minutes} mins
                                </span>
                              </div>

                              <h4
                                className={`text-sm font-semibold mt-1.5 ${
                                  item.is_completed ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {item.title}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                {item.description}
                              </p>
                              <div className="mt-2 flex items-center gap-3">
                                <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                  Tag: {item.topic_tag}
                                </span>
                                {item.resource_url && (
                                  <a
                                    href={item.resource_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                                  >
                                    <span>Verified Resource</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={() => handleToggleItem(item.id)}
                              disabled={isToggling}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0 ${
                                item.is_completed
                                  ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                              }`}
                            >
                              {item.is_completed ? t.completed : t.mark_completed}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Checkpoint & Progress Coach Assessment */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white border border-indigo-100 rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        Stage 5D Cadre Assessment
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {t.checkpoint_title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.checkpoint_desc}
                      </p>
                    </div>
                  </div>

                  {!checkpointActive && !checkpointResult && (
                    <button
                      type="button"
                      onClick={handleStartCheckpoint}
                      disabled={checkpointLoading}
                      className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto shrink-0 disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{checkpointLoading ? 'Loading Questions...' : t.take_checkpoint}</span>
                    </button>
                  )}
                </div>

                {/* Active Checkpoint Test Mode */}
                {checkpointActive && checkpointQuestions.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-indigo-100 space-y-6">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 Questions • Evaluated Against Cadre Standards</span>
                      <span className="font-semibold text-indigo-700">
                        {Object.keys(selectedAnswers).length} / {checkpointQuestions.length} Answered
                      </span>
                    </div>

                    <div className="space-y-5">
                      {checkpointQuestions.map((q, qIndex) => (
                        <div
                          key={q.id}
                          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex items-start gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {qIndex + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900">
                                {q.question_text}
                              </p>
                              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                                Topic: {q.topic_tag}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 pt-1 pl-8">
                            {q.options.map((opt, optIndex) => {
                              const isSelected = selectedAnswers[q.id] === optIndex;
                              return (
                                <button
                                  key={optIndex}
                                  type="button"
                                  onClick={() => handleSelectAnswer(q.id, optIndex)}
                                  className={`p-3 rounded-lg border text-left text-xs font-medium transition-all ${
                                    isSelected
                                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold ring-1 ring-indigo-500'
                                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="font-bold mr-2 text-slate-400">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setCheckpointActive(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitCheckpoint}
                        disabled={
                          submittingCheckpoint ||
                          Object.keys(selectedAnswers).length < checkpointQuestions.length
                        }
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {submittingCheckpoint ? 'Evaluating...' : t.submit_check}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Checkpoint Completed Results & Adaptive Next Week Generator */}
                {checkpointResult && (
                  <div className="mt-5 pt-5 border-t border-indigo-100 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              {t.checkpoint_result}
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                checkpointResult.score_percentage >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : checkpointResult.score_percentage >= 60
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Rating: {checkpointResult.progress_rating}
                            </span>
                          </div>
                          <p className="text-xl font-bold text-slate-900 mt-1">
                            Score: {checkpointResult.score_percentage}%{' '}
                            <span className="text-sm font-medium text-slate-500">
                              ({checkpointResult.correct_count} / {checkpointResult.total_questions} questions correct)
                            </span>
                          </p>
                        </div>

                        {/* Next Week Adaptive Generation Button */}
                        <button
                          type="button"
                          onClick={handleGenerateNextWeek}
                          disabled={adaptingNextWeek}
                          className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0 self-start sm:self-auto disabled:opacity-50"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{adaptingNextWeek ? 'Adapting Week Plan...' : t.next_week_plan}</span>
                        </button>
                      </div>

                      {/* Subtopic Mastery Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {t.strong_areas}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {checkpointResult.strong_topics.length > 0 ? (
                              checkpointResult.strong_topics.map((top, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-emerald-900 border border-emerald-300"
                                >
                                  {top}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-emerald-700">None evaluated as mastery</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                          <p className="text-xs font-bold uppercase tracking-wide text-amber-800 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            {t.needs_reinforcement}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {checkpointResult.weak_topics.length > 0 ? (
                              checkpointResult.weak_topics.map((top, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-amber-900 border border-amber-300"
                                >
                                  {top}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-amber-700">All topics satisfied benchmark!</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Official Cadre Guidance */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                        <span className="font-bold text-slate-700 uppercase tracking-wide">
                          {t.cadre_guidance}
                        </span>
                        <p className="text-slate-600 leading-relaxed">
                          {checkpointResult.improvement_analysis}
                        </p>
                        <p className="text-indigo-900 font-semibold pt-1">
                          Next Week Recommendation: {checkpointResult.next_week_recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Plan Adjustments Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    {t.adjust_plan}
                  </span>
                  <span className="text-xs text-slate-400">
                    Adapt workload instantly based on real-time constraints
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: 'less_time', label: t.less_time },
                    { id: 'more_time', label: t.more_time },
                    { id: 'need_practice', label: t.need_practice },
                    { id: 'already_know', label: t.already_know },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => handleQuickAdjust(btn.id as any)}
                      disabled={adjustingPlan}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Stage 5D • Grounded in Cadre Frameworks & Continuous Feedback
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Close Plan
          </button>
        </div>
      </div>

      {/* Schedule Availability Configuration Modal */}
      {showScheduleModal && preferences && (
        <WeeklyScheduleModal
          learnerId={learnerId}
          currentPreferences={preferences}
          language={language}
          onClose={() => setShowScheduleModal(false)}
          onSaved={(newPrefs) => {
            setPreferences(newPrefs);
            if (plan) {
              setPlan({
                ...plan,
                schedule_summary: {
                  preferred_days: newPrefs.preferred_days.split(',').map((d) => d.trim()),
                  minutes_per_session: newPrefs.minutes_per_session,
                  weekly_minutes_target: newPrefs.weekly_minutes_target,
                  preferred_period: newPrefs.preferred_period,
                },
              });
            }
          }}
        />
      )}
    </div>
  );
}
