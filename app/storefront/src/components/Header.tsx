"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, getToken } from "@/lib/auth";

interface StoredUser {
  id?: string;
  email?: string;
  name?: string;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const raw = localStorage.getItem("user");
      setUser(raw ? (JSON.parse(raw) as StoredUser) : { name: "" });
    } catch {
      setUser(null);
    }
  }, [pathname]);

  function handleLogout() {
    clearToken();
    setUser(null);
    router.push("/");
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          StackShop
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/cart" className="hover:text-indigo-600">Cart</Link>
          <Link href="/orders" className="hover:text-indigo-600">Orders</Link>
          {user ? (
            <>
              <Link href="/profile" className="font-medium text-indigo-600 hover:underline">
                {user.name || "Profile"}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-indigo-600">Login</Link>
              <Link
                href="/auth/register"
                className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
