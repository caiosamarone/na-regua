import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">Na Régua</h1>
      <p className="text-zinc-500 text-lg">Agendamento inteligente para sua barbearia</p>

      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="rounded-md bg-zinc-900 px-6 py-3 text-white hover:bg-zinc-700 transition-colors"
        >
          Entrar
        </Link>
        <a
          href="/agendar"
          className="rounded-md border border-zinc-300 px-6 py-3 text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Agendar horário
        </a>
      </div>
    </div>
  );
}
