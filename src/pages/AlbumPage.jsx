import React, { forwardRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import { fetchReviewInfo, fetchAlbumMoments, momentImageUrl, momentKey } from '../utils/deliveryApi';

/** A single flip page. react-pageflip requires pages to accept a ref. */
const Page = forwardRef(function Page({ children, className = '' }, ref) {
  return (
    <div ref={ref} className={`bg-[#fbf9f4] shadow-inner ${className}`}>
      {children}
    </div>
  );
});

function useBookSize() {
  const [size, setSize] = useState({ w: 420, h: 560 });
  useEffect(() => {
    const compute = () => {
      const vw = Math.min(window.innerWidth, 1100);
      const vh = window.innerHeight;
      // single page width; keep a 3:4 portrait ratio, bounded by viewport height
      let w = Math.floor((vw - 48) / (window.innerWidth >= 768 ? 2 : 1));
      w = Math.min(w, 520);
      let h = Math.floor(w * 1.33);
      if (h > vh - 160) {
        h = vh - 160;
        w = Math.floor(h / 1.33);
      }
      setSize({ w, h });
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return size;
}

/**
 * Public, view-only album page. Renders the client's finalized, chronological selection as a
 * physical-feeling book with page-turn animation (react-pageflip).
 */
export default function AlbumPage() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { w, h } = useBookSize();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [meta, list] = await Promise.all([
          fetchReviewInfo(token).catch(() => null),
          fetchAlbumMoments(token),
        ]);
        if (cancelled) return;
        setInfo(meta);
        setMoments(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setError('This album link is invalid or not ready yet.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2a1f26] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#e8c9d6]" />
      </div>
    );
  }

  if (error || moments.length === 0) {
    return (
      <div className="min-h-screen bg-[#2a1f26] flex items-center justify-center p-8 text-center">
        <p className="text-lg text-[#e8c9d6] font-medium">
          {error || 'This album is not ready yet. Please check back once the selection is finalized.'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2a1f26] to-[#160f13] flex flex-col items-center justify-center py-8 px-4">
      <p className="text-[#e8c9d6]/70 text-sm mb-4">Drag or tap the page edge to turn</p>
      <HTMLFlipBook
        width={w}
        height={h}
        size="fixed"
        minWidth={280}
        maxWidth={560}
        minHeight={360}
        maxHeight={760}
        drawShadow
        maxShadowOpacity={0.5}
        showCover
        mobileScrollSupport
        className="album-book"
      >
        {/* Cover */}
        <Page className="flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-[#67143A] to-[#3d0c22]">
          {info?.eventThumbnail ? (
            <img
              src={info.eventThumbnail}
              alt=""
              className="w-28 h-28 rounded-full object-cover ring-4 ring-white/20 mb-6"
            />
          ) : null}
          <h1 className="text-3xl font-serif text-white tracking-wide">{info?.eventName || 'Our Album'}</h1>
          {info?.eventDate ? <p className="text-white/70 mt-2">{info.eventDate}</p> : null}
        </Page>

        {/* Photo pages */}
        {moments.map((m) => (
          <Page key={momentKey(m)} className="flex items-center justify-center p-3">
            <img
              src={momentImageUrl(m)}
              alt=""
              loading="lazy"
              className="max-w-full max-h-full object-contain rounded-sm shadow"
              draggable={false}
            />
          </Page>
        ))}

        {/* Back cover */}
        <Page className="flex items-center justify-center bg-gradient-to-br from-[#3d0c22] to-[#67143A]">
          <span className="text-white/70 font-serif text-xl">Fin</span>
        </Page>
      </HTMLFlipBook>
    </div>
  );
}
