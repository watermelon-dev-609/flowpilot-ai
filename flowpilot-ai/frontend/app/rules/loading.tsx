export default function RulesLoading() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div>
          <p className="text-sm text-emerald-300">规则中心加载中</p>
          <div className="mt-3 h-12 w-64 rounded-md bg-slate-800" />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-80 rounded-lg bg-slate-800" />
          <div className="h-80 rounded-lg bg-slate-800" />
        </div>
        <div className="h-48 rounded-lg bg-slate-800" />
      </section>
    </main>
  );
}
