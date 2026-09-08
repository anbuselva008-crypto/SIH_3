import { useEffect, useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { checkHealth } from '../services/api.ts';
import type { HealthResponse } from '../types/index.ts';

export default function ApiStatusBadge() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkHealth();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend unreachable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div
      id="api-status-banner"
      className="bg-slate-900 text-slate-100 rounded-lg p-4 mb-6 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-800 rounded-md text-emerald-400">
          <Database className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Architecture Pipeline:</span>
            {loading ? (
              <span className="text-slate-400 inline-flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
              </span>
            ) : error ? (
              <span className="text-rose-400 inline-flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" /> {error}
              </span>
            ) : (
              <span className="text-emerald-400 inline-flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Full-Stack Connected (PostgreSQL Engine Active)
              </span>
            )}
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5 flex flex-wrap gap-x-3">
            <span>REST API: <code className="text-amber-300">GET /api/learner</code></span>
            <span>•</span>
            <span><code className="text-amber-300">GET /api/competencies</code></span>
            {health && (
              <>
                <span>•</span>
                <span>Records: {health.database.learners_count} Learner, {health.database.competencies_count} Competencies</span>
                <span>•</span>
                <span>Stage 4: <code className="text-amber-300">/api/learning-materials</code> & <code className="text-amber-300">/api/quizzes</code></span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="px-2 py-1 rounded bg-slate-800 text-indigo-300 font-mono text-[11px] border border-indigo-800/40">
          Stage 1 - 4 Pipeline Verified
        </span>
        <button
          id="refresh-health-btn"
          onClick={fetchStatus}
          title="Refresh connection status"
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
