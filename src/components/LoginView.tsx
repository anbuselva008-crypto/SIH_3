import { useState, type FormEvent } from 'react';
import { 
  Building2, 
  User, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { loginOfficer, registerOfficer, loginDemoAccount } from '../services/api.ts';
import type { LearnerProfile } from '../types/index.ts';

interface LoginViewProps {
  onLoginSuccess: (learner: LearnerProfile, isNewUser?: boolean) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid official email address (e.g. officer@mospi.gov.in).');
      return;
    }

    try {
      setLoading(true);
      const { learner, isNewUser } = await loginOfficer(trimmedEmail);
      onLoginSuccess(learner, isNewUser);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to sign in. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full officer name.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid official email address.');
      return;
    }

    try {
      setLoading(true);
      const { learner, isNewUser } = await registerOfficer(trimmedEmail, trimmedName);
      onLoginSuccess(learner, isNewUser);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = async () => {
    setErrorMessage(null);
    try {
      setDemoLoading(true);
      const demoLearner = await loginDemoAccount();
      onLoginSuccess(demoLearner, false);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load demo account. Please check server connection.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div id="login-view" className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Ministry Banner */}
      <header className="bg-white border-b border-slate-200">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-white to-emerald-600" />
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-slate-900 flex items-center justify-center text-amber-400 font-bold shadow-sm">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                Government of India • Ministry of Statistics and Programme Implementation
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                National Statistical Systems Training Academy (NSSTA)
              </h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              SIH 2026 Prototype
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Hero Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl text-white p-6 sm:p-8 flex flex-col justify-between shadow-md">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Cadre Competency Matrix
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                AI-Enabled Personalized Learning & Skill Diagnostics
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Dedicated portal for Indian Official Statistical Cadre officers. Accurately benchmark competency gaps across Sampling Theory, Python microdata pipelines, Applied Data Analysis, and Statistical Dissemination.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700/60 space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-amber-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span>Curated to MoSPI & NSSTA competency standards</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>Dynamic scoring via verified PostgreSQL engine</span>
              </div>
            </div>
          </div>

          {/* Right Login / Register Card */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 mb-6">
                <button
                  type="button"
                  id="tab-login"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage(null);
                  }}
                  className={`pb-3 font-semibold text-sm transition-colors relative mr-6 ${
                    activeTab === 'login'
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Officer Sign In
                </button>
                <button
                  type="button"
                  id="tab-register"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage(null);
                  }}
                  className={`pb-3 font-semibold text-sm transition-colors relative ${
                    activeTab === 'register'
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  New Officer Registration
                </button>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        id="login-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="officer.cadre@mospi.gov.in"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter your registered email to continue to your dashboard or profile setup.
                    </p>
                  </div>

                  <button
                    type="submit"
                    id="btn-login-submit"
                    disabled={loading || demoLoading}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Authenticating Officer...
                      </>
                    ) : (
                      <>
                        Sign In to Learning Portal
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label htmlFor="register-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Officer Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="register-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dr. Priya Sharma"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        id="register-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="priya.sharma@mospi.gov.in"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-register-submit"
                    disabled={loading || demoLoading}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Officer Record...
                      </>
                    ) : (
                      <>
                        Register & Begin Profile Setup
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Hackathon Demo Account Option */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200/90">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    Hackathon Demonstration
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-200/80 text-amber-900 border border-amber-300">
                    Synthetic Cadre Record
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 leading-relaxed mb-3">
                  Instantly explore with the seeded synthetic profile of <strong>Arun Kumar</strong> (Statistical Officer, Survey Division), pre-loaded with baseline diagnostic benchmarks.
                </p>
                <button
                  type="button"
                  id="btn-use-demo-account"
                  onClick={handleUseDemo}
                  disabled={loading || demoLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {demoLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading Synthetic Profile...
                    </>
                  ) : (
                    <>
                      Use Demo Account (Arun Kumar)
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        Official Statistical Cadre Competency Platform • SIH 2026 Prototype • Ministry of Statistics and Programme Implementation
      </footer>
    </div>
  );
}
