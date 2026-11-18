import { useState, type FormEvent } from 'react';
import { signInWithPopup } from 'firebase/auth';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mic,
  Moon,
  Phone,
  Sprout,
  Sun,
  Tractor,
  User as UserIcon,
} from 'lucide-react';
import type { LanguageCode, Translations } from '../i18n/translations';
import { auth, googleAuthProvider } from '../lib/firebase';
import type { AuthUser } from '../types/fieldshare';
import { triggerHaptic, useVoiceInput } from '../utils/feedback';

interface LoginPageProps {
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  t: Translations;
  onAuthenticated: (user: AuthUser, token?: string) => void;
}

const LANGUAGES: Array<{ code: LanguageCode; label: string; ariaLabel: string }> = [
  { code: 'en', label: 'EN', ariaLabel: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ', ariaLabel: 'Kannada' },
  { code: 'hi', label: 'हिन्दी', ariaLabel: 'Hindi' },
];

export function LoginPage({
  language,
  onChangeLanguage,
  isDark,
  onToggleTheme,
  t,
  onAuthenticated,
}: LoginPageProps) {
  const [role, setRole] = useState<'FARMER' | 'OWNER'>('FARMER');
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const { listening, voiceHint, startVoiceCapture } = useVoiceInput(
    (transcript) => setPhone(transcript),
    ['+91 98450 12084', '+91 98801 88201']
  );

  const fillDemoCredentials = (targetRole: 'FARMER' | 'OWNER') => {
    triggerHaptic(10);
    setErrorMsg(null);
    if (targetRole === 'OWNER') {
      setPhone('+91 98801 88201');
      setPassword('owner123');
    } else {
      setPhone('+91 98450 12084');
      setPassword('farmer123');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    triggerHaptic(14);
    setSubmitting(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'register'
          ? { fullName, phone, password, role }
          : { phone, password, role };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }
      onAuthenticated(data.user as AuthUser, data.token as string | undefined);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to sign in. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    triggerHaptic(16);
    setGoogleBusy(true);
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await credential.user.getIdToken();
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google sign-in verification failed.');
      }
      onAuthenticated(data.user as AuthUser, data.token as string | undefined);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google sign-in popup was closed before completing.');
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Unable to complete Google sign-in.'
        );
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  const primaryCtaLabel = submitting
    ? t.login.signingIn
    : mode === 'register'
    ? role === 'OWNER'
      ? t.login.registerOwner
      : t.login.registerFarmer
    : role === 'OWNER'
    ? t.login.submitOwner
    : t.login.submitFarmer;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar matching AgroHub theme */}
      <header className="sticky top-0 z-30 border-b border-stone-300 bg-white/95 backdrop-blur-md transition-colors dark:border-white/10 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          <span className="font-display text-xl font-extrabold tracking-tight text-stone-950 whitespace-nowrap shrink-0 dark:text-white">
            {t.brand}
          </span>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <Globe
                className="hidden sm:block h-4 w-4 text-stone-600 dark:text-slate-300"
                aria-hidden="true"
              />
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
                      className={`min-h-[40px] rounded-lg px-2.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
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

            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                onToggleTheme();
              }}
              aria-label={
                isDark ? 'Switch to Sunlight Mode' : 'Switch to Dark Glass Mode'
              }
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-300 bg-stone-100 px-3.5 text-xs font-semibold text-stone-900 whitespace-nowrap shrink-0 transition-colors hover:bg-stone-200 dark:border-white/15 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700"
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
          </div>
        </div>
      </header>

      {/* Main Split Auth Layout */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid w-full items-stretch gap-6 lg:grid-cols-12">
          {/* Visual Field Showcase */}
          <section
            aria-label="AgroHub field overview"
            className="relative hidden overflow-hidden rounded-2xl border border-stone-300 bg-stone-900 lg:col-span-6 lg:flex lg:min-h-[600px] lg:flex-col lg:justify-end dark:border-white/10"
          >
            {!heroImgFailed ? (
              <img
                src="/src/assets/images/hero_tractor_field_1794954398722.jpg"
                alt="Tractor working on terraced agricultural farmland"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-stone-900 to-emerald-950"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/45 to-stone-950/15"
            />
            <div className="relative z-10 p-8 text-white">
              <p className="text-xs font-semibold tracking-wide text-emerald-300">
                {t.login.kicker}
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-balance">
                {t.login.showcaseTitle}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-200">
                {t.login.showcaseSubtitle}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Sprout className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                    <span>{t.login.farmerFeatureTitle}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-stone-300">
                    {t.login.farmerFeatureSub}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Tractor className="h-4 w-4 text-amber-400" aria-hidden="true" />
                    <span>{t.login.ownerFeatureTitle}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-stone-300">
                    {t.login.ownerFeatureSub}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Login Form Card */}
          <section
            aria-label={t.login.title}
            className="flex flex-col justify-center rounded-2xl border border-stone-300 bg-white p-6 sm:p-8 lg:col-span-6 dark:border-white/10 dark:bg-slate-900/75 dark:backdrop-blur-xl"
          >
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-950 sm:text-3xl dark:text-white">
                {t.login.title}
              </h1>
              <p className="mt-1.5 text-sm text-stone-600 dark:text-slate-300">
                {t.login.subtitle}
              </p>
            </div>

            {/* 2 Account Role Options: Farmer & Owner */}
            <div className="mt-6">
              <span className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                {t.login.roleLabel}
              </span>
              <div
                role="group"
                aria-label={t.login.roleLabel}
                className="mt-2 grid grid-cols-2 gap-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    setRole('FARMER');
                    setErrorMsg(null);
                  }}
                  aria-pressed={role === 'FARMER'}
                  className={`flex min-h-[64px] items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                    role === 'FARMER'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/55 dark:text-emerald-100 dark:ring-emerald-400'
                      : 'border-stone-300 bg-stone-50 text-stone-800 hover:bg-stone-100 dark:border-white/15 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      role === 'FARMER'
                        ? 'bg-emerald-700 text-white dark:bg-emerald-600'
                        : 'bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Sprout className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold whitespace-nowrap">
                      {t.login.farmerOption}
                    </span>
                    <span className="block text-xs text-stone-600 truncate dark:text-slate-300">
                      {t.login.farmerHint}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    setRole('OWNER');
                    setErrorMsg(null);
                  }}
                  aria-pressed={role === 'OWNER'}
                  className={`flex min-h-[64px] items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                    role === 'OWNER'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/55 dark:text-emerald-100 dark:ring-emerald-400'
                      : 'border-stone-300 bg-stone-50 text-stone-800 hover:bg-stone-100 dark:border-white/15 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      role === 'OWNER'
                        ? 'bg-emerald-700 text-white dark:bg-emerald-600'
                        : 'bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Tractor className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold whitespace-nowrap">
                      {t.login.ownerOption}
                    </span>
                    <span className="block text-xs text-stone-600 truncate dark:text-slate-300">
                      {t.login.ownerHint}
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* Sign In / Create Account switch */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <div
                role="group"
                aria-label="Authentication mode"
                className="inline-flex rounded-xl bg-stone-100 p-1 dark:bg-slate-800/90"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  aria-pressed={mode === 'signin'}
                  className={`min-h-[40px] rounded-lg px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    mode === 'signin'
                      ? 'bg-white text-stone-950 shadow-sm dark:bg-emerald-600 dark:text-white'
                      : 'text-stone-700 hover:text-stone-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {t.login.signInTab}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                  }}
                  aria-pressed={mode === 'register'}
                  className={`min-h-[40px] rounded-lg px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    mode === 'register'
                      ? 'bg-white text-stone-950 shadow-sm dark:bg-emerald-600 dark:text-white'
                      : 'text-stone-700 hover:text-stone-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {t.login.registerTab}
                </button>
              </div>

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => fillDemoCredentials(role)}
                  className="min-h-[40px] rounded-lg px-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 whitespace-nowrap shrink-0 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                >
                  {t.login.demoFillLabel}
                </button>
              )}
            </div>

            {/* Phone Number & Password Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="login-fullname"
                    className="block text-xs font-semibold text-stone-700 dark:text-slate-300"
                  >
                    {t.login.fullNameLabel}
                  </label>
                  <div className="relative mt-1.5">
                    <UserIcon
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 dark:text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="login-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.login.fullNamePlaceholder}
                      className="min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 pl-10 pr-4 text-sm text-stone-950 placeholder:text-stone-500 focus:border-emerald-700 focus:bg-white focus:outline-none dark:border-white/15 dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-emerald-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="login-phone"
                  className="block text-xs font-semibold text-stone-700 dark:text-slate-300"
                >
                  {t.login.phoneLabel}
                </label>
                <div className="relative mt-1.5">
                  <Phone
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 dark:text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="login-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.login.phonePlaceholder}
                    className="min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 pl-10 pr-12 text-sm tabular-nums text-stone-950 placeholder:text-stone-500 focus:border-emerald-700 focus:bg-white focus:outline-none dark:border-white/15 dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={startVoiceCapture}
                    aria-label="Voice input phone number"
                    title="Voice input phone number"
                    className={`absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition-colors ${
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

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-stone-700 dark:text-slate-300"
                >
                  {t.login.passwordLabel}
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 dark:text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.login.passwordPlaceholder}
                    className="min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 pl-10 pr-12 text-sm text-stone-950 placeholder:text-stone-500 focus:border-emerald-700 focus:bg-white focus:outline-none dark:border-white/15 dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-200 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {mode === 'signin' && (
                <p className="text-xs font-mono tabular-nums text-stone-500 dark:text-slate-400">
                  {t.login.demoCredentialsHint}:{' '}
                  {role === 'OWNER'
                    ? '+91 98801 88201 · owner123'
                    : '+91 98450 12084 · farmer123'}
                </p>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-900 dark:border-red-500/30 dark:bg-red-950/50 dark:text-red-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || googleBusy}
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.99] disabled:opacity-60 whitespace-nowrap dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {primaryCtaLabel}
              </button>
            </form>

            {/* OR Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                {t.login.orDivider}
              </span>
              <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
            </div>

            {/* Sign in with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting || googleBusy}
              className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-900 transition-colors hover:bg-stone-50 active:scale-[0.99] disabled:opacity-60 whitespace-nowrap dark:border-white/15 dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-800"
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>{t.login.googleBtn}</span>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
