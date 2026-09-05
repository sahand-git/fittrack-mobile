/* localized-render */
import { t, useLocale, localeTag, matchesLocalized } from "../utils/locale";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Download,
  X,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  useLocale();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if already installed / in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!standalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Listen for beforeinstallprompt on Android/Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show banner on iOS if not standalone
    if (ios && !standalone) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Floating Bottom App Install Bar on Mobile */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 start-4 end-4 z-40 max-w-md mx-auto bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl shadow-emerald-950/80 backdrop-blur-lg flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white truncate block">{t("Install NutriFit App")}</span>
            <span className="text-[11px] text-slate-300 truncate block">{t("Add to iPhone / Android Home Screen")}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-install-pwa"
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t("Install")}</span>
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Step-by-Step Installation Modal */}
      <AnimatePresence>
        {t(showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span>{t("How to Install NutriFit")}</span>
                </h3>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {t(isIOS ? (
                /* iOS iPhone Guide */
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                      <Share className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{t("Step 1: Tap Share")}</span>
                      <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">{t(" In Safari bottom toolbar, tap the ")}<strong>{t("Share")}</strong>{t(" button. ")}</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                      <PlusSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{t("Step 2: Add to Home Screen")}</span>
                      <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">{t(" Scroll down and tap ")}<strong>{t("\"Add to Home Screen\"")}</strong>.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Android / Chrome Guide */
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{t("Install via Chrome")}</span>
                      <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">{t(" Tap the three dots (⋮) in your Chrome browser and select ")}<strong>{t("\"Install app\"")}</strong>{t(" or ")}<strong>{t("\"Add to Home Screen\"")}</strong>.
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors"
              >{t(" Got It! ")}</button>
            </motion.div>
          </div>
        ))}
      </AnimatePresence>
    </>
  );
};
