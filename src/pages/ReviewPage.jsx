import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, Heart, CheckCircle2 } from 'lucide-react';
import {
  fetchReviewInfo,
  fetchReviewFeed,
  setClientSelection,
  finalizeAlbum,
  momentImageUrl,
  momentKey,
} from '../utils/deliveryApi';

const PAGE = 60;

/**
 * Public, phone-first review page (no login). Bride/groom open a shared link, then
 * select or reject each photographer-approved photo. Finalizing unlocks the album page.
 */
export default function ReviewPage() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [moments, setMoments] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  // momentId -> 'SELECTED' | 'REJECTED' | 'PENDING'
  const [picks, setPicks] = useState({});
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);

  const selectedCount = useMemo(
    () => Object.values(picks).filter((v) => v === 'SELECTED').length,
    [picks],
  );

  const loadPage = useCallback(
    async (nextOffset) => {
      const feed = await fetchReviewFeed(token, { offset: nextOffset, limit: PAGE });
      const list = feed?.moments || [];
      setMoments((prev) => (nextOffset === 0 ? list : [...prev, ...list]));
      setPicks((prev) => {
        const merged = { ...prev };
        for (const m of list) {
          const k = momentKey(m);
          if (merged[k] === undefined) merged[k] = m.clientSelection || 'PENDING';
        }
        return merged;
      });
      setHasMore(list.length >= PAGE);
      setOffset(nextOffset + list.length);
    },
    [token],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const meta = await fetchReviewInfo(token);
        if (cancelled) return;
        setInfo(meta);
        setFinalized(!!meta?.albumFinalized);
        await loadPage(0);
      } catch (e) {
        if (!cancelled) setError('This review link is invalid or has expired.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, loadPage]);

  const choose = async (moment, selection) => {
    const k = momentKey(moment);
    const prev = picks[k] || 'PENDING';
    const next = prev === selection ? 'PENDING' : selection; // tap again to undo
    setPicks((p) => ({ ...p, [k]: next })); // optimistic
    try {
      await setClientSelection(token, moment.momentId || moment.id, next);
    } catch {
      setPicks((p) => ({ ...p, [k]: prev })); // rollback
    }
  };

  const onFinalize = async () => {
    if (selectedCount === 0) return;
    try {
      setFinalizing(true);
      await finalizeAlbum(token);
      setFinalized(true);
    } catch {
      setError('Could not finalize. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await loadPage(offset);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5ef] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#67143A]" />
      </div>
    );
  }

  if (error && moments.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f5ef] flex items-center justify-center p-8 text-center">
        <p className="text-lg text-[#67143A] font-medium">{error}</p>
      </div>
    );
  }

  const albumUrl = `${window.location.origin}/album/${token}`;

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#2a2320] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#f7f5ef]/90 backdrop-blur border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          {info?.eventThumbnail ? (
            <img src={info.eventThumbnail} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : null}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">{info?.eventName || 'Your Gallery'}</h1>
            <p className="text-xs text-black/50">
              {finalized ? 'Selection finalized' : 'Tap ♥ to keep a photo, ✕ to skip'}
            </p>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-5xl mx-auto px-3 pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {moments.map((m) => {
            const k = momentKey(m);
            const pick = picks[k] || 'PENDING';
            const selected = pick === 'SELECTED';
            const rejected = pick === 'REJECTED';
            return (
              <div
                key={k}
                className={`relative rounded-2xl overflow-hidden bg-white shadow-sm ring-2 transition-all ${
                  selected ? 'ring-[#67143A]' : rejected ? 'ring-red-300 opacity-60' : 'ring-transparent'
                }`}
              >
                <img
                  src={momentImageUrl(m)}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-square object-cover"
                />
                {selected && (
                  <div className="absolute top-2 left-2 bg-[#67143A] text-white rounded-full p-1">
                    <CheckCircle2 size={16} />
                  </div>
                )}
                {!finalized && (
                  <div className="absolute bottom-0 inset-x-0 flex">
                    <button
                      onClick={() => choose(m, 'REJECTED')}
                      className={`flex-1 py-3 flex items-center justify-center backdrop-blur transition-colors ${
                        rejected ? 'bg-red-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'
                      }`}
                      aria-label="Skip photo"
                    >
                      <X size={20} />
                    </button>
                    <button
                      onClick={() => choose(m, 'SELECTED')}
                      className={`flex-1 py-3 flex items-center justify-center backdrop-blur transition-colors ${
                        selected ? 'bg-[#67143A] text-white' : 'bg-black/30 text-white hover:bg-black/50'
                      }`}
                      aria-label="Keep photo"
                    >
                      <Heart size={20} fill={selected ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="flex justify-center py-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2 rounded-full border border-black/10 bg-white text-sm font-medium disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </main>

      {/* Sticky action bar */}
      {!finalized ? (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-black/5 bg-white/95 backdrop-blur">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="text-sm">
              <span className="font-semibold text-[#67143A]">{selectedCount}</span> selected
            </div>
            <button
              onClick={onFinalize}
              disabled={selectedCount === 0 || finalizing}
              className="px-6 py-3 rounded-full bg-[#67143A] text-white font-semibold disabled:opacity-40 flex items-center gap-2"
            >
              <Check size={18} />
              {finalizing ? 'Finalizing…' : 'Finalize selection'}
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-black/5 bg-white/95 backdrop-blur">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="text-sm text-black/60">Your album is ready.</div>
            <a
              href={albumUrl}
              className="px-6 py-3 rounded-full bg-[#67143A] text-white font-semibold"
            >
              View Album
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
