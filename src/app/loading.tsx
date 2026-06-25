export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-verde-500/30 border-t-verde-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    </div>
  );
}