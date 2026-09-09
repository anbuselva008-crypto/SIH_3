import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, Layers, CheckCircle, Zap, ShieldCheck } from 'lucide-react';
import Header from './components/Header.tsx';
import LearnerProfileCard from './components/LearnerProfileCard.tsx';
import CompetencyCard from './components/CompetencyCard.tsx';
import CompetencyModal from './components/CompetencyModal.tsx';
import SkillGapAnalysisCard from './components/SkillGapAnalysisCard.tsx';
import AssessmentModal from './components/AssessmentModal.tsx';
import NextLearningStepCard from './components/NextLearningStepCard.tsx';
import RecommendationsSection from './components/RecommendationsSection.tsx';
import CourseDetailModal from './components/CourseDetailModal.tsx';
import LearningDiscoveryModal from './components/LearningDiscoveryModal.tsx';
import AIQuizModal from './components/AIQuizModal.tsx';
import UploadMaterialModal from './components/UploadMaterialModal.tsx';
import ApiStatusBadge from './components/ApiStatusBadge.tsx';
import LoginView from './components/LoginView.tsx';
import ProfileSetupView from './components/ProfileSetupView.tsx';
import { useLanguage } from './i18n/LanguageContext.tsx';
import { 
  getLearner, 
  getCompetencies, 
  getSkillGapReport, 
  getRecommendations, 
  getLearningResources, 
  resetBaseline 
} from './services/api.ts';
import type { 
  LearnerProfile, 
  CompetencyItem, 
  SkillGapReport, 
  AssessmentEvaluation,
  RecommendationResponse,
  RecommendationItem,
  LearningResource,
  Quiz,
  SupportedLanguage,
  DiscoveredResource
} from './types/index.ts';

