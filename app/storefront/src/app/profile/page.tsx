"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API, apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface Profile {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/auth/login");
      return;
    }
    apiFetch<Profile>(`${API.users}/api/users/profile`)
      .then(setProfile)
      .catch(() => router.replace("/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <p className="text-center py-16">Loading profile...</p>;
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <Link href="/" className="text-indigo-600 text-sm mb-4 inline-block">← Back to shop</Link>
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      {profile && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg">{profile.name}</p>
              <p className="text-gray-500 text-sm">{profile.email}</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Joined {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </main>
  );
}
