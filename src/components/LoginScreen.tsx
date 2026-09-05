/* localized-render */
import { t, useLocale, localeTag, matchesLocalized } from "../utils/locale";
import React, {useState} from 'react';
import {Flame, ArrowRight, Mail, ShieldCheck, Eye, EyeOff} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {authErrorMessage} from '../utils/account';

export function LoginScreen(){
  useLocale();
  const auth=useAuth();
  const [mode,setMode]=useState<'signin'|'signup'|'reset'>('signin');
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
  const [show,setShow]=useState(false),[remember,setRemember]=useState(true),[privacy,setPrivacy]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const switchMode=(next:typeof mode)=>{setMode(next);setError('');setNotice('');setPassword('');setConfirm('');};
  const perform=async(action:()=>Promise<void>)=>{if(busy)return;setBusy(true);setError('');setNotice('');try{await action();}catch(err){setError(authErrorMessage(err));}finally{setBusy(false);}};
  const submit=(e:React.FormEvent)=>{e.preventDefault();if(!auth.configured)return;
    if(mode==='signup'&&(password!==confirm||password.length<8)){setError(password!==confirm?'Passwords do not match.':'Use at least 8 characters for your password.');return;}
    void perform(async()=>{
      if(mode==='signin')await auth.signIn(email,password,remember);
      if(mode==='signup')await auth.signUp(name,email,password);
      if(mode==='reset'){await auth.resetPassword(email);setNotice('If an account exists for this email, a password reset link has been requested. Check your inbox and spam folder.');}
      setPassword('');setConfirm('');
    });
  };
  const input='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-400';
  return <main className="min-h-dvh bg-slate-950 text-slate-100 px-4 py-8 flex items-center justify-center">
    <section className="w-full max-w-md space-y-6" aria-label={t("FitTrack sign in")}>
      <div className="flex items-center gap-3"><div className="p-3 bg-emerald-400 rounded-2xl text-slate-950"><Flame size={27}/></div><span className="text-xl font-black">{t("FitTrack")}</span></div>
      <div><h1 className="text-3xl font-bold">{t(auth.user?'Verify your email':mode==='signup'?'Start your fitness journey':mode==='reset'?'Reset your password':'Welcome to FitTrack')}</h1><p className="text-sm text-slate-400 mt-2">{t(auth.user?'Confirm your email before opening your account.':'Meals, movement, and progress in one place.')}</p></div>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
      {t(!auth.configured&&<p role="status" className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-200">{t("Account login is not activated yet. You can use this device offline while the app owner completes login setup.")}</p>)}
      {t(auth.user?<>
        <Mail className="text-emerald-300"/><p className="text-sm break-words">{t("Open the verification email for ")}<strong>{t(auth.user.email)}</strong>{t(", then return here.")}</p>
        <button disabled={busy} onClick={()=>perform(async()=>{if(!await auth.checkVerification())setNotice('Email is not verified yet. Open the link in your email, then check again.');})} className="w-full rounded-xl bg-emerald-400 p-3 font-bold text-slate-950 disabled:opacity-40">{t("I verified my email")}</button>
        <button disabled={busy} onClick={()=>perform(async()=>{await auth.resendVerification();setNotice('Verification email requested. Check your inbox and spam folder.');})} className="text-sm text-cyan-300 underline">{t("Resend verification email")}</button>
        <button disabled={busy} onClick={()=>perform(auth.logout)} className="block text-sm text-slate-300 underline">{t("Use another account")}</button>
      </>:<>
        {t(mode!=='reset'&&<div className="grid grid-cols-2 p-1 gap-1 rounded-xl bg-slate-950"><button type="button" onClick={()=>switchMode('signin')} className={`rounded-lg py-2 font-semibold text-sm ${mode==='signin'?'bg-slate-700 text-white':'text-slate-400'}`}>{t("Sign in")}</button><button type="button" onClick={()=>switchMode('signup')} className={`rounded-lg py-2 font-semibold text-sm ${mode==='signup'?'bg-slate-700 text-white':'text-slate-400'}`}>{t("Create account")}</button></div>)}
        {t(mode!=='reset'&&<>
          <button type="button" disabled={busy||!auth.configured} onClick={()=>perform(()=>auth.signInGoogle(remember))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 disabled:opacity-40">{t("Continue with Google")}</button>
          <p className="text-xs text-slate-400">{t("Choose your Google account to sign in or create an account. Google shares your basic profile and email with FitTrack. ")}<a href="/privacypolicy.html" target="_blank" rel="noreferrer" className="text-cyan-300 underline">{t("Privacy notice")}</a></p>
          <div className="text-center text-xs text-slate-500">{t("or continue with email")}</div>
        </>)}
        <form onSubmit={submit} className="space-y-4">
          {t(mode==='signup'&&<label className="block text-sm">{t("Your name")}<input className={input+' mt-1'} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required maxLength={100}/></label>)}
          <label className="block text-sm">{t("Email address")}<input className={input+' mt-1'} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={email} onChange={e=>setEmail(e.target.value)} required/></label>
          {t(mode!=='reset'&&<label className="block text-sm">{t("Password")}<div className="relative mt-1"><input className={input+' pe-12'} type={show?'text':'password'} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={mode==='signup'?8:undefined} required/><button type="button" aria-label={t(show?'Hide password':'Show password')} onClick={()=>setShow(!show)} className="absolute end-3 top-3 text-slate-400">{t(show?<EyeOff size={20}/>:<Eye size={20}/>)}</button></div></label>)}
          {t(mode==='signup'&&<><p className="text-xs text-slate-400">{t("Use at least 8 characters and a password you do not use elsewhere.")}</p><label className="block text-sm">{t("Confirm password")}<input className={input+' mt-1'} type={show?'text':'password'} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label><label className="flex items-start gap-2 text-xs text-slate-300"><input type="checkbox" className="mt-0.5 shrink-0" checked={privacy} onChange={e=>setPrivacy(e.target.checked)} required/><span>{t("I have read the ")}<a href="/privacypolicy.html" target="_blank" rel="noreferrer" className="text-cyan-300 underline">{t("privacy notice")}</a>{t(". My email and password are sent to Google Firebase to create my account.")}</span></label></>)}
          {t(mode==='signin'&&<div className="flex flex-wrap justify-between gap-3 text-xs"><label className="flex gap-2 items-center"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>{t("Keep me signed in")}</label><button type="button" className="text-cyan-300" onClick={()=>switchMode('reset')}>{t("Forgot password?")}</button></div>)}
          <button type="submit" disabled={busy||!auth.configured||(mode==='signup'&&!privacy)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-400 p-3 font-bold text-slate-950 disabled:opacity-40">{t(busy?'Please wait…':mode==='signin'?'Sign in':mode==='signup'?'Create my account':'Send reset email')}<ArrowRight size={18}/></button>
        </form>
        {t(mode==='reset'&&<button onClick={()=>switchMode('signin')} className="text-sm text-cyan-300">{t("Back to sign in")}</button>)}
        <button disabled={busy} onClick={auth.continueAsGuest} className="w-full text-sm text-slate-300 underline py-2">{t("Continue on this device without an account")}</button>
      </>)}
      {t(error&&<p role="alert" className="text-sm text-rose-300">{t(error)}</p>)}{t(notice&&<p role="status" className="text-sm text-cyan-200">{t(notice)}</p>)}
      </div>
      <p className="text-xs text-slate-400 flex gap-2 items-start"><ShieldCheck className="w-4 h-4 shrink-0"/>{t("Fitness logs stay on this device. Signing in does not upload them or enable Gemini. AI and health access have separate permission steps.")}</p>
    </section>
  </main>;
}
