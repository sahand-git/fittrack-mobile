import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { completeGoogleLogin } from '../utils/googleLogin';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut, reload, updateProfile,
  setPersistence, browserLocalPersistence, browserSessionPersistence, indexedDBLocalPersistence,
  initializeAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup, type User } from 'firebase/auth';
import config from '../config/firebase.json';
import { clearGeminiKey } from '../utils/gemini';

const configured = Boolean(config.apiKey && config.projectId && config.authDomain && config.appId);
const app = configured ? initializeApp(config) : null;
const auth = app ? (Capacitor.isNativePlatform() ? initializeAuth(app,{persistence:indexedDBLocalPersistence}) : getAuth(app)) : null;
const durablePersistence = Capacitor.isNativePlatform() ? indexedDBLocalPersistence : browserLocalPersistence;
const guestKey = 'fittrack_guest_mode_v1';
type AuthState = {
  user: User | null; guest: boolean; ready: boolean; configured: boolean;
  signIn: (email:string,password:string,remember:boolean)=>Promise<void>;
  signUp: (name:string,email:string,password:string)=>Promise<void>;
  signInGoogle: (remember:boolean)=>Promise<void>;
  resetPassword: (email:string)=>Promise<void>;
  resendVerification: ()=>Promise<void>; checkVerification: ()=>Promise<boolean>;
  continueAsGuest: ()=>void; logout: ()=>Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({children}:{children:React.ReactNode}) {
  const [user,setUser]=useState<User|null>(null);
  const [ready,setReady]=useState(!auth);
  const [guest,setGuest]=useState(()=>{try{return localStorage.getItem(guestKey)==='true';}catch{return false;}});
  const [,setRevision]=useState(0);
  const stopGuest=()=>{setGuest(false);localStorage.removeItem(guestKey);};
  useEffect(()=>{
    if (!auth) return;
    return onAuthStateChanged(auth, next=>{clearGeminiKey();setUser(next);if(next)stopGuest();setReady(true);},()=>{setUser(null);setReady(true);});
  },[]);
  const requireAuth=()=>{if(!auth)throw new Error('Login setup is not finished.');return auth;};
  const value:AuthState={user,guest,ready,configured,
    signIn:async(email,password,remember)=>{const service=requireAuth();await setPersistence(service,remember?durablePersistence:browserSessionPersistence);await signInWithEmailAndPassword(service,email.trim(),password);stopGuest();},
    signUp:async(name,email,password)=>{const service=requireAuth();await setPersistence(service,durablePersistence);const result=await createUserWithEmailAndPassword(service,email.trim(),password);stopGuest();await updateProfile(result.user,{displayName:name.trim()});await sendEmailVerification(result.user);setRevision(n=>n+1);},
    signInGoogle:async(remember)=>{
      const service=requireAuth();
      await setPersistence(service,remember?durablePersistence:browserSessionPersistence);
      const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
      await completeGoogleLogin(Capacitor.isNativePlatform(),{
        chooseNativeAccount:()=>FirebaseAuthentication.signInWithGoogle({skipNativeAuth:true}),
        verifyIdToken:token=>signInWithCredential(service,GoogleAuthProvider.credential(token)),
        openWebSignIn:()=>signInWithPopup(service,provider),
      });
      stopGuest();
    },
    resetPassword:async(email)=>{await sendPasswordResetEmail(requireAuth(),email.trim());},
    resendVerification:async()=>{const current=requireAuth().currentUser;if(!current)throw new Error('Sign in first.');await sendEmailVerification(current);},
    checkVerification:async()=>{const current=requireAuth().currentUser;if(!current)return false;await reload(current);await current.getIdToken(true);setUser(current);setRevision(n=>n+1);return current.emailVerified;},
    continueAsGuest:()=>{if(user)return;clearGeminiKey();localStorage.setItem(guestKey,'true');setGuest(true);},
    logout:async()=>{
      if(auth)await signOut(auth);
      clearGeminiKey();stopGuest();setUser(null);
      // Native auth is skipped, but discard Google's cached chooser credentials too.
      if(Capacitor.isNativePlatform())await FirebaseAuthentication.signOut().catch(()=>{});
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('Missing AuthProvider');return value;}
