"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Login gagal");
        setLoading(false);
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError("Koneksi gagal");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/80 bg-white/90 p-8 shadow-panel backdrop-blur dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 rounded-xl bg-ink p-4">
              <ShieldCheck size={32} className="text-sea-300" />
            </div>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded" />
              <h1 className="text-xl font-black text-ink dark:text-white">SIGMA AIR</h1>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Admin Dashboard Login
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Password Admin
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  autoFocus
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium outline-none ring-sea-300 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-sea-700 disabled:opacity-50 dark:bg-sea-700 dark:hover:bg-sea-600"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-xs font-bold text-sea-700 hover:underline dark:text-sea-400">
              ← Kembali ke Beranda
            </a>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
          © 2026 SIGMA AIR. Akses admin hanya untuk pengelola.
        </p>
      </div>
    </main>
  );
}
