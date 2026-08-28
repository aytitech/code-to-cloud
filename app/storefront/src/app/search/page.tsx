import { API, INTERNAL_API } from "@/lib/api";
import Link from "next/link";

interface SearchResult {
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
  }>;
  total: number;
}

async function search(q: string): Promise<SearchResult> {
  try {
    const res = await fetch(`${INTERNAL_API.search}/api/search?q=${encodeURIComponent(q)}&limit=20`, {
      cache: "no-store",
    });
    if (!res.ok) return { products: [], total: 0 };
    return res.json();
  } catch {
    return { products: [], total: 0 };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? "";
  const result = await search(q);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/" className="text-indigo-600 text-sm mb-4 inline-block">← Back to shop</Link>
      <h1 className="text-2xl font-bold mb-2">Search results for "{q}"</h1>
      <p className="text-gray-500 text-sm mb-6">{result.total} product(s) found</p>

      {result.products.length === 0 ? (
        <p className="text-gray-500">No results found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`}>
              <div className="bg-white rounded-xl shadow hover:shadow-md transition p-4 cursor-pointer">
                <span className="text-xs text-indigo-500 uppercase font-semibold">{p.category}</span>
                <h2 className="font-semibold text-lg mt-1">{p.name}</h2>
                <p className="text-gray-500 text-sm line-clamp-2 mt-1">{p.description}</p>
                <p className="text-indigo-600 font-bold mt-3">${Number(p.price).toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
