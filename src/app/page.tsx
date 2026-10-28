export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
        MindLoom
      </p>
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Изучайте темы как карту знаний
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-600">
          MindLoom поможет увидеть, какие понятия связаны между собой и что
          изучить сначала. Сейчас здесь подготовлен фундамент приложения на
          Next.js; генерация карт и остальные функции находятся в разработке.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-slate-700">
        <span className="rounded-full bg-slate-100 px-4 py-2">Граф знаний</span>
        <span className="rounded-full bg-slate-100 px-4 py-2">Прогресс</span>
        <span className="rounded-full bg-slate-100 px-4 py-2">Повторение</span>
        <span className="rounded-full bg-slate-100 px-4 py-2">Экспорт</span>
      </div>
    </main>
  );
}
