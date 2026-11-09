const event = {
  title: "Door List Live",
  date: "12 de diciembre de 2026",
  dateTime: "2026-12-12",
  venue: "Teatro Royal Center, Bogotá",
};

export default function Home() {
  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col px-6 sm:px-12">
      <header className="flex items-center gap-2.5 py-8 text-lg font-bold tracking-tight">
        <span aria-hidden="true" className="h-5 w-3 rounded-t-full border-2 border-lime-300" />
        door list<span className="text-lime-300">.</span>
      </header>
      <main className="flex flex-1 items-center py-12 sm:py-20">
        <section aria-labelledby="event-title" className="w-full overflow-hidden rounded-3xl border border-white/15 bg-neutral-900">
          <div className="grid md:grid-cols-[1.5fr_1fr]">
            <div className="p-8 sm:p-14">
              <p className="mb-8 text-xs font-semibold uppercase tracking-[0.25em] text-lime-300">Tu próximo encuentro</p>
              <h1 id="event-title" className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">{event.title}</h1>
              <dl className="mt-12 space-y-6">
                <div>
                  <dt className="mb-2 text-xs uppercase tracking-widest text-neutral-400">Fecha</dt>
                  <dd className="text-lg"><time dateTime={event.dateTime}>{event.date}</time></dd>
                </div>
                <div>
                  <dt className="mb-2 text-xs uppercase tracking-widest text-neutral-400">Lugar</dt>
                  <dd className="text-lg">{event.venue}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col justify-center border-t border-dashed border-white/20 bg-white/[0.025] p-8 sm:p-14 md:border-t-0 md:border-l">
              <span aria-hidden="true" className="mb-8 text-6xl text-lime-300">↗</span>
              <p className="mb-8 text-2xl font-medium tracking-tight">Nos vemos adentro.</p>
              <button type="button" className="min-h-14 w-full cursor-pointer rounded-xl bg-lime-300 px-6 py-4 text-base font-bold text-neutral-950 transition-colors hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300">
                Registrame
              </button>
            </div>
          </div>
        </section>
      </main>
      <footer className="pb-8 text-xs text-neutral-500">Door List · Eventos que nos conectan.</footer>
    </div>
  );
}
