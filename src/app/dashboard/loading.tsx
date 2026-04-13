export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#f5f2ed] animate-pulse">
      <header className="sticky top-0 z-10 border-b border-amber-200/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="h-6 w-24 rounded bg-slate-200" />
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded bg-slate-200" />
            <div className="h-8 w-16 rounded bg-slate-200" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <div className="h-8 w-64 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-48 rounded bg-slate-100" />
        </div>

        <div className="space-y-8">
          <div className="h-24 rounded-xl bg-white" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white" />
            ))}
          </div>
          <div className="h-48 rounded-xl bg-white" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 rounded-xl bg-white" />
            <div className="h-64 rounded-xl bg-white" />
          </div>
        </div>
      </main>
    </div>
  );
}
