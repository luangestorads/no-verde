"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-bold mb-2">Algo deu errado</h2>
        <p className="text-muted-foreground mb-6">{error.message || "Erro inesperado"}</p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-verde-500 hover:bg-verde-600 text-white font-semibold rounded-xl transition-all"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}