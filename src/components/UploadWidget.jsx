// Floating, always-on-top upload widget. Shows live progress for the active background upload and
// lets the user pause / resume / stop from anywhere in the admin app. Clicking the body opens the
// Uploads tab focused on this session. Rendered once at the app root (see main.jsx).
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpload } from '../context/UploadContext';

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

const UploadWidget = () => {
  const navigate = useNavigate();
  const { activeSession, stats, isPaused, pause, resume, stop } = useUpload();
  const [collapsed, setCollapsed] = useState(false);

  if (!activeSession) return null;

  const isDark = (localStorage.getItem('adminTheme') || 'light') === 'dark';
  const done = stats.completed + stats.failed;
  const pct = stats.total > 0 ? Math.round((done / stats.total) * 100) : 0;

  const shell = isDark
    ? 'bg-[#1F2A23] border-white/10 text-white shadow-black/40'
    : 'bg-white border-black/10 text-slate-900 shadow-black/10';
  const subtle = isDark ? 'text-white/60' : 'text-slate-500';
  const btn = isDark
    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
    : 'border-black/10 bg-white hover:bg-slate-50 text-slate-800';

  const openUploads = () => navigate(`/admin/uploads?session=${encodeURIComponent(activeSession.id)}`);

  const stopWithConfirm = (e) => {
    e.stopPropagation();
    if (window.confirm('Stop this upload? Files not yet uploaded will be skipped (you can retry later).')) {
      stop();
    }
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className={`fixed bottom-5 right-5 z-[2000] flex items-center gap-2 rounded-full border px-4 py-2.5 shadow-xl ${shell}`}
        aria-label="Show upload progress"
      >
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
        <span className="text-sm font-semibold">{isPaused ? 'Paused' : 'Uploading'} {done}/{stats.total}</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-5 right-5 z-[2000] w-[320px] rounded-2xl border shadow-2xl ${shell}`}>
      {/* header */}
      <div
        className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 cursor-pointer"
        onClick={openUploads}
        role="button"
        title="Open in Uploads"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-sm font-semibold truncate">
              {isPaused ? 'Upload paused' : 'Uploading'}
            </span>
          </div>
          <div className={`text-xs mt-0.5 truncate ${subtle}`}>{activeSession.eventName}</div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}
          className={`shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center ${btn}`}
          aria-label="Minimize"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 13H5" />
          </svg>
        </button>
      </div>

      {/* progress */}
      <div className="px-4">
        <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
          <div
            className={`h-full transition-all ${isPaused ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm font-semibold">{done}/{stats.total} ({pct}%)</div>
          <div className={`text-xs ${subtle}`}>{isPaused ? 'Paused' : formatTime(stats.timeRemaining)}</div>
        </div>
      </div>

      {/* counts */}
      <div className={`grid grid-cols-3 gap-2 px-4 mt-2 text-center`}>
        <div className={`rounded-lg border py-1.5 ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <div className="text-sm font-semibold">{stats.pending}</div>
          <div className={`text-[10px] uppercase tracking-wide ${subtle}`}>Pending</div>
        </div>
        <div className={`rounded-lg border py-1.5 ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <div className="text-sm font-semibold">{stats.uploading}</div>
          <div className={`text-[10px] uppercase tracking-wide ${subtle}`}>Enqueued</div>
        </div>
        <div className={`rounded-lg border py-1.5 ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <div className={`text-sm font-semibold ${stats.failed ? 'text-red-500' : ''}`}>{stats.failed}</div>
          <div className={`text-[10px] uppercase tracking-wide ${subtle}`}>Failed</div>
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center gap-2 px-4 py-3">
        {isPaused ? (
          <button type="button" onClick={(e) => { e.stopPropagation(); resume(); }}
            className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2">
            Resume
          </button>
        ) : (
          <button type="button" onClick={(e) => { e.stopPropagation(); pause(); }}
            className={`flex-1 rounded-lg border text-sm font-semibold py-2 ${btn}`}>
            Pause
          </button>
        )}
        <button type="button" onClick={stopWithConfirm}
          className="flex-1 rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 text-sm font-semibold py-2">
          Stop
        </button>
      </div>
    </div>
  );
};

export default UploadWidget;
