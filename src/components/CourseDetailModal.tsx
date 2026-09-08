import { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Award, 
  ArrowRight, 
  Info, 
  Check, 
  AlertTriangle,
  Sparkles,
  Upload,
  FileText,
  AlertCircle
} from 'lucide-react';
import type { RecommendationItem, LearningResource, LearningMaterial, Quiz } from '../types/index.ts';
import { getLearningMaterialForResource, generateQuizFromResource } from '../services/api.ts';
import AIQuizModal from './AIQuizModal.tsx';
import UploadMaterialModal from './UploadMaterialModal.tsx';

interface CourseDetailModalProps {
  item: RecommendationItem | null;
  resourceFallback?: LearningResource | null;
  learnerId?: number;
  onClose: () => void;
  onQuizCompleted?: () => void;
}

export default function CourseDetailModal({
  item,
  resourceFallback,
  learnerId = 1,
  onClose,
  onQuizCompleted,
}: CourseDetailModalProps) {
  const [enrolled, setEnrolled] = useState(false);
  const [linkedMaterial, setLinkedMaterial] = useState<LearningMaterial | null>(null);
  const [loadingMaterial, setLoadingMaterial] = useState(false);

  // AI Quiz Generation State
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);

  const resource = item?.resource || resourceFallback;

  useEffect(() => {
    if (!resource) return;
    setLoadingMaterial(true);
    getLearningMaterialForResource(resource.id)
      .then((material) => {
        setLinkedMaterial(material);
      })
      .catch((err) => {
        console.warn('Could not check linked material:', err);
      })
      .finally(() => {
        setLoadingMaterial(false);
      });
  }, [resource?.id]);

  if (!resource) return null;

  const currentScore = item?.current_competency_score ?? 0;
  const targetScore = item?.target_competency_score ?? 70;
  const gap = Math.max(0, targetScore - currentScore);
  const isIGOT = resource.source === 'iGOT';

  const handleStartLearning = () => {
    setEnrolled(true);
  };

  const handleGenerateAIQuiz = async () => {
    setIsGeneratingQuiz(true);
    setGenerationError(null);

    try {
      const quiz = await generateQuizFromResource(resource.id, questionCount, learnerId);
      setActiveQuiz(quiz);
    } catch (err: any) {
      console.error('Quiz generation failed:', err);
      setGenerationError(err.message || "We couldn't generate the quiz right now. Please try again in a moment.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <>
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

            {/* STAGE 4 — Grounded AI Practice Quiz Card */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-slate-50 border-2 border-indigo-200/80 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        Practice with Grounded AI Quiz
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Stage 4 Intelligence
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Verify your comprehension with questions strictly grounded in official course notes.
                    </p>
                  </div>
                </div>

                {/* Upload Custom Notes Button */}
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  {linkedMaterial ? 'Upload / Replace Document' : 'Upload Learning Material'}
                </button>
              </div>

              {/* Linked Document Metadata */}
              <div className="p-3 bg-white/80 border border-indigo-100 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-700" />
                  <span className="text-slate-600">Material:</span>
                  <strong className="text-slate-900">
                    {loadingMaterial
                      ? 'Checking catalogue notes...'
                      : linkedMaterial
                      ? linkedMaterial.original_filename
                      : `${resource.title} Reference Notes`}
                  </strong>
                  {linkedMaterial && (
                    <span className="px-2 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase">
                      {linkedMaterial.file_type}
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Indexed & Grounded
                </span>
              </div>

              {/* Question Count Selector & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Questions:</span>
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt as 5 | 10 | 15)}
                      className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                        questionCount === cnt
                          ? 'bg-indigo-700 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {cnt} MCQs
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAIQuiz}
                  disabled={isGeneratingQuiz}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {isGeneratingQuiz ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating with Groq...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Practice with AI Quiz
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {generationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}
            </div>

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
                    This course has been bookmarked in your official cadre progression record.
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
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active AI Quiz Modal */}
      {activeQuiz && (
        <AIQuizModal
          quiz={activeQuiz}
          learnerId={learnerId}
          onClose={() => setActiveQuiz(null)}
          onQuizCompleted={(_attempt) => {
            if (onQuizCompleted) onQuizCompleted();
          }}
        />
      )}

      {/* Upload Custom Material Modal */}
      {showUploadModal && (
        <UploadMaterialModal
          learnerId={learnerId}
          learningResourceId={resource.id}
          resourceTitle={resource.title}
          onClose={() => setShowUploadModal(false)}
          onMaterialUploaded={(material) => {
            setLinkedMaterial(material);
          }}
          onQuizGenerated={(quiz) => {
            setActiveQuiz(quiz);
          }}
        />
      )}
    </>
  );
}
