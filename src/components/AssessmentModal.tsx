import { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Award, Sparkles, RefreshCw, Layers, Check, ArrowRight, HelpCircle } from 'lucide-react';
import { getAssessmentQuestions, submitAssessment } from '../services/api.ts';
import type { AssessmentQuestion, AssessmentEvaluation } from '../types/index.ts';

interface AssessmentModalProps {
  isOpen: boolean;
  learnerId: number;
  filterCompetency?: string | null;
  onClose: () => void;
  onAssessmentCompleted: (evaluation: AssessmentEvaluation) => void;
}

export default function AssessmentModal({
  isOpen,
  learnerId,
  filterCompetency,
  onClose,
  onAssessmentCompleted,
}: AssessmentModalProps) {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<AssessmentEvaluation | null>(null);
  const [activeCompetencyFilter, setActiveCompetencyFilter] = useState<string>(filterCompetency || 'All');

  useEffect(() => {
    if (isOpen) {
      loadQuestions(filterCompetency || undefined);
      setEvaluation(null);
      setAnswers({});
      setActiveCompetencyFilter(filterCompetency || 'All');
    }
  }, [isOpen, filterCompetency]);

  const loadQuestions = async (comp?: string) => {
    try {
      setLoading(true);
      const data = await getAssessmentQuestions(comp && comp !== 'All' ? comp : undefined);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load assessment questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFilter = (comp: string) => {
    setActiveCompetencyFilter(comp);
    loadQuestions(comp !== 'All' ? comp : undefined);
    setAnswers({});
    setEvaluation(null);
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (evaluation) return; // locked if already evaluated
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  // Quick Demo Auto-Fill (answers all correctly to demonstrate score surge to 100% and gap resolution)
  const handleAutoFillCorrect = () => {
    const correctMap: Record<number, number> = {};
    questions.forEach((q) => {
      correctMap[q.id] = q.correct_option;
    });
    setAnswers(correctMap);
  };

  // Quick Demo Auto-Fill (mixed answers)
  const handleAutoFillRealistic = () => {
    const mixedMap: Record<number, number> = {};
    questions.forEach((q, idx) => {
      // Intentionally miss some Python or Stats to show partial gap reduction
      mixedMap[q.id] = idx % 3 === 0 ? (q.correct_option + 1) % 4 : q.correct_option;
    });
    setAnswers(mixedMap);
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length === 0) {
      alert('Please answer at least one question before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await submitAssessment(learnerId, answers);
      setEvaluation(result);
      onAssessmentCompleted(result);
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit assessment evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="assessment-modal-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in duration-200"
      >
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
              S2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                  Dynamic Scoring Assessment Engine
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                  Stage 2 Official
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Official Statistical Cadre Competency Evaluation
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Competency Filter Bar & Demo Controls */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-500 font-medium mr-1">Scope:</span>
            {['All', 'Statistics', 'Python', 'Data Analysis', 'Data Visualization'].map((comp) => (
              <button
                key={comp}
                onClick={() => handleSelectFilter(comp)}
                disabled={submitting}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeCompetencyFilter === comp
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {comp}
              </button>
            ))}
          </div>

          {/* Quick Demo Pre-Fill helpers */}
          {!evaluation && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoFillRealistic}
                className="text-[11px] px-2 py-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-medium cursor-pointer"
                title="Populates realistic test responses"
              >
                Auto-Fill Sample
              </button>
              <button
                onClick={handleAutoFillCorrect}
                className="text-[11px] px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                title="Populates all correct answers to show benchmark achievement"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" /> Perfect Score Demo
              </button>
            </div>
          )}
        </div>

        {/* Progress Strip */}
        <div className="w-full bg-slate-200 h-1.5">
          <div
            className="bg-blue-600 h-1.5 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading && (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-sm">Loading cadre assessment questions from PostgreSQL...</p>
            </div>
          )}

          {/* EVALUATION RESULTS VIEW (When Submitted) */}
          {evaluation && (
            <div id="assessment-evaluation-results" className="space-y-5 animate-in fade-in duration-300">
              {/* Dynamic Score Announcement Banner */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-emerald-300" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                        Dynamic Scoring Engine • PostgreSQL Updated
                      </span>
                      <h3 className="text-lg font-black">
                        Assessment Evaluated: {evaluation.overall_assessment_percentage}% Overall
                      </h3>
                      <p className="text-xs text-blue-100 mt-0.5">
                        {evaluation.correct_count} of {evaluation.total_questions} questions correct. Competencies and gap metrics have been dynamically updated in the database.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-md border border-white/20 text-center sm:text-right">
                    <span className="text-[10px] text-blue-200 block uppercase font-semibold">New Learner Score</span>
                    <span className="text-2xl font-black text-amber-300">
                      {evaluation.updated_gap_report.overall_score}%
                    </span>
                  </div>
                </div>

                {/* Score breakdown per competency */}
                <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(evaluation.competency_results).map(([compName, res]: [string, { total: number; correct: number; score: number }]) => (
                    <div key={compName} className="bg-white/10 p-2 rounded">
                      <div className="text-[11px] text-blue-200 truncate">{compName}</div>
                      <div className="font-bold text-sm text-white">
                        {res.score}% <span className="text-[10px] text-blue-300 font-normal">({res.correct}/{res.total})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question-by-Question Review with Explanations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  Official Cadre Technical Explanations & Concept Tags
                </h4>

                <div className="space-y-3">
                  {evaluation.question_breakdown.map((q, idx) => (
                    <div
                      key={q.question_id}
                      className={`p-4 rounded-lg border text-xs leading-relaxed ${
                        q.is_correct
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">Q{idx + 1}.</span>
                          <span className="font-semibold px-2 py-0.5 rounded text-[10px] bg-slate-200/80 text-slate-800">
                            {q.competency}
                          </span>
                          <span className="text-[10px] font-medium text-blue-700">
                            Tag: {q.concept_tag}
                          </span>
                        </div>
                        {q.is_correct ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Incorrect
                          </span>
                        )}
                      </div>

                      <p className="font-medium text-slate-900 mt-2 text-sm">
                        {q.question_text}
                      </p>

                      <div className="mt-2 text-slate-600 space-y-1">
                        <div>
                          <span className="font-semibold text-slate-700">Official Rationale: </span>
                          {q.explanation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* QUESTIONS LIST (Active Taking Mode) */}
          {!loading && !evaluation && (
            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div
                  key={q.id}
                  id={`question-card-${q.id}`}
                  className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                        {qIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-blue-900 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded">
                        {q.competency_name}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {q.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-500">Difficulty:</span>
                      <span className="font-semibold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded">
                        {q.difficulty}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 mt-2 leading-relaxed">
                    {q.question_text}
                  </p>

                  {/* Options */}
                  <div className="mt-3.5 space-y-2">
                    {q.options.map((optText, optIndex) => {
                      const isSelected = answers[q.id] === optIndex;
                      const letter = String.fromCharCode(65 + optIndex);

                      return (
                        <button
                          type="button"
                          key={optIndex}
                          onClick={() => handleSelectOption(q.id, optIndex)}
                          className={`w-full text-left p-3 rounded-md border text-xs sm:text-sm flex items-start gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-medium shadow-xs ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-blue-700 text-white'
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1">{optText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Action Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {!evaluation ? (
              <span className="text-xs text-slate-600 font-medium">
                {answeredCount} of {questions.length} questions answered
              </span>
            ) : (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Database Sync Complete
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {evaluation ? (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Apply to Dashboard & Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="submit-assessment-btn"
                  onClick={handleSubmit}
                  disabled={submitting || answeredCount === 0}
                  className="px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Evaluating & Updating DB...
                    </>
                  ) : (
                    <>
                      Submit Assessment & Re-Score <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
