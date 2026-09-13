/* localized-render */
import { t, useLocale } from "../utils/locale";
import React, { useState } from 'react';
import {
  Flame,
  ArrowRight,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  User as UserIcon,
  Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../utils/account';
import { LanguagePicker } from './LanguagePicker';

function isGoogleSha1Error(errText: string): boolean {
  const lower = (errText || '').toLowerCase();
  return (
    lower.includes('10') ||
    lower.includes('developer') ||
    lower.includes('sha-1') ||
    lower.includes('fingerprint') ||
    lower.includes('play services')
  );
}

export function LoginScreen() {
  useLocale();
  const auth = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copiedSha1, setCopiedSha1] = useState(false);

  const switchMode = (next: typeof mode) => {
    setMode(next);
    setError('');
    setNotice('');
    setPassword('');
    setConfirm('');
  };

  const perform = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.configured) return;
    if (mode === 'signup' && (password !== confirm || password.length < 8)) {
      setError(password !== confirm ? 'Passwords do not match.' : 'Use at least 8 characters for your password.');
      return;
    }
    void perform(async () => {
      if (mode === 'signin') await auth.signIn(email, password, remember);
      if (mode === 'signup') await auth.signUp(name, email, password);
      if (mode === 'reset') {
        await auth.resetPassword(email);
        setNotice('If an account exists for this email, a password reset link has been requested. Check your inbox and spam folder.');
      }
      setPassword('');
      setConfirm('');
    });
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/15 transition-all';

  return (
    <main className="min-h-dvh bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 text-slate-900 px-4 py-8 flex flex-col justify-between items-center">
      {/* Top Header with Language Picker */}
      <div className="w-full max-w-md flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <span className="text-base font-black text-slate-900 tracking-tight">{t("Calorie Pewar")}</span>
        </div>
        <LanguagePicker />
      </div>

      {/* Main Card Container */}
      <section className="w-full max-w-md my-auto space-y-4" aria-label={t("Calorie Pewar sign in")}>
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t(
              auth.user
                ? 'Verify your email'
                : mode === 'signup'
                ? 'Start your fitness journey'
                : mode === 'reset'
                ? 'Reset your password'
                : 'Welcome to Calorie Pewar'
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {t(
              auth.user
                ? 'Confirm your email before opening your account.'
                : 'Meals, movement, and progress in one place.'
            )}
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl shadow-slate-200/50">
          {!auth.configured && (
            <div role="status" className="rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">{t("Account login is not activated yet.")}</p>
              <p>{t("You can use this device offline while the app owner completes login setup.")}</p>
            </div>
          )}

          {auth.user ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-600 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 break-words">
                {t("Open the verification email for ")}
                <strong className="text-slate-900 font-bold">{auth.user.email}</strong>
                {t(", then return here.")}
              </p>
              <button
                disabled={busy}
                onClick={() =>
                  perform(async () => {
                    if (!(await auth.checkVerification())) {
                      setNotice('Email is not verified yet. Open the link in your email, then check again.');
                    }
                  })
                }
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 p-3.5 font-bold text-white text-xs sm:text-sm shadow-md shadow-teal-500/20 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer"
              >
                {t("I verified my email")}
              </button>
              <div className="flex flex-col gap-2 pt-2 text-xs">
                <button
                  disabled={busy}
                  onClick={() =>
                    perform(async () => {
                      await auth.resendVerification();
                      setNotice('Verification email requested. Check your inbox and spam folder.');
                    })
                  }
                  className="text-teal-600 hover:text-teal-700 font-semibold underline cursor-pointer"
                >
                  {t("Resend verification email")}
                </button>
                <button
                  disabled={busy}
                  onClick={() => perform(auth.logout)}
                  className="text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  {t("Use another account")}
                </button>
              </div>
            </div>
          ) : (
            <>
              {mode !== 'reset' && (
                <div className="grid grid-cols-2 p-1 gap-1 rounded-2xl bg-slate-100 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className={`rounded-xl py-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      mode === 'signin'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t("Sign in")}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className={`rounded-xl py-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      mode === 'signup'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t("Create account")}
                  </button>
                </div>
              )}

              {mode !== 'reset' && (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={busy || !auth.configured}
                    onClick={() => perform(() => auth.signInGoogle(remember))}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 shadow-xs transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{t("Continue with Google")}</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    {t("Choose your Google account to sign in or create an account. Google shares your basic profile and email with Calorie Pewar. ")}
                    <a href="/privacypolicy.html" target="_blank" rel="noreferrer" className="text-teal-600 font-semibold underline">
                      {t("Privacy notice")}
                    </a>
                  </p>
                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-2 text-[11px] text-slate-400 font-medium absolute">
                      {t("or continue with email")}
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={submit} className="space-y-3.5">
                {mode === 'signup' && (
                  <label className="block text-xs font-bold text-slate-700">
                    {t("Your name")}
                    <div className="relative mt-1">
                      <input
                        className={inputClass + ' ps-9'}
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={100}
                        placeholder={t("John Doe")}
                      />
                      <UserIcon className="w-4 h-4 text-slate-400 absolute start-3 top-3.5 pointer-events-none" />
                    </div>
                  </label>
                )}

                <label className="block text-xs font-bold text-slate-700">
                  {t("Email address")}
                  <div className="relative mt-1">
                    <input
                      className={inputClass + ' ps-9'}
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@example.com"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute start-3 top-3.5 pointer-events-none" />
                  </div>
                </label>

                {mode !== 'reset' && (
                  <label className="block text-xs font-bold text-slate-700">
                    {t("Password")}
                    <div className="relative mt-1">
                      <input
                        className={inputClass + ' ps-9 pe-11'}
                        type={show ? 'text' : 'password'}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={mode === 'signup' ? 8 : undefined}
                        required
                        placeholder="••••••••"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-3.5 pointer-events-none" />
                      <button
                        type="button"
                        aria-label={t(show ? 'Hide password' : 'Show password')}
                        onClick={() => setShow(!show)}
                        className="absolute end-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>
                )}

                {mode === 'signup' && (
                  <>
                    <p className="text-[11px] text-slate-500">
                      {t("Use at least 8 characters and a password you do not use elsewhere.")}
                    </p>
                    <label className="block text-xs font-bold text-slate-700">
                      {t("Confirm password")}
                      <div className="relative mt-1">
                        <input
                          className={inputClass + ' ps-9 pe-11'}
                          type={show ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          required
                          placeholder="••••••••"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-3.5 pointer-events-none" />
                      </div>
                    </label>

                    <label className="flex items-start gap-2 text-xs text-slate-600 pt-1">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 shrink-0"
                        checked={privacy}
                        onChange={(e) => setPrivacy(e.target.checked)}
                        required
                      />
                      <span className="leading-snug">
                        {t("I have read the ")}
                        <a href="/privacypolicy.html" target="_blank" rel="noreferrer" className="text-teal-600 font-semibold underline">
                          {t("privacy notice")}
                        </a>
                        {t(". My email and password are sent to Google Firebase to create my account.")}
                      </span>
                    </label>
                  </>
                )}

                {mode === 'signin' && (
                  <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-600">
                    <label className="flex gap-2 items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      <span>{t("Keep me signed in")}</span>
                    </label>
                    <button
                      type="button"
                      className="text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
                      onClick={() => switchMode('reset')}
                    >
                      {t("Forgot password?")}
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || !auth.configured || (mode === 'signup' && !privacy)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 p-3.5 font-bold text-white text-xs sm:text-sm shadow-md shadow-teal-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>
                    {t(
                      busy
                        ? 'Please wait…'
                        : mode === 'signin'
                        ? 'Sign in'
                        : mode === 'signup'
                        ? 'Create my account'
                        : 'Send reset email'
                    )}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {mode === 'reset' && (
                <button
                  onClick={() => switchMode('signin')}
                  className="w-full text-center text-xs text-teal-600 hover:text-teal-700 font-semibold pt-1 cursor-pointer"
                >
                  {t("Back to sign in")}
                </button>
              )}

              <div className="pt-2 border-t border-slate-100">
                <button
                  disabled={busy}
                  onClick={auth.continueAsGuest}
                  className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 underline py-1.5 cursor-pointer transition-colors"
                >
                  {t("Continue on this device without an account")}
                </button>
              </div>
            </>
          )}

          {/* Feedback alerts */}
          {error && (
            <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="font-semibold text-xs leading-tight">{t(error)}</p>
              </div>

              {isGoogleSha1Error(error) && (
                <div className="text-[11px] text-rose-700/90 leading-relaxed border-t border-rose-200/60 pt-2 space-y-2">
                  <p className="font-bold">{t("Firebase SHA-1 Setup Needed for APK:")}</p>
                  <p>
                    {t("Android Google Sign-In requires your APK SHA-1 fingerprint registered in Firebase Console (Project Settings > Android Apps):")}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white/90 p-2 rounded-xl font-mono text-[10px] text-slate-800 select-all border border-rose-200/80 break-all font-bold">
                      9F:36:91:19:BE:7D:08:24:0F:B6:03:B6:E1:35:D6:A2:37:FC:72:BF
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText('9F:36:91:19:BE:7D:08:24:0F:B6:03:B6:E1:35:D6:A2:37:FC:72:BF');
                          setCopiedSha1(true);
                          setTimeout(() => setCopiedSha1(false), 2500);
                        }
                      }}
                      className="px-2.5 py-2 bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 transition-colors shadow-xs cursor-pointer"
                    >
                      {copiedSha1 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">{t("Copied!")}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t("Copy")}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {t("Tip: Once added in Firebase, Google Sign-In works immediately without rebuilding! Or use Email Sign-In / Continue without account.")}
                  </p>
                </div>
              )}
            </div>
          )}

          {notice && (
            <div role="status" className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <p className="font-semibold">{t(notice)}</p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 flex gap-2 items-start justify-center text-center px-4 leading-relaxed">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-teal-600 mt-0.5" />
          <span>
            {t("Fitness logs stay on this device. Signing in does not upload them or enable Gemini. AI and health access have separate permission steps.")}
          </span>
        </p>
      </section>

      {/* Footer copyright / subtle text */}
      <footer className="py-2 text-center text-[10px] text-slate-400">
        <span>Calorie Pewar Mobile • Secure Local-First Fitness</span>
      </footer>
    </main>
  );
}
