/* localized-render */
import { t, useLocale, localeTag, matchesLocalized } from "../utils/locale";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Cloud,
  Mail,
  X,
  CheckCircle2,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  ShieldCheck,
  Zap,
  Lock
} from 'lucide-react';
import { GeminiSetup } from './GeminiSetup';
import { useFitness } from '../context/FitnessContext';
import { useAuth } from '../context/AuthContext';
import { cloudBackupError } from '../utils/cloudBackup';
import { canConfirmAccountDeletion } from '../utils/account';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({ isOpen, onClose }) => {
  useLocale();
  const {
    profile,
    cloudSnapshot, cloudHasLocalChanges, refreshCloudBackup, restoreCloudBackup,
    hasRecoveryBackup, exportRecoveryBackupJSON,
    syncWithCloud,
    isSyncing,
    lastSyncedAt,
    exportBackupJSON,
    getBackupJSON,
    importBackupJSON
  } = useFitness();

  const auth = useAuth();
  const { user, guest } = auth;
  const canUseCloud = Boolean(user?.emailVerified && !guest);
  const [cloudConsent, setCloudConsent] = useState(true);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && canUseCloud && cloudSnapshot === undefined) {
      refreshCloudBackup().catch(() => {});
    }
  }, [isOpen, canUseCloud, cloudSnapshot]);

  const [exporting, setExporting] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [backupText, setBackupText] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true); setBackupMessage('');
    try {
      const result = await exportBackupJSON();
      setBackupMessage(result === 'share'
        ? 'Choose a destination and confirm the JSON file is saved there before uninstalling. Opening or canceling the share sheet is not a saved backup.'
        : 'Download requested. Check that the JSON file is in your Downloads before uninstalling.');
    } catch {
      setBackupMessage('Export was canceled or could not finish. You can view and copy the backup text below.');
      setBackupText(getBackupJSON());
    } finally { setExporting(false); }
  };
  const handleCopyBackup = async () => {
    try { await navigator.clipboard.writeText(backupText); setBackupMessage('Backup text copied. Paste it into a file or note you control and save it before uninstalling.'); }
    catch { setBackupMessage('Select the backup text and use your phone’s Copy command.'); }
  };

  const handleCloud = async (operation: 'check' | 'save' | 'restore') => {
    setSyncSuccessMsg(null); setImportError(null);
    if (!canUseCloud || isSyncing) return;
    if (operation === 'save' && cloudSnapshot && !window.confirm(t('Replace the existing cloud backup with the fitness data on this device? Data from another device will be replaced.'))) return;
    if (operation === 'restore' && !window.confirm(t("Replace this device's profile and fitness records with the cloud backup? A pre-restore copy will be saved on this device. Export it afterward if needed."))) return;
    try {
      if (operation === 'check') { await refreshCloudBackup(); setSyncSuccessMsg('Cloud backup checked.'); }
      if (operation === 'save') { await syncWithCloud(); setSyncSuccessMsg('Cloud backup saved to database successfully!'); }
      if (operation === 'restore') { await restoreCloudBackup(); setSyncSuccessMsg('Cloud backup restored on this device.'); }
    } catch (error) { setImportError(cloudBackupError(error)); }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    if (isSyncing || !window.confirm(t("Replace this device's profile and fitness records with this file? A pre-restore copy will be saved on this device."))) return;
    if (file.size > 20_000_000) { setImportError('This backup file is too large to import.'); return; }
    setSyncSuccessMsg(null); setImportError(null);
    const reader = new FileReader();
    reader.onerror = () => setImportError('The backup file could not be read.');
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackupJSON(content);
      if (success) {
        setSyncSuccessMsg('Backup imported successfully!');
        setTimeout(() => setSyncSuccessMsg(null), 3000);
      } else {
        setImportError('Backup could not be imported. Check its format and available device storage.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div
      id="google-sync-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[88dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">{t("Backup & Gemini")}</h2>
              <p className="text-xs text-slate-500 font-medium">{t("Save your data and configure AI")}</p>
            </div>
          </div>
          <button aria-label={t("Close")}
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Status Badge Card */}
          <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-2xs" aria-label={t("Cloud backup")}>
            <h3 className="text-sm font-bold text-slate-900">{t("Private cloud backup")}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t("Your fitness data stays on this device until you choose Back up now. Each verified account has one private cloud backup. Passwords and Gemini API keys are excluded. Changes are not backed up automatically.")}</p>
            {canUseCloud ? (
              <>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <Cloud className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{t("Connected to Firebase Cloud Database")}</span>
                </div>
                <p className="text-xs text-slate-700 font-medium break-all">{user?.email}</p>
                <label className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                  <input type="checkbox" checked={cloudConsent} onChange={e => setCloudConsent(e.target.checked)} disabled={isSyncing} className="mt-0.5 rounded accent-teal-600" />
                  <span>{t("I want to use private cloud backup for my profile and fitness records.")}</span>
                </label>
                <p role="status" className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 p-2 rounded-xl font-medium">{cloudHasLocalChanges ? t('Local data needs a backup, or has not been backed up in this session.') : t('Local data matches the last backup saved or restored in this session.')}</p>
                {lastSyncedAt && <p className="text-xs text-slate-500 font-medium">{t("Last backup saved or restored: ")}{new Date(lastSyncedAt).toLocaleString(localeTag())}</p>}
                {cloudSnapshot === null && <p className="text-xs text-slate-500">{t("No cloud backup exists for this account yet.")}</p>}
                {cloudSnapshot && <p className="text-xs text-slate-500">{t("Cloud backup date: ")}{new Date(cloudSnapshot.updatedAt).toLocaleString(localeTag())}</p>}
                <button type="button" onClick={() => handleCloud('check')} disabled={isSyncing} className="w-full rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 px-3 py-2 text-xs font-bold text-teal-700 disabled:opacity-40 shadow-2xs transition-all active:scale-95 cursor-pointer">{isSyncing ? t('Working…') : t('Check cloud backup')}</button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => handleCloud('save')} disabled={isSyncing} className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40 active:scale-95 transition-all shadow-xs cursor-pointer">{t("Back up now")}</button>
                  <button type="button" onClick={() => handleCloud('restore')} disabled={isSyncing || !cloudSnapshot} className="rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 px-3 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-40 active:scale-95 transition-all shadow-2xs cursor-pointer">{t("Restore cloud backup")}</button>
                </div>
                <p className="text-[11px] text-slate-500">{t("Saving backs up your profile, workouts, and meals to the cloud database.")}</p>
              </>
            ) : (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-medium">{t("Sign in with a verified account to use cloud backup. Guest data can still be exported below.")}</p>
            )}
          </section>
          <GeminiSetup />
          {t(syncSuccessMsg && <p role="status" className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-semibold">{t(syncSuccessMsg)}</p>)}
          {t(importError && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium">{t(importError)}</p>)}

          {/* Export & Import Offline Backups */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">{t("Offline Backup & Export")}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t(exporting ? 'Opening export…' : 'Export JSON')}</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-95 cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                <span>{t("Import Backup")}</span>
                <input type="file" accept=".json" onChange={handleImportFile} disabled={isSyncing} className="hidden" />
              </label>
            </div>

            <p className="text-[11px] text-slate-500">{t("Backups include your profile and fitness logs. Save them to a location you control.")}</p>
            {t(backupMessage && <p role="status" className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-xl font-medium">{t(backupMessage)}</p>)}
            <button type="button" onClick={() => setBackupText(backupText ? '' : getBackupJSON())} className="text-xs text-teal-600 hover:text-teal-700 font-semibold underline cursor-pointer">{t(backupText ? 'Hide backup text' : 'View / copy backup text')}</button>
            {t(backupText && <div className="space-y-2">
              <textarea aria-label={t("JSON backup text")} readOnly value={backupText} onFocus={e => e.currentTarget.select()} className="w-full h-40 p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-inner" />
              <button type="button" onClick={handleCopyBackup} className="text-xs text-teal-600 hover:text-teal-700 font-semibold underline cursor-pointer">{t("Copy backup text")}</button>
            </div>)}
            {t(hasRecoveryBackup && <button type="button" onClick={async () => {
              try {
                const result = await exportRecoveryBackupJSON();
                setBackupMessage(result === 'share' ? 'Choose a destination and save the pre-restore copy.' : 'Pre-restore copy download requested. Check your Downloads.');
              } catch { setBackupMessage('The pre-restore copy could not be exported. Try again.'); }
            }} className="text-xs text-teal-600 hover:text-teal-700 font-semibold underline cursor-pointer">{t("Export pre-restore copy")}</button>)}
          </div>
          {t(canUseCloud && <section className="space-y-2.5 border border-rose-200 bg-rose-50/60 rounded-2xl p-4 shadow-2xs" aria-label={t("Delete account")}>
            <h3 className="text-sm font-bold text-rose-800">{t("Delete account")}</h3>
            <p className="text-xs text-rose-700/90 leading-relaxed">{t("This permanently deletes your login, private cloud backup, and this account's local fitness records. It does not delete guest records. Type DELETE to continue.")}</p>
            <input aria-label={t("Type DELETE to confirm")} value={deleteConfirmation} onChange={e=>setDeleteConfirmation(e.target.value)} placeholder={t("DELETE")} className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-2xs" />
            <button type="button" disabled={!canConfirmAccountDeletion(deleteConfirmation)||isSyncing} onClick={async()=>{if(!window.confirm(t('Delete this account permanently? This cannot be undone.')))return;setImportError(null);try{await auth.deleteAccount();}catch(error){setImportError(cloudBackupError(error));}}} className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40 shadow-xs active:scale-95 transition-all cursor-pointer">{t("Delete my account")}</button>
          </section>)}
        </div>
      </motion.div>
    </div>
  );
};
