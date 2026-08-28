import Link from "next/link";
import { API, INTERNAL_API } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${INTERNAL_API.products}/api/products`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-indigo-600">StackShop</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/cart" className="hover:text-indigo-600">Cart</Link>
          <Link href="/orders" className="hover:text-indigo-600">Orders</Link>
          <Link href="/auth/login" className="hover:text-indigo-600">Login</Link>
          <Link href="/auth/register" className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">Register</Link>
        </nav>
      </header>

      {/* Search bar */}
      <form action="/search" method="get" className="mb-8">
        <input
          name="q"
          type="search"
          placeholder="Search products..."
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </form>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-16">
          No products found. Make sure the backend services are running.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`}>
              <div className="bg-white rounded-xl shadow hover:shadow-md transition p-4 cursor-pointer">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover rounded mb-3" />
                )}
                <span className="text-xs text-indigo-500 uppercase font-semibold">{p.category}</span>
                <h2 className="font-semibold text-lg mt-1">{p.name}</h2>
                <p className="text-gray-500 text-sm line-clamp-2 mt-1">{p.description}</p>
                <p className="text-indigo-600 font-bold mt-3">${p.price.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
