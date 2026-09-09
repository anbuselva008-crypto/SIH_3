import { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  Sun,
  Sunset,
  Moon,
  Check,
  Save,
  ShieldAlert,
} from 'lucide-react';
import type {
  LearnerSchedulePreferences,
  AvailabilityMode,
  PreferredPeriod,
  SupportedLanguage,
} from '../types/index.ts';
import { updateSchedulePreferences } from '../services/api.ts';
import { getWeeklyPlanT } from '../i18n/weeklyPlanTranslations.ts';

interface WeeklyScheduleModalProps {
  learnerId: number;
  currentPreferences: LearnerSchedulePreferences;
  language?: SupportedLanguage;
  onClose: () => void;
  onSaved: (updated: LearnerSchedulePreferences) => void;
}

const AVAILABILITY_MODES: Array<{
  id: AvailabilityMode;
  label: string;
  defaultMins: number;
  subtext: string;
}> = [
  { id: '15_min_day', label: '15 Mins / Day', defaultMins: 15, subtext: 'Light daily micro-learning (~60m/week)' },
  { id: '30_min_day', label: '30 Mins / Day', defaultMins: 30, subtext: 'Balanced cadence for active officials (~120m/week)' },
  { id: '45_min_day', label: '45 Mins / Day', defaultMins: 45, subtext: 'Standard government continuous learning (~135-180m/week)' },
  { id: '60_min_day', label: '60 Mins / Day', defaultMins: 60, subtext: 'Intensive competency upgrading (~180-240m/week)' },
  { id: '2_3_hrs_week', label: '2–3 Hours / Week', defaultMins: 45, subtext: 'Flexible weekend or evening blocks (~150m/week)' },
  { id: '5_plus_hrs_week', label: '5+ Hours / Week', defaultMins: 60, subtext: 'Cadre exam & promotion fast-track (~300m/week)' },
];

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeeklyScheduleModal({
  learnerId,
  currentPreferences,
  language = 'en',
  onClose,
  onSaved,
}: WeeklyScheduleModalProps) {
  const t = getWeeklyPlanT(language);

  const [mode, setMode] = useState<AvailabilityMode>(currentPreferences.availability_mode || '30_min_day');
  const [sessionMins, setSessionMins] = useState<number>(currentPreferences.minutes_per_session || 30);
  const [selectedDays, setSelectedDays] = useState<string[]>(
    currentPreferences.preferred_days
      ? currentPreferences.preferred_days.split(',').map((d) => d.trim()).filter(Boolean)
      : ['Monday', 'Wednesday', 'Friday', 'Sunday']
  );
  const [period, setPeriod] = useState<PreferredPeriod>(currentPreferences.preferred_period || 'Evening');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto calculate weekly minutes target
  const weeklyTarget = Math.max(15, selectedDays.length * sessionMins);

  const handleModeChange = (newMode: AvailabilityMode) => {
    setMode(newMode);
    const found = AVAILABILITY_MODES.find((m) => m.id === newMode);
    if (found) {
      setSessionMins(found.defaultMins);
    }
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return; // Must have at least 1 day
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updated = await updateSchedulePreferences(learnerId, {
        availability_mode: mode,
        minutes_per_session: sessionMins,
        weekly_minutes_target: weeklyTarget,
        preferred_days: selectedDays,
        preferred_period: period,
      });

      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="weekly-schedule-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="weekly-schedule-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 relative">
          <button
            id="close-schedule-modal-btn"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">{t.adjust_schedule}</h2>
              <p className="text-sm text-indigo-200 mt-0.5">
                Calibrate study volume to fit your departmental workload without burnout
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Availability Mode Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Availability Cadence
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABILITY_MODES.map((item) => {
                const isSelected = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleModeChange(item.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {item.label}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.subtext}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Days of Week Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Active Study Days ({selectedDays.length} days selected)
              </label>
              <span className="text-xs text-slate-500">Pick days you are available</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Timing & Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Session Length (Mins)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={10}
                  max={120}
                  step={5}
                  value={sessionMins}
                  onChange={(e) => setSessionMins(Math.max(10, parseInt(e.target.value, 10) || 10))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                  min / session
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Preferred Period
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'Morning', label: 'Morning', icon: Sun },
                  { id: 'Afternoon', label: 'Midday', icon: Sunset },
                  { id: 'Evening', label: 'Evening', icon: Moon },
                ].map((p) => {
                  const Icon = p.icon;
                  const isSelected = period === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPeriod(p.id as PreferredPeriod)}
                      className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="text-xs">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary Preview Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Calibrated Weekly Budget
              </p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {weeklyTarget} minutes / week{' '}
                <span className="text-xs font-normal text-slate-500">
                  (~{Math.round((weeklyTarget / 60) * 10) / 10} hours)
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Official Pace
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : t.save_schedule}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