export default function App() {
  const { t, setLanguage, language } = useLanguage();
  const [learner, setLearner] = useState<LearnerProfile | null>(null);
  const [competencies, setCompetencies] = useState<CompetencyItem[]>([]);
  const [skillGapReport, setSkillGapReport] = useState<SkillGapReport | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [allCatalogue, setAllCatalogue] = useState<LearningResource[]>([]);
  
  const [selectedCompetency, setSelectedCompetency] = useState<CompetencyItem | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationItem | null>(null);
  const [selectedResourceFallback, setSelectedResourceFallback] = useState<LearningResource | null>(null);
  const [selectedDiscoveredResource, setSelectedDiscoveredResource] = useState<DiscoveredResource | null>(null);
  
  const [isAssessmentOpen, setIsAssessmentOpen] = useState<boolean>(false);
  const [assessmentFilter, setAssessmentFilter] = useState<string | null>(null);

  // Stage 4 Upload & AI Quiz State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [activeDirectQuiz, setActiveDirectQuiz] = useState<Quiz | null>(null);

  // Stage 5A Intelligent Discovery State
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState<boolean>(false);
  const [discoverySkill, setDiscoverySkill] = useState<string | null>(null);

  const [initialChecking, setInitialChecking] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Check if an existing session is present in localStorage on startup
  useEffect(() => {
    const savedId = localStorage.getItem('auth_learner_id');
    if (savedId) {
      const learnerId = parseInt(savedId, 10);
      if (!isNaN(learnerId)) {
        getLearner(learnerId)
          .then((profile) => {
            setLearner(profile);
            if (profile.language_preference) {
              setLanguage(profile.language_preference as SupportedLanguage);
            }
            if (profile.profile_completed) {
              loadDashboardData(profile.id);
            }
          })
          .catch((err) => {
            console.warn('Could not restore previous session:', err);
            localStorage.removeItem('auth_learner_id');
          })
          .finally(() => {
            setInitialChecking(false);
          });
        return;
      }
    }
    // No prior session: do NOT load Arun Kumar automatically
    setInitialChecking(false);
  }, []);

  const loadDashboardData = async (learnerId: number) => {
    try {
      setLoading(true);
      setError(null);
      const [learnerData, competenciesData, gapData, recsData, catalogueData] = await Promise.all([
        getLearner(learnerId),
        getCompetencies(learnerId),
        getSkillGapReport(learnerId),
        getRecommendations(learnerId),
        getLearningResources(),
      ]);
      setLearner(learnerData);
      setCompetencies(competenciesData);
      setSkillGapReport(gapData);
      setRecommendations(recsData);
      setAllCatalogue(catalogueData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to backend REST API');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (authenticatedLearner: LearnerProfile, isNewUser?: boolean) => {
    localStorage.setItem('auth_learner_id', String(authenticatedLearner.id));
    setLearner(authenticatedLearner);

    if (authenticatedLearner.profile_completed) {
      loadDashboardData(authenticatedLearner.id);
      if (authenticatedLearner.is_demo) {
        setNotification('Signed in with Synthetic Demo Account (Arun Kumar, Statistical Officer).');
      } else {
        setNotification(`Welcome back, ${authenticatedLearner.name}. Cadre Dashboard loaded.`);
      }
      setTimeout(() => setNotification(null), 5000);
    } else {
      // First time user: will render ProfileSetupView
      setNotification('Welcome to NSSTA Cadre Portal. Please complete your service background.');
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const handleProfileComplete = (updatedProfile: LearnerProfile) => {
    setLearner(updatedProfile);
    loadDashboardData(updatedProfile.id);
    
    // Per requirement: Profile Setup -> Save -> profile_completed = true -> Competency Assessment
    setNotification(
      `Profile saved! Welcome Officer ${updatedProfile.name}. Initiating diagnostic competency assessment...`
    );
    setTimeout(() => {
      setIsAssessmentOpen(true);
    }, 400);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_learner_id');
    setLearner(null);
    setCompetencies([]);
    setSkillGapReport(null);
    setRecommendations(null);
    setAllCatalogue([]);
    setSelectedRecommendation(null);
    setSelectedResourceFallback(null);
    setError(null);
    setNotification('Successfully signed out of officer portal.');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAssessment = (competencyName?: string) => {
    setAssessmentFilter(competencyName || null);
    setIsAssessmentOpen(true);
  };

  const handleAssessmentCompleted = (evaluation: AssessmentEvaluation) => {
    if (!learner) return;
    // Dynamically update dashboard state with new database values
    setSkillGapReport(evaluation.updated_gap_report);
    // Reload learner, competencies, and recommendations to synchronize UI with PostgreSQL
    getLearner(learner.id).then(setLearner).catch(console.error);
    getCompetencies(learner.id).then(setCompetencies).catch(console.error);
    getRecommendations(learner.id, true).then(setRecommendations).catch(console.error);

    setNotification(
      `Assessment evaluated (${evaluation.overall_assessment_percentage}%). Competency scores & personalized recommendations dynamically updated in database.`
    );
    setTimeout(() => setNotification(null), 6000);
  };

  const handleResetBaseline = async () => {
    if (!learner || !learner.is_demo) return;
    try {
      setResetting(true);
      const result = await resetBaseline();
      setLearner(result.learner);
      setCompetencies(result.competencies);
      setSkillGapReport(result.gapReport);
      const recs = await getRecommendations(result.learner.id, true);
      setRecommendations(recs);
      setNotification('Demo baseline reset: Stats 75%, Python 40%, Data Analysis 55%, Data Viz 80%. Recommendations re-evaluated.');
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Failed to reset baseline:', err);
      alert('Failed to reset baseline.');
    } finally {
      setResetting(false);
    }
  };

  const handleRegenerateRecommendations = async () => {
    if (!learner) return;
    try {
      const recs = await getRecommendations(learner.id, true);
      setRecommendations(recs);
      setNotification('Personalized learning recommendations refreshed based on latest cadre scores.');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to refresh recommendations:', err);
    }
  };

  const handleOpenDiscovery = (skillName?: string) => {
    if (skillName) {
      setDiscoverySkill(skillName);
    } else if (skillGapReport?.priority_areas?.[0]) {
      setDiscoverySkill(skillGapReport.priority_areas[0].name);
    } else if (recommendations?.next_step?.resource?.competency) {
      setDiscoverySkill(recommendations.next_step.resource.competency);
    } else if (competencies?.[0]) {
      setDiscoverySkill(competencies[0].name);
    } else {
      setDiscoverySkill('Contract Management');
    }
    setIsDiscoveryOpen(true);
  };

  // Initial session restoration state
  if (initialChecking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Connecting to Official Statistical System...</p>
        </div>
      </div>
    );
  }

  // 1. If not authenticated, render Login / Register screen
  if (!learner) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If authenticated but profile NOT completed, render Profile Setup screen
  if (!learner.profile_completed) {
    return (
      <ProfileSetupView
        learner={learner}
        onProfileComplete={handleProfileComplete}
        onLogout={handleLogout}
      />
    );
  }

  // 3. If authenticated and profile completed, render the Dashboard
  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-sans">
      <Header 
        learner={learner}
        onLogout={handleLogout}
        onResetBaseline={learner.is_demo ? handleResetBaseline : undefined} 
        onOpenUpload={() => setIsUploadModalOpen(true)}
        resetting={resetting} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Backend & Database Connection Status Banner */}
        <ApiStatusBadge />

        {/* Dynamic Notification Toast / Banner */}
        {notification && (
          <div
            id="dynamic-scoring-notification"
            className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs px-2 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div
            id="error-state-banner"
            className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Failed to retrieve data from Backend API</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              id="retry-fetch-btn"
              onClick={() => learner && loadDashboardData(learner.id)}
              className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-5 h-44 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-2 bg-slate-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Loaded */}
        {!loading && (
          <>
            {/* 1. PROFILE */}
            <LearnerProfileCard learner={learner} />

            {/* 2. YOUR SKILLS (Competency Assessment Records) */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-700" />
                    <h2 className="text-base font-bold text-slate-900">
                      Your Skills (Competency Records)
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official Statistical Cadre Baseline & Assessed Scores (PostgreSQL Synchronized)
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleOpenAssessment()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    {t('start_assessment')}
                  </button>

                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{competencies.length} Competencies Measured</span>
                  </div>
                </div>
              </div>

              {/* Competencies Grid */}
              <div
                id="competencies-grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {competencies.map((comp) => (
                  <CompetencyCard
                    key={comp.id}
                    competency={comp}
                    onView={(c) => setSelectedCompetency(c)}
                    onAssess={(name) => handleOpenAssessment(name)}
                  />
                ))}
              </div>
            </div>

            {/* 3. YOUR SKILL GAPS (Skill Gap Analysis & Priority Areas Module) */}
            <SkillGapAnalysisCard
              report={skillGapReport}
              loading={loading}
              onStartAssessment={handleOpenAssessment}
              onFindResources={(skillName) => handleOpenDiscovery(skillName)}
            />

            {/* 4. YOUR NEXT LEARNING STEP */}
            <NextLearningStepCard
              item={recommendations?.next_step || null}
              onViewDetails={(item) => {
                setSelectedRecommendation(item);
                setSelectedResourceFallback(null);
              }}
              onPracticeQuiz={(item) => {
                setSelectedRecommendation(item);
                setSelectedResourceFallback(null);
              }}
              onDiscoverResources={(skillName) => handleOpenDiscovery(skillName)}
            />

            {/* 5. OTHER RECOMMENDATIONS & COURSE CATALOGUE */}
            <RecommendationsSection
              recommendations={recommendations}
              allCatalogue={allCatalogue}
              loading={loading}
              onViewDetails={(item) => {
                setSelectedRecommendation(item);
                setSelectedResourceFallback(null);
              }}
              onViewResource={(res) => {
                setSelectedResourceFallback(res);
                setSelectedRecommendation(null);
              }}
              onRegenerate={handleRegenerateRecommendations}
              onOpenDiscovery={(skillName) => handleOpenDiscovery(skillName)}
            />
          </>
        )}
      </main>

      {/* Competency Detail Modal */}
      <CompetencyModal
        competency={selectedCompetency}
        learner={learner}
        onClose={() => setSelectedCompetency(null)}
      />

      {/* Stage 5A Intelligent Learning Resource Discovery Modal */}
      {isDiscoveryOpen && learner && (
        <LearningDiscoveryModal
          skillGap={discoverySkill || 'Survey Methodology'}
          learnerId={learner.id}
          language={language}
          onClose={() => {
            setIsDiscoveryOpen(false);
            setDiscoverySkill(null);
          }}
          onViewResourceDetails={(resItem) => {
            const matchedCatalogue = allCatalogue.find(
              (c) => c.title.toLowerCase() === resItem.title.toLowerCase() ||
                     (resItem.metadata_json?.catalogue_id && c.id === resItem.metadata_json.catalogue_id)
            );
            if (matchedCatalogue) {
              setSelectedResourceFallback(matchedCatalogue);
              setSelectedRecommendation(null);
              setSelectedDiscoveredResource(null);
            } else {
              setSelectedDiscoveredResource(resItem);
              setSelectedResourceFallback(null);
              setSelectedRecommendation(null);
            }
          }}
        />
      )}

      {/* Stage 2 Assessment & Dynamic Scoring Modal */}
      <AssessmentModal
        isOpen={isAssessmentOpen}
        learnerId={learner.id}
        filterCompetency={assessmentFilter}
        onClose={() => setIsAssessmentOpen(false)}
        onAssessmentCompleted={handleAssessmentCompleted}
      />

      {/* Stage 3 & 4 Course Details & AI Quiz Modal + Stage 5A Discovered Resources */}
      <CourseDetailModal
        item={selectedRecommendation}
        resourceFallback={selectedResourceFallback}
        discoveredResource={selectedDiscoveredResource}
        learnerId={learner.id}
        onClose={() => {
          setSelectedRecommendation(null);
          setSelectedResourceFallback(null);
          setSelectedDiscoveredResource(null);
        }}
        onQuizCompleted={() => {
          setNotification('Grounded Practice Quiz attempt recorded. Baseline diagnostic scores remain protected.');
          setTimeout(() => setNotification(null), 6000);
        }}
      />

      {/* Stage 4 Standalone Document Upload Modal */}
      {isUploadModalOpen && (
        <UploadMaterialModal
          learnerId={learner.id}
          onClose={() => setIsUploadModalOpen(false)}
          onMaterialUploaded={(mat) => {
            setNotification(`Document "${mat.original_filename}" processed & indexed for AI Quiz generation.`);
            setTimeout(() => setNotification(null), 6000);
          }}
          onQuizGenerated={(quiz) => {
            setActiveDirectQuiz(quiz);
          }}
        />
      )}

      {/* Stage 4 Active Direct AI Quiz Session */}
      {activeDirectQuiz && (
        <AIQuizModal
          quiz={activeDirectQuiz}
          learnerId={learner.id}
          onClose={() => setActiveDirectQuiz(null)}
          onQuizCompleted={() => {
            setNotification('AI Practice Quiz assessment evaluated. Diagnostic baseline records preserved.');
            setTimeout(() => setNotification(null), 6000);
          }}
        />
      )}

      {/* Enterprise Government Style Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Smart India Hackathon (SIH 2026) Prototype • Stage 1.5 Onboarding & Stage 2 Dynamic Scoring Engine
          </div>
          <div>
            Ministry of Statistics and Programme Implementation (MoSPI) • Govt. of India
          </div>
        </div>
      </footer>
    </div>
  );
}


