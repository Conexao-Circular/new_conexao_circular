export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando…</span>
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-40 rounded-lg bg-cc-green/10" />
        <div className="h-28 rounded-2xl bg-cc-green/10" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-2xl bg-cc-green/10" />
          <div className="h-20 rounded-2xl bg-cc-green/10" />
        </div>
        <div className="h-40 rounded-2xl bg-cc-green/10" />
        <div className="h-40 rounded-2xl bg-cc-green/10" />
      </div>
    </div>
  );
}
