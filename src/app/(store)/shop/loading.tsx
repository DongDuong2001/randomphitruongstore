export default function ShopLoading() {
  return (
    <div className="container-shell py-12 sm:py-20">
      <header className="mb-12 max-w-3xl">
        <div className="h-3 w-48 animate-pulse bg-zinc-200" />
        <div className="mt-5 h-14 w-full max-w-xl animate-pulse bg-zinc-200 sm:h-20" />
        <div className="mt-6 h-4 w-full max-w-2xl animate-pulse bg-zinc-200" />
      </header>
      <div className="grid gap-7 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr] lg:gap-10 xl:gap-12">
        <aside className="hidden lg:block">
          <div className="h-8 w-32 animate-pulse bg-zinc-200" />
          <div className="mt-8 grid gap-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="h-12 animate-pulse bg-zinc-200" key={index} />
            ))}
          </div>
        </aside>
        <section className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-6 sm:gap-y-14 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="min-w-0 border-t border-black/20 pt-3" key={index}>
              <div className="aspect-[4/5] animate-pulse bg-zinc-200" />
              <div className="mt-4 h-3 w-2/5 animate-pulse bg-zinc-200" />
              <div className="mt-3 h-5 w-4/5 animate-pulse bg-zinc-200" />
              <div className="mt-3 h-4 w-1/3 animate-pulse bg-zinc-200" />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
