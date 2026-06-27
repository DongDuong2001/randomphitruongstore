export default function AdminPanelLoading() {
  return (
    <div className="animate-pulse">
      <header>
        <div className="h-3 w-24 bg-zinc-200" />
        <div className="mt-3 h-10 w-56 bg-zinc-200" />
      </header>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="min-h-32 border border-zinc-200 bg-white p-5"
            key={index}
          >
            <div className="h-3 w-28 bg-zinc-200" />
            <div className="mt-10 h-9 w-20 bg-zinc-200" />
          </div>
        ))}
      </section>
      <section className="mt-8 border border-zinc-200 bg-white">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            className="grid gap-4 border-b border-zinc-100 p-4 sm:grid-cols-5"
            key={index}
          >
            <div className="h-4 bg-zinc-200 sm:col-span-2" />
            <div className="h-4 bg-zinc-200" />
            <div className="h-4 bg-zinc-200" />
            <div className="h-4 bg-zinc-200" />
          </div>
        ))}
      </section>
    </div>
  );
}
