"use client";

import { useEffect, useState } from "react";
import { API, apiFetch } from "@/lib/api";
import Link from "next/link";

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Order[]>(`${API.orders}/api/orders`)
      .then(setOrders)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-16">Loading orders...</p>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="text-indigo-600 text-sm mb-4 inline-block">← Back to shop</Link>
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-400">#{order.id.slice(0, 8)}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  order.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                }`}>
                  {order.status}
                </span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {order.items.map((item, i) => (
                  <li key={i}>{item.product_name} × {item.quantity}</li>
                ))}
              </ul>
              <div className="flex justify-between mt-3 font-bold">
                <span className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                <span className="text-indigo-600">${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
