import React from 'react';

/**
 * Base shimmer block. Compose these to mirror real content layout so the
 * page doesn't jump when data arrives. Shimmer + dark styling live in
 * `.skeleton` (index.css) and adapt to `admin-theme-dark`.
 */
export function Skeleton({ className = '', rounded = 'rounded-lg', style }) {
  return <div className={`skeleton ${rounded} ${className}`} style={style} aria-hidden="true" />;
}

// A card wrapper matching the admin surface cards.
function Panel({ isDark, className = '', children }) {
  return (
    <div className={`rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/[0.08] bg-white'} ${className}`}>
      {children}
    </div>
  );
}

/* ---- KPI stat cards (dashboard / team header) ---- */
export function SkeletonStatCards({ isDark, count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Panel key={i} isDark={isDark} className="p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16 mt-3" />
        </Panel>
      ))}
    </div>
  );
}

/* ---- Projects homepage / dashboard ---- */
export function DashboardSkeleton({ isDark }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" aria-busy="true">
      <div className="xl:col-span-9 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Panel key={i} isDark={isDark} className="p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-14 mt-3" />
              <Skeleton className="h-3 w-16 mt-4" />
            </Panel>
          ))}
        </div>
        <Panel isDark={isDark} className="p-5">
          <Skeleton className="h-4 w-40" />
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`rounded-xl border p-4 ${isDark ? 'border-white/10' : 'border-black/[0.06]'}`}>
                <Skeleton className="h-28 w-full" rounded="rounded-lg" />
                <Skeleton className="h-4 w-3/4 mt-3" />
                <Skeleton className="h-3 w-1/2 mt-2" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="xl:col-span-3 space-y-6">
        <Panel isDark={isDark} className="p-5">
          <Skeleton className="h-4 w-28" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9" rounded="rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---- Projects grid (cards) ---- */
export function ProjectsGridSkeleton({ isDark, count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Panel key={i} isDark={isDark} className="overflow-hidden">
          <Skeleton className="h-40 w-full" rounded="rounded-none" />
          <div className="p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2 mt-2" />
            <div className="flex items-center gap-2 mt-4">
              <Skeleton className="h-8 w-20" rounded="rounded-lg" />
              <Skeleton className="h-8 w-8" rounded="rounded-lg" />
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

/* ---- Uploads page ---- */
export function UploadsSkeleton({ isDark }) {
  return (
    <div className="space-y-6" aria-busy="true">
      <Panel isDark={isDark} className="p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-40 w-full mt-4" rounded="rounded-xl" />
        <Skeleton className="h-10 w-36 mt-4" rounded="rounded-xl" />
      </Panel>
      <Panel isDark={isDark}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-20" rounded="rounded-lg" />
        </div>
        <div className="divide-y divide-black/5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24" rounded="rounded-full" />
                <Skeleton className="h-5 w-16" rounded="rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-2 w-full mt-3" rounded="rounded-full" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---- Storage table rows ---- */
export function StorageRowsSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-t border-transparent" aria-busy="true">
          <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-3 min-w-[140px]">
              <Skeleton className="flex-1 h-1.5" rounded="rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          </td>
          <td className="px-6 py-4"><Skeleton className="h-4 w-10" /></td>
          <td className="px-6 py-4"><Skeleton className="h-4 w-10" /></td>
          <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
        </tr>
      ))}
    </>
  );
}

/* ---- Team roster ---- */
export function TeamSkeleton({ isDark }) {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20" rounded="rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Panel key={i} isDark={isDark} className="p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12" rounded="rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2 mt-2" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Skeleton className="h-6 w-16" rounded="rounded-full" />
              <Skeleton className="h-6 w-20" rounded="rounded-full" />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ---- Notifications list ---- */
export function NotificationsSkeleton({ isDark }) {
  return (
    <Panel isDark={isDark} aria-busy="true">
      <div className="px-6 py-5 border-b border-black/5">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="divide-y divide-black/5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-start gap-4">
            <Skeleton className="h-10 w-10 shrink-0" rounded="rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default Skeleton;
