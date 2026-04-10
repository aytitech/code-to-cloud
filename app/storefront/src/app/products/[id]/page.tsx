import Link from "next/link";
import { API, INTERNAL_API } from "@/lib/api";
import AddToCartButton from "./AddToCartButton";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
  detail?: {
    long_description?: string;
    specifications?: Record<string, string>;
    additional_images?: string[];
  };
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${INTERNAL_API.products}/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Product not found.</p>
        <Link href="/" className="text-indigo-600 mt-4 inline-block">← Back to shop</Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="text-indigo-600 text-sm mb-4 inline-block">← Back to shop</Link>

      <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row gap-8">
        {product.image_url && (
          <img src={product.image_url} alt={product.name} className="w-full md:w-72 h-72 object-cover rounded" />
        )}
        <div className="flex-1">
          <span className="text-xs text-indigo-500 uppercase font-semibold">{product.category}</span>
          <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
          <p className="text-gray-600 mt-2">{product.description}</p>
          <p className="text-3xl font-bold text-indigo-600 mt-4">${product.price.toFixed(2)}</p>
          <p className="text-sm text-gray-400 mt-1">{product.stock} in stock</p>

          <AddToCartButton product={product} />
        </div>
      </div>

      {product.detail?.long_description && (
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h2 className="font-semibold text-lg mb-2">Description</h2>
          <p className="text-gray-600">{product.detail.long_description}</p>
        </div>
      )}

      {product.detail?.specifications && (
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h2 className="font-semibold text-lg mb-2">Specifications</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(product.detail.specifications).map(([k, v]) => (
              <>
                <dt key={`k-${k}`} className="font-medium text-gray-700">{k}</dt>
                <dd key={`v-${k}`} className="text-gray-500">{v}</dd>
              </>
            ))}
          </dl>
        </div>
      )}
    </main>
  );
}
