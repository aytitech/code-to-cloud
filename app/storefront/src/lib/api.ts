// Centralised service URLs — read from environment variables
export const API = {
  users:    process.env.NEXT_PUBLIC_USER_SERVICE_URL    ?? "http://localhost:8001",
  products: process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL ?? "http://localhost:8002",
  orders:   process.env.NEXT_PUBLIC_ORDER_SERVICE_URL   ?? "http://localhost:8003",
  cart:     process.env.NEXT_PUBLIC_CART_SERVICE_URL    ?? "http://localhost:8004",
  search:   process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL  ?? "http://localhost:8005",
  reviews:  process.env.NEXT_PUBLIC_REVIEW_SERVICE_URL  ?? "http://localhost:8006",
};

// Internal service URLs for server-side rendering (container-to-container networking)
export const INTERNAL_API = {
  products: process.env.INTERNAL_PRODUCT_SERVICE_URL ?? API.products,
  search:   process.env.INTERNAL_SEARCH_SERVICE_URL  ?? API.search,
};

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }

  return res.json();
}
