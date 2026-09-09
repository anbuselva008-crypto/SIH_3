import { useState } from 'react';
import { 
  Sparkles, 
  Flame, 
  ArrowUpRight, 
  Calendar, 
  Clock, 
  BookOpen, 
  Filter, 
  Search, 
  Info,
  ChevronRight,
  Database,
  Compass,
  Globe
} from 'lucide-react';
import type { RecommendationItem, RecommendationResponse, LearningResource } from '../types/index.ts';

interface RecommendationsSectionProps {
  recommendations: RecommendationResponse | null;
  allCatalogue: LearningResource[];
  loading?: boolean;
  onViewDetails: (item: RecommendationItem) => void;
  onViewResource: (res: LearningResource) => void;
  onRegenerate?: () => void;
  onOpenDiscovery?: (skill?: string) => void;
  onBuildLearningPath?: (skill: string) => void;
}

export default function RecommendationsSection({
  recommendations,
  allCatalogue,
  loading = false,
  onViewDetails,
  onViewResource,
  onRegenerate,
  onOpenDiscovery,
  onBuildLearningPath,
}: RecommendationsSectionProps) {
  const [activeTab, setActiveTab] = useState<'high' | 'recommended' | 'optional' | 'all'>('high');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'iGOT' | 'NSSTA'>('all');

  const highPriority = recommendations?.high_priority || [];
  const recommendedNext = recommendations?.recommended_next || [];
  const optionalFuture = recommendations?.optional_future || [];

  // Filter catalogue when "all" tab is active
  const filteredCatalogue = allCatalogue.filter((res) => {
    const matchesSearch = 
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.competency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || res.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  return (
    <div id="recommendations-section" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-700" />
            <h2 className="text-base font-bold text-slate-900">
              Personalized Learning Pathways & Course Catalogue
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tailored to your designation, division, operational assignment, and verified competency gaps
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenDiscovery && (
            <button
              onClick={() => onOpenDiscovery()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Launch Stage 5A intelligent web and open learning resource discovery"
            >
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              <span>Intelligent Resource Discovery</span>
            </button>
          )}

          <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            Demo Catalogue / Prototype Data
          </span>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors"
              title="Recalculate recommendations"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Priority Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('high')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'high'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>High Priority</span>
          <span className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'high' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {highPriority.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('recommended')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'recommended'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Recommended Next</span>
          <span className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'recommended' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {recommendedNext.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('optional')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'optional'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Optional / Future Milestones</span>
          <span className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'optional' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {optionalFuture.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto ${
            activeTab === 'all'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>All Catalogue Resources</span>
          <span className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'all' ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {allCatalogue.length}
          </span>
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-48 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : activeTab === 'high' ? (
        <div className="space-y-3">
          <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 text-xs text-rose-900 flex items-center justify-between">
            <span><strong>High Priority:</strong> Immediate bridge for your primary competency gaps and operational assignments.</span>
            <span className="font-semibold text-rose-800">{highPriority.length} programmes</span>
          </div>

          {highPriority.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No high-priority deficits found. Your assessed competencies are currently meeting required benchmarks!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highPriority.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  onViewDetails={() => onViewDetails(item)}
                  onBuildLearningPath={onBuildLearningPath}
                />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'recommended' ? (
        <div className="space-y-3">
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-center justify-between">
            <span><strong>Recommended Next:</strong> Targeted modules to deepen your official statistical analysis toolkit.</span>
            <span className="font-semibold text-blue-800">{recommendedNext.length} programmes</span>
          </div>

          {recommendedNext.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No intermediate recommendations available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedNext.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  onViewDetails={() => onViewDetails(item)}
                  onBuildLearningPath={onBuildLearningPath}
                />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'optional' ? (
        <div className="space-y-3">
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-center justify-between">
            <span><strong>Optional & Future Milestones:</strong> Advanced specializations or courses requiring foundational prerequisites.</span>
            <span className="font-semibold text-slate-700">{optionalFuture.length} programmes</span>
          </div>

          {optionalFuture.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No optional future programmes catalogued.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {optionalFuture.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  onViewDetails={() => onViewDetails(item)}
                  onBuildLearningPath={onBuildLearningPath}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* All Catalogue View */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search catalogue courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Sources (iGOT & NSSTA)</option>
                <option value="iGOT">iGOT Karmayogi Only</option>
                <option value="NSSTA">NSSTA MoSPI Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalogue.map((res) => (
              <CatalogueCard
                key={res.id}
                resource={res}
                onView={() => onViewResource(res)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface RecommendationCardProps {
  item: RecommendationItem;
  onViewDetails: () => void;
  onBuildLearningPath?: (skill: string) => void;
  key?: string | number;
}

/**
 * Individual Recommendation Card
 */
function RecommendationCard({
  item,
  onViewDetails,
  onBuildLearningPath,
}: RecommendationCardProps) {
  const { resource } = item;
  const isIGOT = resource.source === 'iGOT';

  const priorityColors = {
    'HIGH PRIORITY': 'bg-rose-50 text-rose-700 border-rose-200',
    'RECOMMENDED NEXT': 'bg-blue-50 text-blue-700 border-blue-200',
    'OPTIONAL / FUTURE': 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all">
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
            isIGOT ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {resource.source}
          </span>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[item.priority]}`}>
            {item.priority}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
          {resource.title}
        </h3>

        {/* Plain Language Reason */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-2.5">
          <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
            {item.reason}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {resource.duration}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
            {resource.level}
          </span>
          <span className="text-indigo-700 font-semibold text-xs">
            {resource.competency}
          </span>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs text-slate-500">
          Match: <strong className="text-slate-900">{item.recommendation_score}%</strong>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {onBuildLearningPath && (
            <button
              onClick={() => onBuildLearningPath(resource.competency)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              title="Personalized Learning Path"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Path</span>
            </button>
          )}
          <button
            onClick={onViewDetails}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50/70 hover:bg-blue-100/70 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Practice</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface CatalogueCardProps {
  resource: LearningResource;
  onView: () => void;
  key?: string | number;
}

/**
 * Full Catalogue Card
 */
function CatalogueCard({
  resource,
  onView,
}: CatalogueCardProps) {
  const isIGOT = resource.source === 'iGOT';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
            isIGOT ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {resource.source}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {resource.level}
          </span>
        </div>

        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
          {resource.title}
        </h3>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {resource.duration}
          </span>
          <span className="text-indigo-700 font-semibold text-xs">
            {resource.competency}
          </span>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          AI Quiz Available
        </span>
        <button
          onClick={onView}
          className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100/70 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Course Details & Quiz</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
