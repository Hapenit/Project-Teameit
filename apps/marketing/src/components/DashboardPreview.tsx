export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-navy-950 shadow-glow">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 text-xs text-slate-400">TEAMeIT workspace</span>
      </div>
      <div className="grid min-h-[280px] grid-cols-12 bg-gradient-to-br from-navy-900 to-navy-800">
        <aside className="col-span-3 hidden space-y-2 border-r border-white/10 p-4 text-xs text-slate-400 sm:block">
          {['Overview', 'Publishing', 'Inbox', 'Campaigns', 'Automation', 'Analytics'].map((item, i) => (
            <div
              key={item}
              className={`rounded-md px-2 py-1.5 ${i === 0 ? 'bg-white/10 text-white' : ''}`}
            >
              {item}
            </div>
          ))}
        </aside>
        <div className="col-span-12 space-y-4 p-4 sm:col-span-9">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Queued posts', '12'],
              ['Open conversations', '48'],
              ['Active workflows', '6'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">{label}</p>
                <p className="mt-1 text-xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-300">Content calendar</p>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-8 rounded ${i === 4 || i === 9 ? 'bg-accent-indigo/70' : 'bg-white/10'}`}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-300">Inbox</p>
              <div className="mt-3 space-y-2">
                {['Facebook Page comment', 'WhatsApp conversation', 'Email thread'].map((row) => (
                  <div key={row} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300">
                    <span>{row}</span>
                    <span className="text-accent-blue">Open</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
