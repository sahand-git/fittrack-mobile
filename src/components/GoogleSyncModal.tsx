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
    importBackupJSON
  } = useFitness();

  const [inputEmail, setInputEmail] = useState<string>(profile.email || '');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gmail Cloud Sync & Backup</h2>
              <p className="text-xs text-slate-400">Persistent storage & multi-device sync</p>
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
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-800/60 to-slate-800/40 border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Account Connection</span>
              {profile.isGoogleConnected ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Synced
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                  Local Cache Only
                </span>
              )}
            </div>

            {profile.isGoogleConnected && (
              <div className="space-y-1 pt-1">
                <span className="text-xs font-bold text-white block truncate">{profile.email}</span>
                <span className="text-[10px] text-slate-400 block">
                  Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            )}
          </div>

          {syncSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {/* Form to connect or change Gmail */}
          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {profile.isGoogleConnected ? 'Connected Gmail Account' : 'Connect Your Gmail Account'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="input-sync-email"
                  type="email"
                  required
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="e.g. sahandabas2@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="btn-sync-save"
                type="submit"
                disabled={isSyncing}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
              >
                <Cloud className="w-4 h-4" />
                <span>{profile.isGoogleConnected ? 'Update Cloud Link' : 'Connect & Sync Gmail'}</span>
              </button>

              {profile.isGoogleConnected && (
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleManualSync}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition-colors"
                  title="Force cloud sync now"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
                </button>
              )}
            </div>
          </form>

          {/* Export & Import Offline Backups */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">Offline Backup & Export</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={exportBackupJSON}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export JSON</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Import Backup</span>
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>

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
