import { Globe, LogOut, Mic, Moon, Search, Sprout, Sun, Tractor, X } from 'lucide-react';
import type { LanguageCode, Translations } from '../i18n/translations';
import type { AuthUser } from '../types/fieldshare';
import { triggerHaptic, useVoiceInput } from '../utils/feedback';

interface WorkspaceToolbarProps {
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  t: Translations;
  isDark: boolean;
  onToggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser: AuthUser;
  onSignOut: () => void;
}

const LANGUAGES: Array<{ code: LanguageCode; label: string; ariaLabel: string }> = [
  { code: 'en', label: 'EN', ariaLabel: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ', ariaLabel: 'Kannada' },
  { code: 'hi', label: 'हिन्दी', ariaLabel: 'Hindi' },
];

export function WorkspaceToolbar({
  language,
  onChangeLanguage,
  t,
  isDark,
  onToggleTheme,
  searchQuery,
  onSearchChange,
  currentUser,
  onSignOut,
}: WorkspaceToolbarProps) {
  const { listening, voiceHint, startVoiceCapture } = useVoiceInput(
    (transcript) => onSearchChange(transcript),
    ['John Deere', 'Rice Paddy', 'Willow Creek', 'Harvester']
  );

  const isOwner = currentUser.role === 'OWNER';
  const RoleIcon = isOwner ? Tractor : Sprout;
  const roleLabel = isOwner ? t.toolbar.roleOwner : t.toolbar.roleFarmer;

  return (
    <section
      aria-label="Workspace controls"
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-stone-300 bg-white p-3.5 lg:flex-row lg:items-center lg:justify-between dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl"
    >
      {/* Signed-in Role Indicator + Language Switcher */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="inline-flex items-center gap-2 px-1 text-sm font-bold text-stone-950 dark:text-white">
          <RoleIcon
            className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
            aria-hidden="true"
          />
          <span className="whitespace-nowrap">{roleLabel}</span>
          <span className="text-stone-400 dark:text-slate-500" aria-hidden="true">
            ·
          </span>
          <span className="max-w-[160px] truncate text-xs font-semibold text-stone-700 dark:text-slate-300">
            {currentUser.fullName}
          </span>
        </div>

        {/* Language Selector: English / Kannada / Hindi */}
        <div className="flex items-center gap-1.5">
          <Globe className="h-4 w-4 text-stone-600 dark:text-slate-300" aria-hidden="true" />
          <div
            role="group"
            aria-label={t.toolbar.languageLabel}
            className="inline-flex rounded-xl bg-stone-100 p-1 dark:bg-slate-800/90"
          >
            {LANGUAGES.map((lang) => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    onChangeLanguage(lang.code);
                  }}
                  aria-label={lang.ariaLabel}
                  aria-pressed={active}
                  className={`min-h-[44px] rounded-lg px-2.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-emerald-700 text-white shadow-sm dark:bg-emerald-600'
                      : 'text-stone-700 hover:text-stone-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search with voice input + Sunlight/Dark Glass toggle */}
      <div className="flex flex-1 items-center justify-end gap-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <label htmlFor="workspace-search" className="sr-only">
            {t.toolbar.searchLabel}
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 dark:text-slate-400"
            aria-hidden="true"
          />
          <input
            id="workspace-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.toolbar.searchPlaceholder}
            className="min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 pl-10 pr-20 text-sm text-stone-950 placeholder:text-stone-500 focus:border-emerald-700 focus:bg-white focus:outline-none dark:border-white/15 dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-emerald-400"
          />
          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={startVoiceCapture}
              aria-label="Voice search input"
              title="Voice search input"
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                listening
                  ? 'bg-emerald-700 text-white'
                  : 'text-stone-600 hover:bg-stone-200 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
          {voiceHint && (
            <p className="mt-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
              {voiceHint}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(12);
            onToggleTheme();
          }}
          aria-label={isDark ? 'Switch to Sunlight Mode' : 'Switch to Dark Glass Mode'}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-stone-300 bg-stone-100 px-3.5 text-xs font-semibold text-stone-900 whitespace-nowrap shrink-0 transition-colors hover:bg-stone-200 dark:border-white/15 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          {isDark ? (
            <>
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span className="hidden sm:inline">{t.toolbar.sunlightMode}</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-stone-700" aria-hidden="true" />
              <span className="hidden sm:inline">{t.toolbar.darkGlass}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(12);
            onSignOut();
          }}
          aria-label={`${t.toolbar.signOut} (${currentUser.fullName})`}
          title={`${currentUser.fullName} · ${currentUser.role === 'OWNER' ? t.toolbar.roleOwner : t.toolbar.roleFarmer}`}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-3.5 text-xs font-semibold text-stone-800 whitespace-nowrap shrink-0 transition-colors hover:bg-stone-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4 shrink-0 text-stone-600 dark:text-slate-300" aria-hidden="true" />
          <span className="hidden xl:inline max-w-[110px] truncate">{currentUser.fullName}</span>
          <span>{t.toolbar.signOut}</span>
        </button>
      </div>
    </section>
  );
}
