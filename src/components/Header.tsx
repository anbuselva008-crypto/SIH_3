import { Building2, Database, RotateCcw, LogOut, Sparkles, UserCheck, UploadCloud } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';
import type { LearnerProfile } from '../types/index.ts';

interface HeaderProps {
  learner?: LearnerProfile | null;
  onLogout?: () => void;
  onResetBaseline?: () => void;
  onOpenUpload?: () => void;
  resetting?: boolean;
}

export default function Header({ learner, onLogout, onResetBaseline, onOpenUpload, resetting }: HeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="border-b border-slate-200 bg-white" id="main-header">
      {/* Top National Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-slate-300 to-emerald-700" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-slate-900 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('govt_india')} • {t('mospi_nssta')}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                SIH 2026
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                UGF Cadre System
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {t('portal_title')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Multilingual Selector in Header */}
          <LanguageSelector id="header-language-selector" variant="compact" />

          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-md">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium">PostgreSQL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-indigo-800 bg-indigo-50/80 border border-indigo-200 px-2.5 py-1.5 rounded-md font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Groq AI</span>
          </div>

          {learner && (
            <div className="flex items-center gap-2">
              {onOpenUpload && (
                <button
                  onClick={onOpenUpload}
                  className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-md font-semibold transition-colors shadow-2xs cursor-pointer"
                  title="Upload official training materials, syllabus, or lecture slides"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload Doc</span>
                </button>
              )}

              {learner.is_demo ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-md font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  {t('demo_account')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-md font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {learner.role || 'Cadre Officer'}
                </span>
              )}

              {onResetBaseline && learner.is_demo && (
                <button
                  id="reset-baseline-header-btn"
                  onClick={onResetBaseline}
                  disabled={resetting}
                  className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1.5 rounded-md font-medium transition-colors shadow-xs cursor-pointer"
                  title="Resets Arun Kumar's competencies back to initial baseline for demonstration"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-slate-600 ${resetting ? 'animate-spin' : ''}`} />
                  <span>Reset</span>
                </button>
              )}

              {onLogout && (
                <button
                  id="btn-header-logout"
                  onClick={onLogout}
                  className="flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer"
                  title="Sign out of current officer account"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t('sign_out')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
