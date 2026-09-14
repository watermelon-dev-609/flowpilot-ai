export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-10 w-64 rounded-md bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-40 rounded-lg bg-slate-800" />
          <div className="h-40 rounded-lg bg-slate-800" />
          <div className="h-40 rounded-lg bg-slate-800" />
        </div>
        <div className="h-96 rounded-lg bg-slate-800" />
      </section>
    </main>
  );
}
