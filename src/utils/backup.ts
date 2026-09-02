import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

type BackupTransport = {
  native?: boolean;
  writeFile?: typeof Filesystem.writeFile;
  share?: typeof Share.share;
};

export async function exportBackupFile(json: string, transport: BackupTransport = {}): Promise<'share' | 'download'> {
  const filename = `fittrack_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  if (transport.native ?? Capacitor.isNativePlatform()) {
    const file = await (transport.writeFile ?? Filesystem.writeFile)({
      path: `backups/${filename}`, data: json, directory: Directory.Cache,
      encoding: Encoding.UTF8, recursive: true
    });
    await (transport.share ?? Share.share)({ title: 'FitTrack backup',
      dialogTitle: 'Save your FitTrack backup', files: [file.uri] });
    // The share sheet cannot prove the user saved the file outside app storage.
    return 'share';
  }
  const url = URL.createObjectURL(new Blob([json], {type:'application/json'}));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'download';
}
