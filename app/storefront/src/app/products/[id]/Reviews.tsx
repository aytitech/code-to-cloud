"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API, apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5`}>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export default function Reviews({ productId }: { productId: string }) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  async function loadReviews() {
    try {
      const data = await apiFetch<Review[]>(
        `${API.reviews}/api/products/${productId}/reviews`
      );
      setReviews(data);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }
    setSubmitting(true);
    setFormError("");
    setFormSuccess(false);
    try {
      await apiFetch(`${API.reviews}/api/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: Number(form.rating), comment: form.comment }),
      });
      setForm({ rating: 5, comment: "" });
      setFormSuccess(true);
      await loadReviews();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="bg-white rounded-xl shadow p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Reviews</h2>
        {average && (
          <span className="text-sm text-gray-500">
            {average} / 5 · {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading reviews...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && !error && reviews.length === 0 && (
        <p className="text-gray-400 text-sm">No reviews yet. Be the first to write one.</p>
      )}

      <ul className="space-y-4 mt-2">
        {reviews.map((r) => (
          <li key={r.id} className="border-b last:border-0 pb-4 last:pb-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{r.user_name}</span>
              <span className="text-xs text-gray-400">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="text-sm mt-1">
              <Stars rating={r.rating} />
            </div>
            <p className="text-gray-600 text-sm mt-1">{r.comment}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-6 border-t pt-4">
        <h3 className="font-medium mb-2">Write a review</h3>
        {formError && <p className="text-red-500 text-sm mb-2">{formError}</p>}
        {formSuccess && <p className="text-green-600 text-sm mb-2">Review submitted. Thank you!</p>}
        <div className="flex items-center gap-3 mb-2">
          <label className="text-sm text-gray-500" htmlFor="rating">Rating</label>
          <select
            id="rating"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            className="border rounded px-2 py-1 text-sm"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} ★</option>
            ))}
          </select>
        </div>
        <textarea
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          required
          rows={3}
          placeholder="What did you think?"
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit review"}
        </button>
      </form>
    </section>
  );
}
