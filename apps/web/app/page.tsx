// apps/web/app/page.tsx
import { getProducts } from "../lib/api";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900">SuperMarket Comparison</h1>
          <p className="text-gray-600 mt-2">Σύγκριση τιμών σε πραγματικό χρόνο</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Image Container */}
              <div className="h-48 bg-white flex items-center justify-center p-4 border-b border-gray-100">
                <img 
                  src={product.imageUrl || "/placeholder.png"} 
                  alt={product.name}
                  className="max-h-full object-contain"
                />
              </div>

              {/* Info Container */}
              <div className="p-4">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  {product.store?.chainId || "Store"}
                </span>
                <h3 className="text-sm font-medium text-gray-800 mt-1 line-clamp-2 h-10">
                  {product.name}
                </h3>
                
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {product.priceSnapshots[0]?.price}€
                  </span>
                  {product.priceSnapshots[0]?.promoPrice && (
                    <span className="text-sm text-red-500 line-through ml-2">
                      {product.priceSnapshots[1]?.price}€
                    </span>
                  )}
                </div>
                
                <p className="text-[10px] text-gray-400 mt-2 italic">
                  Τελευταία ενημέρωση: {new Date(product.priceSnapshots[0]?.collectedAt).toLocaleString('el-GR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}