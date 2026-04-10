"use client";

import { useEffect, useState } from "react";
import { API, apiFetch } from "@/lib/api";
import Link from "next/link";

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface Cart {
  items: CartItem[];
  total: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchCart() {
    try {
      const data = await apiFetch<Cart>(`${API.cart}/api/cart`);
      setCart(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCart(); }, []);

  async function removeItem(productId: string) {
    await apiFetch(`${API.cart}/api/cart/items/${productId}`, { method: "DELETE" });
    fetchCart();
  }

  async function clearCart() {
    await apiFetch(`${API.cart}/api/cart`, { method: "DELETE" });
    fetchCart();
  }

  async function checkout() {
    if (cart.items.length === 0) return;
    try {
      await apiFetch(`${API.orders}/api/orders`, {
        method: "POST",
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            product_id: i.productId,
            product_name: i.productName,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      });
      await clearCart();
      window.location.href = "/orders";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    }
  }

  if (loading) return <p className="text-center py-16">Loading cart...</p>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="text-indigo-600 text-sm mb-4 inline-block">← Continue shopping</Link>
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {cart.items.length === 0 ? (
        <p className="text-gray-500 text-center py-16">Cart is empty.</p>
      ) : (
        <>
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.productId} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-indigo-600">${cart.total.toFixed(2)}</span>
            </div>
            <button
              onClick={checkout}
              className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Place Order
            </button>
          </div>
        </>
      )}
    </main>
  );
}
