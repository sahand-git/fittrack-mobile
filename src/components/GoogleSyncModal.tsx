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

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    profile,
    connectGoogleAccount,
    disconnectGoogleAccount,
    syncWithCloud,
    isSyncing,
    lastSyncedAt,
    exportBackupJSON,
    getBackupJSON,
    importBackupJSON
  } = useFitness();

  const [inputEmail, setInputEmail] = useState<string>(profile.email || '');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [backupText, setBackupText] = useState('');
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

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;

    const ok = await connectGoogleAccount(inputEmail.trim());
    if (ok) {
      setSyncSuccessMsg('Successfully linked account and synced data with the cloud!');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }
  };

  const handleManualSync = async () => {
    await syncWithCloud();
    setSyncSuccessMsg('Cloud backup updated successfully!');
    setTimeout(() => setSyncSuccessMsg(null), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackupJSON(content);
      if (success) {
        setSyncSuccessMsg('Backup imported successfully!');
        setTimeout(() => setSyncSuccessMsg(null), 3000);
      } else {
        setImportError('Invalid backup file format.');
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
              <h2 className="text-base font-bold text-white">Backup & Gemini</h2>
              <p className="text-xs text-slate-400">Save your data and configure AI</p>
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
          <p className="text-xs text-slate-400">Your data is saved on this device. Google account sign-in and cloud backup are not configured in this version. Entering an email does not connect a Google account.</p>
          <GeminiSetup />
          {syncSuccessMsg && <p role="status" className="text-xs text-emerald-300">{syncSuccessMsg}</p>}
          {importError && <p role="alert" className="text-xs text-rose-300">{importError}</p>}

          {/* Export & Import Offline Backups */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">Offline Backup & Export</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>{exporting ? 'Opening export…' : 'Export JSON'}</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Import Backup</span>
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>

            <p className="text-xs text-slate-400">Backups include your profile and fitness logs. Save them to a location you control.</p>
            {backupMessage && <p role="status" className="text-xs text-amber-300">{backupMessage}</p>}
            <button type="button" onClick={() => setBackupText(backupText ? '' : getBackupJSON())} className="text-xs text-cyan-300 underline">{backupText ? 'Hide backup text' : 'View / copy backup text'}</button>
            {backupText && <div className="space-y-2">
              <textarea aria-label="JSON backup text" readOnly value={backupText} onFocus={e => e.currentTarget.select()} className="w-full h-40 p-2 rounded-xl bg-slate-950 text-xs text-slate-200 font-mono" />
              <button type="button" onClick={handleCopyBackup} className="text-xs text-cyan-300 underline">Copy backup text</button>
            </div>}
            {profile.isGoogleConnected && (
              <button
                type="button"
                onClick={disconnectGoogleAccount}
                className="w-full py-2 text-xs text-rose-400 hover:text-rose-300 font-semibold text-center transition-colors"
              >
                Disconnect Cloud Sync
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
