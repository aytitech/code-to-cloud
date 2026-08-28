"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API, apiFetch } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function AddToCartButton({ product }: { product: Product }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleAddToCart() {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setStatus("loading");
    try {
      await apiFetch(`${API.cart}/api/cart/items`, {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
        }),
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={status === "loading" || status === "done"}
        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
        onClick={handleAddToCart}
      >
        {status === "loading" ? "Adding..." : status === "done" ? "Added!" : "Add to Cart"}
      </button>
      {status === "done" && (
        <a href="/cart" className="ml-4 text-indigo-600 text-sm underline">View cart</a>
      )}
      {status === "error" && (
        <p className="text-red-500 text-sm mt-2">Failed to add item. Please try again.</p>
      )}
    </div>
  );
}
