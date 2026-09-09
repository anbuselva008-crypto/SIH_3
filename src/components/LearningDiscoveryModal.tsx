import { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  Building2, 
  ShieldCheck, 
  Clock, 
  Globe, 
  Info, 
  RotateCw,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Check,
  TrendingUp,
  SlidersHorizontal,
  TableProperties,
  AlertTriangle
} from 'lucide-react';
import type { DiscoveredResource, DiscoveryResponse, SupportedLanguage, VerificationStatus } from '../types/index.ts';
import { fetchLearningDiscovery } from '../services/api.ts';
import { getDiscoveryT } from '../i18n/discoveryTranslations.ts';
import { getLearningPathT } from '../i18n/learningPathTranslations.ts';

interface LearningDiscoveryModalProps {
  skillGap: string;
  learnerId: number;
  language?: SupportedLanguage;
  onClose: () => void;
  onViewResourceDetails?: (resource: DiscoveredResource) => void;
  onSelectSkillGap?: (newSkill: string) => void;
  onBuildLearningPath?: (resource: DiscoveredResource) => void;
}

export default function LearningDiscoveryModal({
  skillGap,
  learnerId,
  language = 'en',
  onClose,
  onViewResourceDetails,
  onSelectSkillGap,
  onBuildLearningPath,
}: LearningDiscoveryModalProps) {
  const t = getDiscoveryT(language);
  const tPath = getLearningPathT(language);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showComparison, setShowComparison] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDiscovery = async (forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetchLearningDiscovery(learnerId, skillGap, forceRefresh);
      setData(res);
    } catch (err: any) {
      console.error('Learning discovery error:', err);
      setError(err.message || 'Could not discover learning resources right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDiscovery(false);
  }, [skillGap, learnerId]);

  const bestMatch = data?.best_match;
  const strongAlternatives = data?.strong_alternatives || [];
  const otherOptions = data?.other_options || [];
  const remainingResources = (data?.all_resources || []).slice(5);
  const comparisonTable = data?.comparison_table || [];
  const futureSkills = data?.future_skills_context || [];

  const renderVerificationBadge = (status?: string | VerificationStatus) => {
    const s = String(status || '').toUpperCase();
    if (s === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          VERIFIED SOURCE
        </span>
      );
    }
    if (s === 'PARTIALLY_VERIFIED' || s === 'INSTITUTIONAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Building2 className="w-3 h-3 text-blue-600" />
          ACCREDITED ACADEMIC
        </span>
      );
    }
    if (s === 'BROKEN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          LINK INACCESSIBLE
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-300 line-through">
          DISQUALIFIED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        <AlertCircle className="w-3 h-3 text-slate-400" />
        UNVERIFIED
      </span>
    );
  };

  const renderResourceTypeBadge = (type?: string) => {
    if (!type) return null;
    const tClean = type.toUpperCase().replace('_', ' ');
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wide">
        {tClean}
      </span>
    );
  };

  const renderSourceTypeBadge = (sourceType: string) => {
    if (sourceType === 'web_discovered') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
          <Globe className="w-3 h-3 text-cyan-600" />
          {t.web_resource}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Layers className="w-3 h-3 text-amber-600" />
        {t.prototype_catalogue}
      </span>
    );
  };

  return (
    <div
      id="learning-discovery-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                Stage 5B Verified Selection
              </span>
              {data && (
                <span className="text-xs text-blue-200">
                  Role: <strong className="text-white">{data.learner_context.role}</strong>
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              🎯 {t.learn_gap_prefix} {skillGap}
            </h2>

            <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
              {data ? (
                <>
                  Quality-evaluated and verified for your assignment{' '}
                  <span className="text-amber-300 font-semibold">({data.learner_context.assignment})</span>
                  {' '}and cadre requirements.
                </>
              ) : (
                t.discovery_subtitle
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => loadDiscovery(true)}
              disabled={loading || refreshing}
              title={t.refresh_discovery}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

          {/* Fallback Notice Banner */}
          {data?.status === 'fallback' && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-950">Prototype Catalogue Fallback Mode</p>
                <p className="text-amber-800 leading-relaxed">
                  {t.search_unavailable_fallback}
                </p>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-4 py-8 animate-pulse text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-700">
                <Compass className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Verifying sources and selecting best match...</p>
              <div className="h-44 bg-white border border-slate-200 rounded-xl max-w-xl mx-auto"></div>
              <div className="h-28 bg-white border border-slate-200 rounded-xl max-w-xl mx-auto"></div>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Discovery Results */}
          {!loading && data && (
            <>
              {/* 1. Best Match Card */}
              {bestMatch ? (
                <div 
                  id="discovery-best-match-card"
                  className="bg-white rounded-xl border-2 border-amber-400 shadow-md p-5 relative overflow-hidden space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 uppercase tracking-wider shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        ⭐ BEST MATCH ({bestMatch.ranking_score}/100)
                      </span>
                      {renderSourceTypeBadge(bestMatch.source_type)}
                      {renderVerificationBadge(bestMatch.verification_status)}
                      {renderResourceTypeBadge(bestMatch.resource_type)}
                    </div>

                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      Tier {bestMatch.quality_tier || bestMatch.source_tier}: {bestMatch.provider_name}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-950 leading-snug">
                      {bestMatch.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {bestMatch.description}
                    </p>
                  </div>

                  {/* Why this was selected as Best Match */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-blue-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-700" />
                        Why This Is Selected as Your Best Match:
                      </p>
                      {bestMatch.stage5b_breakdown && (
                        <span className="text-[11px] font-mono text-blue-900 font-bold">
                          Fit Score: {bestMatch.stage5b_breakdown.totalScore}/100
                        </span>
                      )}
                    </div>

                    <p className="text-blue-900 leading-relaxed font-medium">
                      {bestMatch.selection_reason || bestMatch.match_reason}
                    </p>

                    {/* Structured Reason Bullets */}
                    {bestMatch.structured_reasons && bestMatch.structured_reasons.length > 0 && (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {bestMatch.structured_reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-[11px] text-blue-900 font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Prerequisite or duplicate notice */}
                    {bestMatch.prerequisite_warning && (
                      <div className="mt-2 p-2 rounded bg-amber-100/80 border border-amber-300 text-amber-900 text-[11px] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{bestMatch.prerequisite_warning}</span>
                      </div>
                    )}
                  </div>

                  {/* Stage 5B Score Dimension Breakdown Chips */}
                  {bestMatch.stage5b_breakdown && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Competency</p>
                        <p className="text-xs font-black text-slate-800">{bestMatch.stage5b_breakdown.competencyMatch}/25</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Assignment</p>
                        <p className="text-xs font-black text-slate-800">{bestMatch.stage5b_breakdown.assignmentMatch}/20</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Cadre Role</p>
                        <p className="text-xs font-black text-slate-800">{bestMatch.stage5b_breakdown.roleMatch}/15</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Source Trust</p>
                        <p className="text-xs font-black text-slate-800">{bestMatch.stage5b_breakdown.sourceAuthority}/15</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Level / Lang</p>
                        <p className="text-xs font-black text-slate-800">
                          {bestMatch.stage5b_breakdown.levelFit + bestMatch.stage5b_breakdown.languageFit}/10
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Provider & Action Strip */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{t.source}: <strong className="text-slate-800">{bestMatch.provider_name}</strong></span>
                      {bestMatch.estimated_duration && (
                        <span className="text-slate-400">· {bestMatch.estimated_duration}</span>
                      )}
                      {bestMatch.language && (
                        <span className="text-slate-500 font-medium">· {bestMatch.language}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {onBuildLearningPath && (
                        <button
                          id="build-learning-path-btn"
                          onClick={() => onBuildLearningPath(bestMatch)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>{tPath.build_learning_path}</span>
                        </button>
                      )}

                      {onViewResourceDetails && (
                        <button
                          onClick={() => onViewResourceDetails(bestMatch)}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          {t.view_details}
                        </button>
                      )}

                      <a
                        href={bestMatch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <span>{t.open_course}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                  {t.no_discovery_results}
                </div>
              )}

              {/* 2. Strong Alternatives */}
              {strongAlternatives.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-700" />
                      Strong Alternatives ({strongAlternatives.length})
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      High-authority verified options
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {strongAlternatives.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {renderVerificationBadge(item.verification_status)}
                              {renderResourceTypeBadge(item.resource_type)}
                            </div>
                            <span className="text-xs font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {item.ranking_score}/100
                            </span>
                          </div>

                          <h5 className="font-bold text-sm text-slate-900 leading-snug">
                            {item.title}
                          </h5>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          <p className="text-[11px] text-blue-800 font-medium">
                            {item.selection_reason || item.match_reason}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                            {item.provider_name}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {onBuildLearningPath && (
                              <button
                                onClick={() => onBuildLearningPath(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Compass className="w-3 h-3 text-emerald-600" />
                                <span>Build Path</span>
                              </button>
                            )}
                            {onViewResourceDetails && (
                              <button
                                onClick={() => onViewResourceDetails(item)}
                                className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer hover:underline"
                              >
                                {t.view_details}
                              </button>
                            )}
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Decision Matrix / Comparison Table */}
              {comparisonTable.length > 1 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <TableProperties className="w-4 h-4 text-blue-700" />
                      Comparative Selection Matrix
                    </h4>
                    <button
                      onClick={() => setShowComparison(!showComparison)}
                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
                    >
                      {showComparison ? 'Hide Table' : 'Show Table'}
                    </button>
                  </div>

                  {showComparison && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Resource / Provider</th>
                            <th className="py-2.5 px-2 text-center">Fit Score</th>
                            <th className="py-2.5 px-2">Type</th>
                            <th className="py-2.5 px-2">Verification</th>
                            <th className="py-2.5 px-2">Level</th>
                            <th className="py-2.5 px-2">Language</th>
                            <th className="py-2.5 px-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {comparisonTable.map((row, idx) => (
                            <tr key={row.id} className={idx === 0 ? 'bg-amber-50/50 font-medium' : ''}>
                              <td className="py-2.5 px-3">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    {idx === 0 && (
                                      <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                        BEST
                                      </span>
                                    )}
                                    <span className="font-bold text-slate-900 truncate max-w-[220px]">
                                      {row.title}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500">{row.provider_name}</p>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                                <span className={`px-2 py-0.5 rounded font-mono ${idx === 0 ? 'bg-amber-200 text-amber-950' : 'bg-slate-100 text-slate-700'}`}>
                                  {row.fit_score}/100
                                </span>
                              </td>
                              <td className="py-2.5 px-2">
                                <span className="text-[11px] font-medium text-slate-600 uppercase">
                                  {row.resource_type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-2.5 px-2">
                                {renderVerificationBadge(row.verification_status)}
                              </td>
                              <td className="py-2.5 px-2 text-slate-600">
                                {row.level}
                              </td>
                              <td className="py-2.5 px-2 text-slate-600">
                                {row.language}
                              </td>
                              <td className="py-2.5 px-2 text-right">
                                <a
                                  href={row.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold hover:underline"
                                >
                                  <span>Open</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Strategic Future Skills Section */}
              {futureSkills.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-purple-600 text-white">
                        <TrendingUp className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-950">
                          Strategic Future Skills Framework
                        </h4>
                        <p className="text-[11px] text-purple-800">
                          Forward-looking capabilities earmarked for future career milestones (distinct from current gaps).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {futureSkills.map((fs) => (
                      <div 
                        key={fs.id} 
                        className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-purple-200 flex items-start justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-purple-950">{fs.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                              Future Skill
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            {fs.explanation}
                          </p>
                        </div>
                        {onSelectSkillGap && (
                          <button
                            onClick={() => onSelectSkillGap(fs.name)}
                            className="px-2.5 py-1 text-[10px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded shrink-0 cursor-pointer"
                          >
                            Explore
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. See All Relevant Resources Expander */}
              {remainingResources.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {showAll ? (
                      <>
                        <span>{t.show_fewer}</span>
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>{t.see_all_resources} ({remainingResources.length} more)</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {showAll && (
                    <div className="space-y-2.5 mt-3 animate-in fade-in">
                      {remainingResources.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {renderSourceTypeBadge(item.source_type)}
                              {renderVerificationBadge(item.verification_status)}
                              <span className="text-[11px] text-slate-500">{item.provider_name}</span>
                              <span className="text-xs font-mono font-bold text-slate-700">({item.ranking_score}/100)</span>
                            </div>
                            <h6 className="text-xs font-bold text-slate-900">{item.title}</h6>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                          </div>

                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-bold shrink-0 hover:underline"
                          >
                            <span>{t.open_resource}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Safe Link Transparency Notice */}
              <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between gap-2">
                <span>
                  All learning links pass strict SSRF screening and domain verification.
                </span>
                <span className="font-semibold text-slate-700 shrink-0">
                  {data.source_breakdown.web_discovered} Live Web · {data.source_breakdown.demo_catalogue} Prototype Catalogue
                </span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
