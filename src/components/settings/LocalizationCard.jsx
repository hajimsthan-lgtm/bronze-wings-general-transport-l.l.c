import { Globe, Check } from 'lucide-react';
import SettingsCard from './SettingsCard';

const LANGUAGES = [
  { code: 'en', native: 'English', description: 'Use the app in English', flag: '🇬🇧' },
  { code: 'ar', native: 'العربية', description: 'Switch the interface to Arabic (RTL)', flag: '🇸🇦' },
];

/**
 * Sophisticated language switcher with flag icons and descriptive labels.
 */
export default function LocalizationCard({ language, onLanguageChange }) {
  return (
    <SettingsCard icon={Globe} title="Localization" description="Language and regional preferences">
      <div className="space-y-2.5">
        {LANGUAGES.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.99] ${
                isActive
                  ? 'border-blue-500/40 bg-blue-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-2xl flex-shrink-0">{lang.flag}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/80'}`}>{lang.native}</p>
                <p className="text-xs text-white/40 truncate">{lang.description}</p>
              </div>
              {isActive && (
                <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-blue-300" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </SettingsCard>
  );
}