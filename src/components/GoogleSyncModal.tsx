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
  const [cloudConsent, setCloudConsent] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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
    if (!canUseCloud || !cloudConsent || isSyncing) return;
    if (operation === 'save' && cloudSnapshot && !window.confirm(t('Replace the existing cloud backup with the fitness data on this device? Data from another device will be replaced.'))) return;
    if (operation === 'restore' && !window.confirm(t("Replace this device's profile and fitness records with the cloud backup? A pre-restore copy will be saved on this device. Export it afterward if needed."))) return;
    try {
      if (operation === 'check') { await refreshCloudBackup(); setSyncSuccessMsg('Cloud backup checked.'); }
      if (operation === 'save') { await syncWithCloud(); setSyncSuccessMsg('Cloud backup saved. Future changes need another backup.'); }
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[88dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t("Backup & Gemini")}</h2>
              <p className="text-xs text-slate-400">{t("Save your data and configure AI")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Status Badge Card */}
          <section className="space-y-3 rounded-xl border border-slate-700 p-3" aria-label={t("Cloud backup")}>
            <h3 className="text-sm font-semibold text-white">{t("Private cloud backup")}</h3>
            <p className="text-xs text-slate-400">{t("Your fitness data stays on this device until you choose Back up now. Each verified account has one private cloud backup. Passwords and Gemini API keys are excluded. Changes are not backed up automatically.")}</p>
            {t(canUseCloud ? <>
              <p className="text-xs text-slate-300 break-all">{t(user?.email)}</p>
              <label className="flex items-start gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={cloudConsent} onChange={e => setCloudConsent(e.target.checked)} disabled={isSyncing} className="mt-0.5" />
                <span>{t("I want to use private cloud backup for my profile and fitness records.")}</span>
              </label>
              <p role="status" className="text-xs text-amber-300">{t(cloudHasLocalChanges ? 'Local data needs a backup, or has not been backed up in this session.' : 'Local data matches the last backup saved or restored in this session.')}</p>
              {t(lastSyncedAt && <p className="text-xs text-slate-400">{t("Last backup saved or restored: ")}{t(new Date(lastSyncedAt).toLocaleString(localeTag()))}</p>)}
              {t(cloudSnapshot === null && <p className="text-xs text-slate-400">{t("No cloud backup exists for this account yet.")}</p>)}
              {t(cloudSnapshot && <p className="text-xs text-slate-400">{t("Cloud backup date: ")}{t(new Date(cloudSnapshot.updatedAt).toLocaleString(localeTag()))}</p>)}
              <button type="button" onClick={() => handleCloud('check')} disabled={!cloudConsent || isSyncing} className="w-full rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-cyan-300 disabled:opacity-40">{t(isSyncing ? 'Working…' : 'Check cloud backup')}</button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleCloud('save')} disabled={!cloudConsent || isSyncing || cloudSnapshot === undefined} className="rounded-xl bg-cyan-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{t("Back up now")}</button>
                <button type="button" onClick={() => handleCloud('restore')} disabled={!cloudConsent || isSyncing || !cloudSnapshot} className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{t("Restore cloud backup")}</button>
              </div>
              <p className="text-xs text-slate-400">{t("Check cloud backup first. Saving replaces the account's previous cloud copy; restoring replaces this device's records.")}</p>
            </> : <p className="text-xs text-amber-300">{t("Sign in with a verified account to use cloud backup. Guest data can still be exported below.")}</p>)}
          </section>
          <GeminiSetup />
          {t(syncSuccessMsg && <p role="status" className="text-xs text-emerald-300">{t(syncSuccessMsg)}</p>)}
          {t(importError && <p role="alert" className="text-xs text-rose-300">{t(importError)}</p>)}

          {/* Export & Import Offline Backups */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">{t("Offline Backup & Export")}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t(exporting ? 'Opening export…' : 'Export JSON')}</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t("Import Backup")}</span>
                <input type="file" accept=".json" onChange={handleImportFile} disabled={isSyncing} className="hidden" />
              </label>
            </div>

            <p className="text-xs text-slate-400">{t("Backups include your profile and fitness logs. Save them to a location you control.")}</p>
            {t(backupMessage && <p role="status" className="text-xs text-amber-300">{t(backupMessage)}</p>)}
            <button type="button" onClick={() => setBackupText(backupText ? '' : getBackupJSON())} className="text-xs text-cyan-300 underline">{t(backupText ? 'Hide backup text' : 'View / copy backup text')}</button>
            {t(backupText && <div className="space-y-2">
              <textarea aria-label={t("JSON backup text")} readOnly value={backupText} onFocus={e => e.currentTarget.select()} className="w-full h-40 p-2 rounded-xl bg-slate-950 text-xs text-slate-200 font-mono" />
              <button type="button" onClick={handleCopyBackup} className="text-xs text-cyan-300 underline">{t("Copy backup text")}</button>
            </div>)}
            {t(hasRecoveryBackup && <button type="button" onClick={async () => {
              try {
                const result = await exportRecoveryBackupJSON();
                setBackupMessage(result === 'share' ? 'Choose a destination and save the pre-restore copy.' : 'Pre-restore copy download requested. Check your Downloads.');
              } catch { setBackupMessage('The pre-restore copy could not be exported. Try again.'); }
            }} className="text-xs text-cyan-300 underline">{t("Export pre-restore copy")}</button>)}
          </div>
          {t(canUseCloud && <section className="space-y-2 border-t border-rose-900/60 pt-4" aria-label={t("Delete account")}>
            <h3 className="text-sm font-semibold text-rose-300">{t("Delete account")}</h3>
            <p className="text-xs text-slate-400">{t("This permanently deletes your login, private cloud backup, and this account's local fitness records. It does not delete guest records. Type DELETE to continue.")}</p>
            <input aria-label={t("Type DELETE to confirm")} value={deleteConfirmation} onChange={e=>setDeleteConfirmation(e.target.value)} placeholder={t("DELETE")} className="w-full rounded-xl border border-rose-900 bg-slate-950 px-3 py-2 text-sm" />
            <button type="button" disabled={!canConfirmAccountDeletion(deleteConfirmation)||isSyncing} onClick={async()=>{if(!window.confirm(t('Delete this account permanently? This cannot be undone.')))return;setImportError(null);try{await auth.deleteAccount();}catch(error){setImportError(cloudBackupError(error));}}} className="w-full rounded-xl bg-rose-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">{t("Delete my account")}</button>
          </section>)}
        </div>
      </motion.div>
    </div>
  );
};
