export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
      <div className="relative">
        {/* Animated Cart Icon */}
        <div className="text-6xl animate-bounce mb-4">🛒</div>
        
        {/* Spinner ring around it */}
        <div className="absolute -inset-4 border-4 border-indigo-100 rounded-full w-24 h-24 animate-spin border-t-indigo-600"></div>
      </div>
      
      <h2 className="text-xl font-black text-indigo-900 mt-8 tracking-tight animate-pulse">
        MARKETWISE
      </h2>
      <p className="text-slate-500 text-sm font-medium mt-2">
        Φορτώνουμε τις καλύτερες τιμές...
      </p>
    </div>
  );
}