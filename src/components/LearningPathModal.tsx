import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Lock,
  Play,
  RotateCw,
  Compass,
  Building2,
  Clock,
  Target,
  AlertTriangle,
  Award,
  ChevronRight,
  BookOpen,
  ArrowRight,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Zap,
  Calendar,
} from 'lucide-react';
import WeeklyPlanModal from './WeeklyPlanModal.tsx';
import type {
  LearningPathDetail,
  LearningPathStepItem,
  DiscoveredResource,
  SupportedLanguage,
  StepType,
  StepStatus,
} from '../types/index.ts';
import {
  generateLearningPath,
  startLearningPathStep,
  completeLearningPathStep,
  getLearningPathAlternatives,
  switchLearningPathResource,
  getLearningPathQuiz,
} from '../services/api.ts';
import { getLearningPathT } from '../i18n/learningPathTranslations.ts';

interface LearningPathModalProps {
  skillGap: string;
  learnerId: number;
  initialResource?: DiscoveredResource | null;
  pathId?: number | null;
  language?: SupportedLanguage;
  onClose: () => void;
  onOpenQuizModal?: (quizId: number) => void;
}

export default function LearningPathModal({
  skillGap,
  learnerId,
  initialResource,
  pathId,
  language = 'en',
  onClose,
  onOpenQuizModal,
}: LearningPathModalProps) {
  const t = getLearningPathT(language);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<LearningPathDetail | null>(null);

  // Alternative Resources Drawer state
  const [showAlternatives, setShowAlternatives] = useState<boolean>(false);
  const [alternatives, setAlternatives] = useState<DiscoveredResource[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState<boolean>(false);

  // Active action in flight
  const [actionLoadingStepId, setActionLoadingStepId] = useState<number | null>(null);

  // Practice Assessment Quiz state
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [practiceQuiz, setPracticeQuiz] = useState<any | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showWeeklyPlan, setShowWeeklyPlan] = useState<boolean>(false);

  // Fetch or generate learning path on mount
  useEffect(() => {
    let isMounted = true;

    async function loadPath() {
      try {
        setLoading(true);
        setError(null);

        const data = await generateLearningPath(
          learnerId,
          skillGap,
          initialResource || null,
          null,
          75,
          false
        );

        if (isMounted) {
          setPath(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load learning path');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPath();
    return () => {
      isMounted = false;
    };
  }, [learnerId, skillGap, initialResource]);

  // Load alternative resources when requested
  const handleOpenAlternatives = async () => {
    if (!path) return;
    try {
      setShowAlternatives(true);
      setLoadingAlternatives(true);
      const res = await getLearningPathAlternatives(path.id, learnerId);
      setAlternatives(res);
    } catch (err) {
      console.error('Failed to load alternatives:', err);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  // Switch to an alternative verified resource
  const handleSelectAlternative = async (newRes: DiscoveredResource) => {
    if (!path) return;
    try {
      setLoading(true);
      setShowAlternatives(false);
      const updated = await switchLearningPathResource(path.id, learnerId, newRes);
      setPath(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch resource');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step Start
  const handleStartStep = async (stepId: number) => {
    if (!path) return;
    try {
      setActionLoadingStepId(stepId);
      const updated = await startLearningPathStep(path.id, stepId, learnerId);
      setPath(updated);
    } catch (err) {
      console.error('Failed to start step:', err);
    } finally {
      setActionLoadingStepId(null);
    }
  };

  // Handle Step Complete
  const handleCompleteStep = async (stepId: number) => {
    if (!path) return;
    try {
      setActionLoadingStepId(stepId);
      const updated = await completeLearningPathStep(path.id, stepId, learnerId);
      setPath(updated);
    } catch (err) {
      console.error('Failed to complete step:', err);
    } finally {
      setActionLoadingStepId(null);
    }
  };

  // Handle Practice Quiz launch
  const handleLaunchPracticeQuiz = async (step: LearningPathStepItem) => {
    if (!path) return;
    try {
      setQuizLoading(true);
      const quiz = await getLearningPathQuiz(path.id, learnerId);
      if (onOpenQuizModal && quiz.id) {
        onOpenQuizModal(quiz.id);
      } else {
        setPracticeQuiz(quiz);
        setSelectedQuizAnswers({});
        setQuizSubmitted(false);
        setQuizScore(null);
      }
    } catch (err) {
      console.error('Failed to launch practice quiz:', err);
      alert('Could not start practice quiz. Ensure learning documents exist.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitInlineQuiz = () => {
    if (!practiceQuiz || !practiceQuiz.questions) return;
    let correctCount = 0;
    practiceQuiz.questions.forEach((q: any) => {
      if (selectedQuizAnswers[q.id] === q.correct_option_index) {
        correctCount++;
      }
    });
    const percentage = Math.round((correctCount / practiceQuiz.questions.length) * 100);
    setQuizScore(percentage);
    setQuizSubmitted(true);

    // If score >= 60, auto-complete the assessment step!
    if (percentage >= 60 && path) {
      const assessmentStep = path.steps.find((s) => s.step_type === 'Assessment');
      if (assessmentStep && assessmentStep.status !== 'COMPLETED') {
        handleCompleteStep(assessmentStep.id);
      }
    }
  };

  const getStepTypeColor = (type: StepType) => {
    switch (type) {
      case 'Foundation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Concept':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Practical':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Scenario':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Review':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Assessment':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t.completed}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
            <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
            {t.in_progress}
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            {t.locked}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {t.not_started}
          </span>
        );
    }
  };

  // Find active step
  const activeStep = path?.steps.find((s) => s.status === 'IN_PROGRESS') ||
    path?.steps.find((s) => s.status !== 'COMPLETED') || path?.steps[0];

  return (
    <div 
      id="learning-path-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div 
        id="learning-path-modal"
        className="bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {t.learning_path}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {skillGap}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {path ? `${t.step} ${path.active_step_number} ${t.of} ${path.total_steps} ${t.steps}` : 'Personalized Curriculum'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {path && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {path.current_level} ({path.current_score}) → {path.target_level} ({path.target_score})
                </span>
              </span>
            )}

            <button
              id="close-learning-path-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {/* Loading state */}
          {loading && (
            <div className="py-16 text-center space-y-3">
              <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                Sequencing your personalized learning path...
              </p>
              <p className="text-xs text-slate-500">
                Aligning current competency, role requirements, and verified course modules.
              </p>
            </div>
          )}

          {/* Error message */}
          {!loading && error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!loading && path && (
            <>
              {/* 1. Learning Objective & Resource Context Banner */}
              <div 
                id="learning-path-objective-card"
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1 max-w-2xl">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      {t.learning_objective}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {path.learning_goal}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Role: <strong className="text-slate-700">{path.role_name}</strong> · Assignment: <strong className="text-slate-700">{path.assignment_name}</strong>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {path.structure_label}
                    </span>
                    <button
                      id="choose-another-resource-btn"
                      onClick={handleOpenAlternatives}
                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t.choose_another_resource}
                    </button>
                  </div>
                </div>

                {/* Primary Resource Details */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500">{t.primary_resource}:</span>
                    <strong className="text-slate-800 font-semibold">{path.resource_title}</strong>
                    <span className="text-slate-400">({path.provider_name})</span>
                  </div>

                  <a
                    href={path.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    <span>{t.open_resource}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* 2. Progress & Active Step Tracker */}
              <div 
                id="learning-path-progress-tracker"
                className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-xl p-4 sm:p-5 text-white shadow-md space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                      {path.progress_percentage === 100 ? t.path_completed : t.continue_learning}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>{t.step} {path.active_step_number}: {activeStep?.title}</span>
                    </h4>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-blue-200">
                      {path.progress_percentage}%
                    </span>
                    <p className="text-[11px] text-blue-300">
                      {path.completed_steps_count} of {path.total_steps} completed
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-blue-950 overflow-hidden border border-blue-800/50">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${path.progress_percentage}%` }}
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-3 border-t border-blue-800/40">
                  <span className="text-xs text-blue-200">
                    Want an actionable, schedule-calibrated weekly study plan?
                  </span>
                  <button
                    id="open-weekly-plan-from-path-btn"
                    type="button"
                    onClick={() => setShowWeeklyPlan(true)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Weekly Plan & Coach</span>
                  </button>
                </div>
              </div>

              {/* 3. Progressive Steps Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-700" />
                    Structured Step-by-Step Learning Sequence
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Step by step progression
                  </span>
                </div>

                <div className="space-y-3 relative before:absolute before:top-4 before:bottom-4 before:left-5 before:w-0.5 before:bg-slate-200">
                  {path.steps.map((step) => {
                    const isCompleted = step.status === 'COMPLETED';
                    const isInProgress = step.status === 'IN_PROGRESS';
                    const isLocked = step.status === 'LOCKED';

                    return (
                      <div
                        key={step.id}
                        id={`learning-step-${step.step_number}`}
                        className={`relative pl-12 transition-all ${
                          isInProgress
                            ? 'scale-[1.01]'
                            : ''
                        }`}
                      >
                        {/* Timeline Node Icon */}
                        <div
                          className={`absolute left-2.5 top-4 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all z-10 ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isInProgress
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                              : isLocked
                              ? 'bg-slate-200 text-slate-500 border border-slate-300'
                              : 'bg-white text-slate-700 border-2 border-slate-300'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isLocked ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            step.step_number
                          )}
                        </div>

                        {/* Step Card */}
                        <div
                          className={`rounded-xl border p-4 sm:p-5 shadow-2xs space-y-3 ${
                            isInProgress
                              ? 'bg-white border-blue-300 ring-1 ring-blue-200'
                              : isCompleted
                              ? 'bg-white/80 border-emerald-200'
                              : 'bg-white/60 border-slate-200 opacity-80'
                          }`}
                        >
                          {/* Step Header */}
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-500">
                                {t.step} {step.step_number}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getStepTypeColor(
                                  step.step_type
                                )}`}
                              >
                                {step.step_type}
                              </span>
                              {step.section_ref && (
                                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {step.section_ref}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {step.estimated_effort && (
                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {step.estimated_effort}
                                </span>
                              )}
                              {getStatusBadge(step.status)}
                            </div>
                          </div>

                          {/* Step Title & Purpose */}
                          <div>
                            <h5 className="text-sm sm:text-base font-bold text-slate-900">
                              {step.title}
                            </h5>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              <strong className="text-slate-700">{t.why_step_exists}:</strong> {step.purpose}
                            </p>
                          </div>

                          {/* Prerequisite Badge / Warning */}
                          {step.prerequisite && (
                            <div
                              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                                step.prerequisite_met
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                  : 'bg-amber-50 text-amber-900 border-amber-200'
                              }`}
                            >
                              {step.prerequisite_met ? (
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              )}
                              <span className="font-medium leading-tight">
                                <strong>{t.prerequisite}:</strong> {step.prerequisite} (
                                {step.prerequisite_met ? t.prerequisite_met : t.prerequisite_needed})
                              </span>
                            </div>
                          )}

                          {/* Completion Condition */}
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                            <FileCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              <strong>{t.completion_criteria}:</strong> {step.completion_condition}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 flex items-center justify-between gap-2 flex-wrap border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              {step.resource_url && (
                                <a
                                  href={step.resource_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                                >
                                  <span>{t.open_resource}</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Assessment Step Quiz Button */}
                              {step.step_type === 'Assessment' && !isCompleted && !isLocked && (
                                <button
                                  id="take-practice-quiz-btn"
                                  onClick={() => handleLaunchPracticeQuiz(step)}
                                  disabled={quizLoading}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>{t.take_practice_quiz}</span>
                                </button>
                              )}

                              {/* Start Step Button */}
                              {(step.status === 'NOT_STARTED' || (isLocked && false)) && (
                                <button
                                  onClick={() => handleStartStep(step.id)}
                                  disabled={actionLoadingStepId === step.id || isLocked}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Play className="w-3.5 h-3.5 fill-white" />
                                  <span>{t.start_step}</span>
                                </button>
                              )}

                              {/* Complete Step Button */}
                              {isInProgress && (
                                <button
                                  id={`complete-step-${step.step_number}-btn`}
                                  onClick={() => handleCompleteStep(step.id)}
                                  disabled={actionLoadingStepId === step.id}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {actionLoadingStepId === step.id ? (
                                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>{t.mark_as_completed}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Strategic Future Skill Context (Decoupled) */}
              {path.future_skill_note && (
                <div 
                  id="learning-path-future-skill-card"
                  className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-1 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>{t.future_skill_context}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {path.future_skill_note}
                  </p>
                  <p className="text-[11px] text-slate-500 italic pt-1">
                    * Earmarked for long-term career progression and cadre modernization. Focus first on completing your primary {path.target_competency} steps.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Deterministic sequence aligned with national training frameworks
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Alternative Resources Drawer / Modal */}
      {showAlternatives && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                {t.choose_another_resource}
              </h3>
              <button
                onClick={() => setShowAlternatives(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-slate-600">
                Select a verified alternative resource to regenerate your step-by-step learning sequence:
              </p>

              {loadingAlternatives && (
                <div className="py-12 text-center">
                  <RotateCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 mt-2">Loading verified alternatives...</p>
                </div>
              )}

              {!loadingAlternatives && alternatives.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                  No other verified alternative resources found for this competency.
                </div>
              )}

              {!loadingAlternatives && alternatives.length > 0 && (
                <div className="space-y-3">
                  {alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs bg-white space-y-2 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {alt.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {alt.provider_name} · Tier {alt.quality_tier || alt.source_tier} · {alt.language}
                          </p>
                        </div>

                        <button
                          onClick={() => handleSelectAlternative(alt)}
                          className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shrink-0 cursor-pointer shadow-2xs"
                        >
                          {t.select_alternative}
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {alt.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowAlternatives(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Practice Quiz Runner Modal (if onOpenQuizModal not handled) */}
      {practiceQuiz && (
        <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Practice Assessment: {path?.target_competency}
                </h3>
                <p className="text-xs text-slate-400">
                  Grounded AI Quiz · 5 Questions · Pass criteria: 60%
                </p>
              </div>
              <button
                onClick={() => setPracticeQuiz(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {quizSubmitted && quizScore !== null && (
                <div
                  className={`p-4 rounded-xl border text-center space-y-1 ${
                    quizScore >= 60
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  <p className="text-base font-bold">
                    {quizScore >= 60 ? '🎉 Knowledge Check Passed!' : 'Review Recommended'}
                  </p>
                  <p className="text-sm">
                    You scored <strong className="font-black">{quizScore}%</strong>.
                    {quizScore >= 60
                      ? ' Your Practice Assessment step has been marked as Completed.'
                      : ' Minimum passing threshold is 60%. Please review the curriculum and retry.'}
                  </p>
                </div>
              )}

              {practiceQuiz.questions?.map((q: any, idx: number) => {
                const isSelected = (optIdx: number) => selectedQuizAnswers[q.id] === optIdx;
                const isCorrect = (optIdx: number) => q.correct_option_index === optIdx;

                return (
                  <div key={q.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                    <p className="font-bold text-slate-900">
                      Q{idx + 1}. {q.question_text}
                    </p>

                    <div className="space-y-1.5">
                      {q.options?.map((opt: string, optIdx: number) => {
                        let optStyle = 'border-slate-200 hover:bg-slate-100 text-slate-700 bg-white';

                        if (quizSubmitted) {
                          if (isCorrect(optIdx)) {
                            optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                          } else if (isSelected(optIdx) && !isCorrect(optIdx)) {
                            optStyle = 'border-rose-500 bg-rose-50 text-rose-900';
                          }
                        } else if (isSelected(optIdx)) {
                          optStyle = 'border-blue-600 bg-blue-50 text-blue-900 font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() =>
                              setSelectedQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                            }
                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center gap-2 cursor-pointer ${optStyle}`}
                          >
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-bold text-[10px] shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && q.explanation && (
                      <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setPracticeQuiz(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Close
              </button>

              {!quizSubmitted && (
                <button
                  onClick={handleSubmitInlineQuiz}
                  disabled={Object.keys(selectedQuizAnswers).length === 0}
                  className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Submit Assessment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Stage 5D Adaptive Weekly Plan Modal */}
      {showWeeklyPlan && path && (
        <WeeklyPlanModal
          learningPathId={path.id}
          learnerId={learnerId}
          language={language}
          onClose={() => setShowWeeklyPlan(false)}
          onOpenPracticeQuiz={onOpenQuizModal}
        />
      )}
    </div>
  );
}
