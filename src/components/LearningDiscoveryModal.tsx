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
  Check
} from 'lucide-react';
import type { DiscoveredResource, DiscoveryResponse, SupportedLanguage } from '../types/index.ts';
import { fetchLearningDiscovery } from '../services/api.ts';
import { getDiscoveryT } from '../i18n/discoveryTranslations.ts';

interface LearningDiscoveryModalProps {
  skillGap: string;
  learnerId: number;
  language?: SupportedLanguage;
  onClose: () => void;
  onViewResourceDetails?: (resource: DiscoveredResource) => void;
}

export default function LearningDiscoveryModal({
  skillGap,
  learnerId,
  language = 'en',
  onClose,
  onViewResourceDetails,
}: LearningDiscoveryModalProps) {
  const t = getDiscoveryT(language);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [showAll, setShowAll] = useState(false);
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
  const otherOptions = data?.other_options || [];
  const remainingResources = (data?.all_resources || []).slice(5);

  const renderVerificationBadge = (status: string) => {
    if (status === 'Verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {t.verified}
        </span>
      );
    }
    if (status === 'Institutional') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Building2 className="w-3 h-3 text-indigo-600" />
          {t.institutional}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <AlertCircle className="w-3 h-3 text-slate-400" />
        {t.not_verified}
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                Stage 5A Discovery
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

            <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
              {data ? (
                <>
                  {t.matching_role_assignment}{' '}
                  <span className="text-amber-300 font-medium">({data.learner_context.assignment})</span>
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
              <p className="text-sm font-semibold text-slate-700">{t.searching_resources}</p>
              <div className="h-40 bg-white border border-slate-200 rounded-xl max-w-xl mx-auto"></div>
              <div className="h-24 bg-white border border-slate-200 rounded-xl max-w-xl mx-auto"></div>
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
                  className="bg-white rounded-xl border-2 border-amber-400/80 shadow-md p-5 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 uppercase tracking-wider shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        ⭐ {t.best_match}
                      </span>
                      {renderSourceTypeBadge(bestMatch.source_type)}
                      {renderVerificationBadge(bestMatch.verification_status)}
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500">
                      Tier {bestMatch.source_tier}: {bestMatch.provider_type}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                    {bestMatch.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {bestMatch.description}
                  </p>

                  {/* Why this is useful explanation */}
                  <div className="mt-3.5 p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs">
                    <p className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      {t.why_useful}:
                    </p>
                    <p className="text-blue-800 leading-relaxed font-medium">
                      {bestMatch.match_reason}
                    </p>
                  </div>

                  {/* Provider & Action Strip */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{t.source}: <strong className="text-slate-800">{bestMatch.provider_name}</strong></span>
                      {bestMatch.estimated_duration && (
                        <span className="text-slate-400">· {bestMatch.estimated_duration}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
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

              {/* 2. Other Useful Options */}
              {otherOptions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-700" />
                      {t.other_useful_options} ({otherOptions.length})
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Ranked by operational fit &amp; source authority
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {otherOptions.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {renderSourceTypeBadge(item.source_type)}
                            {renderVerificationBadge(item.verification_status)}
                            <span className="text-[11px] text-slate-500 font-medium">
                              {item.provider_name}
                            </span>
                          </div>

                          <h5 className="font-bold text-sm text-slate-900">
                            {item.title}
                          </h5>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          <p className="text-[11px] text-blue-800 font-medium">
                            {item.match_reason}
                          </p>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span>{t.open_resource}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          </a>

                          {onViewResourceDetails && (
                            <button
                              onClick={() => onViewResourceDetails(item)}
                              className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer hover:underline"
                            >
                              {t.view_details}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. See All Relevant Resources Expander */}
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
                  External learning links open in a new tab. All links pass protocol safety screening.
                </span>
                <span className="font-semibold text-slate-700 shrink-0">
                  {data.source_breakdown.web_discovered} Web · {data.source_breakdown.demo_catalogue} Prototype
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
            {t.show_fewer === 'Close' ? 'Close' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
