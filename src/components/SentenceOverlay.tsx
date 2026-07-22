export function SentenceOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
      <div className="text-center max-w-md mx-4">
        <div className="animate-spin mb-6 mx-auto w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />
        <h2 className="text-2xl font-bold text-amber-400 mb-3">
          Redactando Sentencia
        </h2>
        <p className="text-gray-400 text-sm">
          El tribunal esta evaluando los argumentos de la parte accionante
          para dictar la resolucion constitucional...
        </p>
        <p className="text-gray-600 text-xs mt-4">
          Este proceso puede tardar unos instantes
        </p>
      </div>
    </div>
  );
}
