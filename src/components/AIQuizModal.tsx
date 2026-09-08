import { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Flag,
  FileText,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import type { Quiz, QuizAttempt, QuizAnswerDetail } from '../types/index.ts';
import { submitQuizAttempt, updateQuizReview } from '../services/api.ts';

interface AIQuizModalProps {
  quiz: Quiz;
  learnerId: number;
  onClose: () => void;
  onQuizCompleted?: (attempt: QuizAttempt) => void;
}

export default function AIQuizModal({
  quiz,
  learnerId,
  onClose,
  onQuizCompleted,
}: AIQuizModalProps) {
  const questions = quiz.questions || [];
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state
  const [resultAttempt, setResultAttempt] = useState<QuizAttempt | null>(null);
  const [answerDetails, setAnswerDetails] = useState<QuizAnswerDetail[]>([]);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'needs_review' | 'rejected'>(
    quiz.review_status || 'approved'
  );
  const [flagSuccess, setFlagSuccess] = useState(false);

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (optionIndex: number) => {
    if (resultAttempt) return; // Locked once evaluated
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${totalQuestions} questions. Do you want to submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await submitQuizAttempt(quiz.id, learnerId, selectedAnswers);
      setResultAttempt(response.attempt);
      setAnswerDetails(response.answers);
      if (onQuizCompleted) {
        onQuizCompleted(response.attempt);
      }
    } catch (err: any) {
      console.error('Failed to submit quiz:', err);
      setErrorMsg(err.message || 'Failed to evaluate quiz submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setResultAttempt(null);
    setAnswerDetails([]);
    setCurrentIndex(0);
    setErrorMsg(null);
  };

  const handleFlagReview = async () => {
    const nextStatus = reviewStatus === 'needs_review' ? 'approved' : 'needs_review';
    try {
      await updateQuizReview(quiz.id, nextStatus);
      setReviewStatus(nextStatus);
      setFlagSuccess(true);
      setTimeout(() => setFlagSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to flag quiz:', err);
    }
  };

  return (
    <div
      id="ai-quiz-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Grounded AI Practice Quiz
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  Competency: {quiz.competency_name}
                </span>
                {quiz.material && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600 truncate max-w-[200px]">
                    Source: {quiz.material.original_filename}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {quiz.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Close quiz"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ACTIVE QUIZ SESSION */}
          {!resultAttempt ? (
            <div className="space-y-6">
              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Question {currentIndex + 1} of {totalQuestions}</span>
                  <span>{answeredCount} of {totalQuestions} Answered</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              {currentQ && (
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      currentQ.difficulty === 'Easy'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentQ.difficulty === 'Hard'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {currentQ.difficulty} Difficulty
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Official Curriculum Benchmark
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                    {currentQ.question_text}
                  </h3>

                  {/* Options */}
                  <div className="space-y-2.5 pt-2">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQ.id] === optIdx;
                      const optionLetter = String.fromCharCode(65 + optIdx);

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full text-left p-3.5 rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 border-blue-600 text-blue-950 ring-1 ring-blue-600 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/80'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}>
                            {optionLetter}
                          </span>
                          <span className="leading-relaxed pt-0.5">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {!isLastQuestion ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Evaluating Submission...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Submit & Evaluate Quiz
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* RESULTS & GROUNDED REVIEW STATE */
            <div className="space-y-6">
              {/* Score Header Card */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Practice Assessment Completed
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Score: {resultAttempt.correct_count} / {resultAttempt.total_questions} ({resultAttempt.score_percentage}%)
                    </h3>
                    <p className="text-xs text-slate-300 max-w-lg leading-relaxed pt-1">
                      {resultAttempt.feedback}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/10 min-w-[130px]">
                    <span className="text-3xl font-black text-amber-300">
                      {resultAttempt.score_percentage}%
                    </span>
                    <span className="text-xs text-white/80 font-medium mt-0.5">
                      Target: 70%
                    </span>
                  </div>
                </div>

                {/* Transparency Safeguard Callout */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-start gap-2 text-xs text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cadre Diagnostic Safeguard:</strong> This result is securely recorded as formative learning evidence for <em>{resultAttempt.competency}</em>. Your official Stage 2 diagnostic baseline remains intact.
                  </span>
                </div>
              </div>

              {/* Action Buttons for Quiz Result */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFlagReview}
                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      reviewStatus === 'needs_review'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {reviewStatus === 'needs_review' ? 'Flagged for Review' : 'Flag for Quality Review'}
                  </button>
                  {flagSuccess && (
                    <span className="text-xs text-emerald-700 font-medium">Status updated!</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRetake}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retake Quiz
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              </div>

              {/* Question-by-Question Review with Grounded Explanations & Source Citations */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Detailed Grounded Question Review ({answerDetails.length} Questions)
                </h4>

                {answerDetails.map((item, idx) => {
                  const isCorrect = item.is_correct;

                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl p-4 space-y-3 transition-colors ${
                        isCorrect
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-rose-50/30 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                            Q{idx + 1}
                          </span>
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              Incorrect
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {item.question_text}
                      </p>

                      {/* Options breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {item.options.map((opt, optIdx) => {
                          const isOptionCorrect = optIdx === item.correct_option;
                          const wasSelected = optIdx === item.selected_option;

                          let badgeStyle = 'bg-white border-slate-200 text-slate-700';
                          if (isOptionCorrect) {
                            badgeStyle = 'bg-emerald-100/90 border-emerald-300 text-emerald-950 font-semibold';
                          } else if (wasSelected && !isOptionCorrect) {
                            badgeStyle = 'bg-rose-100/90 border-rose-300 text-rose-950 line-through';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg border flex items-start gap-2 ${badgeStyle}`}
                            >
                              <span className="font-bold shrink-0">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className="leading-snug">{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs text-slate-700">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          Grounded Explanation:
                        </p>
                        <p className="leading-relaxed pl-5">{item.explanation}</p>

                        {/* Source Reference Citation */}
                        {item.source_reference && (
                          <div className="mt-2 pt-2 border-t border-slate-100 pl-5 text-xs text-slate-500 flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-slate-700">Source Reference:</span>{' '}
                              {item.source_reference.section && `${item.source_reference.section} `}
                              {item.source_reference.page && `(Page/Slide ${item.source_reference.page})`}
                              {item.source_reference.excerpt && (
                                <p className="italic text-slate-600 mt-0.5">
                                  "{item.source_reference.excerpt}"
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>AI Quiz Generation Engine • Official Statistical Standards</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
