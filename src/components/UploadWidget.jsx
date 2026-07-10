// Live upload progress tiles. One tile per active upload — computer sessions (client worker pool)
// and Google Drive imports (server-driven, polled) share the same look and controls. Two variants:
//   - floating (default): fixed bottom-right stack, mounted once at the app root (see main.jsx) so it
//     follows the user across tabs; hidden on the Uploads tab where the inline stack is shown.
//   - inline (`inline` prop): the same tiles in normal page flow, used by the Uploads tab. Clicking a
//     tile pops it out — navigates off the tab so the floating stack takes over, sticky bottom-right.
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUpload } from '../context/UploadContext';

const formatBytes = (bytes) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '0 MB';
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
};

const formatSpeed = (bytesPerSec) => {
  const n = Number(bytesPerSec);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB/s`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB/s`;
  return `${Math.round(n)} B/s`;
};

const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return 'Estimating…';
  if (seconds <= 0) return 'Almost done';
  if (seconds < 60) return `${seconds}s left`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s left`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m left`;
};

const UploadTile = ({ u, isDark, onPause, onResume, onStop, onPopOut }) => {
  const isDrive = u.kind === 'drive';
  const done = (u.done || 0) + (u.failed || 0);
  const pct = u.total > 0 ? Math.round((done / u.total) * 100) : 0;

  const shell = isDark
    ? 'bg-[#1F2A23] border-white/10 text-white shadow-black/40'
    : 'bg-white border-black/10 text-slate-900 shadow-black/10';
  const subtle = isDark ? 'text-white/60' : 'text-slate-500';
  const btn = isDark
    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
    : 'border-black/10 bg-white hover:bg-slate-50 text-slate-800';
  const pill = isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-slate-600';

  const stop = (e) => { e.stopPropagation(); onStop(u); };
  const pause = (e) => { e.stopPropagation(); onPause(u); };
  const resume = (e) => { e.stopPropagation(); onResume(u); };

  return (
    <div
      className={`w-[320px] max-w-full rounded-2xl border shadow-xl ${shell} ${onPopOut ? 'cursor-pointer' : ''}`}
      onClick={onPopOut}
      role={onPopOut ? 'button' : undefined}
      title={onPopOut ? 'Pop out — keep watching while you work' : undefined}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${u.isPaused ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-sm font-semibold truncate">{u.isPaused ? 'Paused' : 'Uploading'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${pill}`}>{isDrive ? 'Drive' : 'Computer'}</span>
          </div>
          <div className={`text-xs mt-0.5 truncate ${subtle}`}>{u.eventName}</div>
        </div>
      </div>

      {/* progress */}
      <div className="px-4">
        <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
          <div className={`h-full transition-all ${u.isPaused ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm font-semibold">{done}/{u.total} ({pct}%)</div>
          <div className={`text-xs ${subtle}`}>{u.isPaused ? 'Paused' : (isDrive ? '' : formatTime(u.timeRemaining))}</div>
        </div>
        {!isDrive && u.totalBytes > 0 ? (
          <div className={`flex items-center justify-between mt-1 text-xs ${subtle}`}>
            <span>{formatBytes(u.uploadedBytes)} / {formatBytes(u.totalBytes)}</span>
            <span>{u.isPaused ? '' : (formatSpeed(u.speedBps) || '')}</span>
          </div>
        ) : null}
      </div>

      {/* counts */}
      <div className="grid grid-cols-3 gap-2 px-4 mt-2 text-center">
        <div className={`rounded-lg border py-1.5 ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <div className="text-sm font-semibold">{u.pending}</div>
          <div className={`text-[10px] uppercase tracking-wide ${subtle}`}>Pending</div>
        </div>
        <div className={`rounded-lg border py-1.5 ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <div className="text-sm font-semibold">{isDrive ? u.done : u.enqueued}</div>
          <div className={`text-[10px] uppercase tracking-wide ${subtle}`}>{isDrive ? 'Done' : 'Enqueued'}</div>
        </div>
        <div className={`rounded-lg border py-1.5 ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <div className={`text-sm font-semibold ${u.failed ? 'text-red-500' : ''}`}>{u.failed}</div>
          <div className={`text-[10px] uppercase tracking-wide ${subtle}`}>Failed</div>
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center gap-2 px-4 py-3">
        {u.isPaused ? (
          <button type="button" onClick={resume}
            className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2">
            Resume
          </button>
        ) : (
          <button type="button" onClick={pause}
            className={`flex-1 rounded-lg border text-sm font-semibold py-2 ${btn}`}>
            Pause
          </button>
        )}
        <button type="button" onClick={stop}
          className="flex-1 rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 text-sm font-semibold py-2">
          {isDrive ? 'Cancel' : 'Stop'}
        </button>
      </div>
    </div>
  );
};

const UploadWidget = ({ inline = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeUploads, pauseUpload, resumeUpload, stopUpload } = useUpload();

  if (!activeUploads || activeUploads.length === 0) return null;
  // The Uploads tab renders its own inline stack, so the floating one steps aside there.
  if (!inline && location.pathname.startsWith('/admin/uploads')) return null;

  const isDark = (localStorage.getItem('adminTheme') || 'light') === 'dark';

  const stopWithConfirm = (u) => {
    const msg = u.kind === 'drive'
      ? 'Cancel this Drive import? It will stop after the current batch.'
      : 'Stop this upload? Files not yet uploaded will be skipped (you can retry later).';
    if (window.confirm(msg)) stopUpload(u);
  };

  // Inline tiles pop out to the floating stack; floating tiles have no pop-out click.
  const popOut = inline ? () => navigate('/admin/homepage') : undefined;

  const tiles = activeUploads.map((u) => (
    <UploadTile
      key={`${u.kind}-${u.id}`}
      u={u}
      isDark={isDark}
      onPause={pauseUpload}
      onResume={resumeUpload}
      onStop={stopWithConfirm}
      onPopOut={popOut}
    />
  ));

  if (inline) {
    return <div className="flex flex-col gap-3">{tiles}</div>;
  }
  return (
    <div className="fixed bottom-5 right-5 z-[2000] flex flex-col gap-3 max-h-[85vh] overflow-y-auto pr-0.5">
      {tiles}
    </div>
  );
};

export default UploadWidget;
