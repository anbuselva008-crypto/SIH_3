import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import type { SupportedLanguage } from '../types/index.ts';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  id?: string;
  variant?: 'header' | 'compact' | 'dropdown';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  id = 'language-selector-control',
  variant = 'header' 
}) => {
  const { language, setLanguage, supportedLanguages, currentLanguageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div id={id} ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        id={`${id}-button`}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
          variant === 'header'
            ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-semibold">{currentLanguageOption.nativeName}</span>
        <span className="text-[10px] text-slate-400">({currentLanguageOption.code.toUpperCase()})</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div
          id={`${id}-menu`}
          className="origin-top-right absolute right-0 mt-1.5 w-52 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-slate-100 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="p-2 border-b border-slate-100 bg-slate-50 rounded-t-md">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Select Official Language
            </p>
            <p className="text-[10px] text-slate-400">11 Constitutional & Working Languages</p>
          </div>
          <div className="py-1 max-h-60 overflow-y-auto">
            {supportedLanguages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  id={`${id}-option-${lang.code}`}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    isSelected ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">{lang.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
