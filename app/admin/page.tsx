"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronUp,
  Eye,
  Globe2,
  Loader2,
  MapPin,
  Moon,
  RefreshCw,
  Send,
  Shield,
  Sun,
  Trash2,
  Users,
  LogOut,
  Download,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { regions as staticRegions, type RegionStatus } from "@/lib/data";

type Tab = "overview" | "reports" | "regions" | "alerts";

type DBReport = {
  id: string;
  region_id: string;
  description: string;
  media_url: string | null;
  confidence: number;
  created_at: string;
};

type Stats = {
  totalReports: number;
  pushSubscribers: number;
  telegramSubscribers: number;
  regionsCount: number;
};

export default function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [reports, setReports] = useState<DBReport[]>([]);
  const [regions, setRegions] = useState<RegionStatus[]>(staticRegions);
  const [stats, setStats] = useState<Stats>({ totalReports: 0, pushSubscribers: 0, telegramSubscribers: 0, regionsCount: 5 });
  const [loading, setLoading] = useState(true);
  const [alertForm, setAlertForm] = useState({ regionId: staticRegions[0].id, message: "" });
  const [alertSending, setAlertSending] = useState(false);
  const [alertResult, setAlertResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  function exportCSV() {
    if (reports.length === 0) return;
    const header = "ID,Wilayah,Deskripsi,Media URL,Confidence,Waktu\n";
    const rows = reports.map(r =>
      `"${r.id}","${r.region_id}","${r.description.replace(/"/g, '""')}","${r.media_url ?? ''}",${r.confidence},"${r.created_at}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-sigma-air-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    return () => document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load reports
      const { data: reps } = await supabase
        .from("citizen_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (reps) setReports(reps);

      // Load stats
      const { count: reportCount } = await supabase
        .from("citizen_reports")
        .select("*", { count: "exact", head: true });

      const { count: pushCount } = await supabase
        .from("push_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

      const { count: telegramCount } = await supabase
        .from("telegram_subscribers")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

      setStats({
        totalReports: reportCount ?? 0,
        pushSubscribers: pushCount ?? 0,
        telegramSubscribers: telegramCount ?? 0,
        regionsCount: regions.length,
      });

      // Try load regions from DB
      const { data: dbRegions } = await supabase
        .from("regions")
        .select("*")
        .order("name");
      if (dbRegions && dbRegions.length > 0) {
        setRegions(
          dbRegions.map((r: any) => ({
            id: r.id,
            name: r.name,
            province: r.province,
            lat: r.lat,
            lng: r.lng,
            waterLevelCm: r.water_level_cm,
            rainfallMm: r.rainfall_mm,
            tideCm: r.tide_cm,
            reports: r.reports,
            updatedAt: r.updated_at,
            risk: r.risk,
            summary: r.summary,
          }))
        );
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [regions.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function deleteReport(id: string) {
    await supabase.from("citizen_reports").delete().eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    setStats((prev) => ({ ...prev, totalReports: prev.totalReports - 1 }));
  }

  async function sendAlert() {
    if (!alertForm.message.trim()) return;
    setAlertSending(true);
    setAlertResult(null);

    const region = regions.find((r) => r.id === alertForm.regionId);

    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `⚠️ Peringatan: ${region?.name ?? alertForm.regionId}`,
          body: alertForm.message,
          regionId: alertForm.regionId,
        }),
      });
      const data = await res.json();
      setAlertResult(`✅ Push terkirim ke ${data.sent ?? 0} subscriber.`);
    } catch {
      setAlertResult("❌ Gagal mengirim notifikasi.");
    }

    setAlertSending(false);
    setAlertForm((prev) => ({ ...prev, message: "" }));
    setTimeout(() => setAlertResult(null), 5000);
  }

  const riskBadge = (risk: string) => {
    const map: Record<string, string> = {
      high: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
      medium: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
      low: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    };
    const label: Record<string, string> = { high: "Siaga", medium: "Waspada", low: "Normal" };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${map[risk] ?? ""}`}>
        {label[risk] ?? risk}
      </span>
    );
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Activity size={16} /> },
    { id: "reports", label: "Laporan", icon: <Eye size={16} /> },
    { id: "regions", label: "Wilayah", icon: <MapPin size={16} /> },
    { id: "alerts", label: "Kirim Alert", icon: <Bell size={16} /> },
  ];

  return (
    <main className="min-h-screen bg-transparent px-4 py-4 text-ink transition-colors dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-lg border border-white/80 bg-white/85 px-4 py-3 shadow-soft backdrop-blur dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-md" priority />
          <div>
            <p className="text-lg font-black leading-5 text-ink dark:text-white">SIGMA AIR</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" className="rounded-md bg-sea-50 px-3 py-2 text-xs font-bold text-sea-700 hover:bg-sea-100 dark:bg-slate-800 dark:text-sea-400 dark:hover:bg-slate-700">
            ← Kembali ke Dashboard
          </a>
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="rounded-md bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-md bg-red-50 p-2.5 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {/* Tab navigation */}
      <div className="mx-auto mt-4 flex max-w-7xl gap-1 overflow-x-auto rounded-lg border border-white/80 bg-white/85 p-1 shadow-soft backdrop-blur dark:border-slate-700 dark:bg-slate-900">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition-all ${
              tab === t.id
                ? "bg-ink text-white shadow-md dark:bg-sea-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold text-slate-500 hover:text-ink dark:text-slate-400"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto mt-4 max-w-7xl">
        {/* ====== OVERVIEW TAB ====== */}
        {tab === "overview" && (
          <div className="space-y-5">
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Eye size={20} />}
                label="Total Laporan"
                value={stats.totalReports.toString()}
                tone="text-sea-700 bg-sea-50 dark:text-sea-400 dark:bg-sea-500/10"
              />
              <StatCard
                icon={<Bell size={20} />}
                label="Push Subscribers"
                value={stats.pushSubscribers.toString()}
                tone="text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/10"
              />
              <StatCard
                icon={<Users size={20} />}
                label="Telegram Subscribers"
                value={stats.telegramSubscribers.toString()}
                tone="text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10"
              />
              <StatCard
                icon={<Globe2 size={20} />}
                label="Wilayah Pantauan"
                value={stats.regionsCount.toString()}
                tone="text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10"
              />
            </div>

            {/* Quick status */}
            <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-black">Status Wilayah</h2>
              <div className="mt-4 space-y-2">
                {regions.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-bold">{r.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{r.province}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-ink dark:text-white">{r.waterLevelCm}</span> cm
                      </div>
                      {riskBadge(r.risk)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent reports preview */}
            <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-black">Laporan Terbaru</h2>
              {reports.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Belum ada laporan dari database.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {reports.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{r.description}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {r.region_id} · {new Date(r.created_at).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-sea-50 px-2 py-0.5 text-xs font-bold text-sea-700 dark:bg-slate-700 dark:text-sea-400">
                        {r.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== REPORTS TAB ====== */}
        {tab === "reports" && (
          <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Semua Laporan Warga ({stats.totalReports})</h2>
              <button
                onClick={exportCSV}
                disabled={reports.length === 0}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-ink hover:bg-sea-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
            {reports.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Belum ada laporan dari database.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-500 dark:border-slate-700">
                      <th className="px-3 py-2">Deskripsi</th>
                      <th className="px-3 py-2">Wilayah</th>
                      <th className="px-3 py-2">Media</th>
                      <th className="px-3 py-2 text-center">Confidence</th>
                      <th className="px-3 py-2">Waktu</th>
                      <th className="px-3 py-2 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="max-w-[300px] truncate px-3 py-3 font-medium">{r.description}</td>
                        <td className="px-3 py-3 text-slate-500">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold dark:bg-slate-800">{r.region_id}</span>
                        </td>
                        <td className="px-3 py-3">
                          {r.media_url ? (
                            <a href={r.media_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-sea-700 hover:underline dark:text-sea-400">
                              Lihat
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="rounded-full bg-sea-50 px-2 py-0.5 text-xs font-bold text-sea-700 dark:bg-slate-700 dark:text-sea-400">
                            {r.confidence}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500">{new Date(r.created_at).toLocaleString("id-ID")}</td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => deleteReport(r.id)}
                            className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                            title="Hapus laporan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ====== REGIONS TAB ====== */}
        {tab === "regions" && (
          <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-black">Wilayah Pantauan ({regions.length})</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Data wilayah saat ini dimuat dari kode statis. Untuk mengelola dari database, buat tabel <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">regions</code> di Supabase.
            </p>
            <div className="mt-4 space-y-3">
              {regions.map((r) => (
                <RegionCard key={r.id} region={r} riskBadge={riskBadge} />
              ))}
            </div>
          </div>
        )}

        {/* ====== ALERTS TAB ====== */}
        {tab === "alerts" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-orange-50 p-3 text-orange-600 dark:bg-orange-500/10">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black">Kirim Push Notification</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Broadcast peringatan ke semua subscriber di wilayah tertentu.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <select
                  value={alertForm.regionId}
                  onChange={(e) => setAlertForm((c) => ({ ...c, regionId: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none ring-sea-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.province})</option>
                  ))}
                </select>
                <textarea
                  required
                  rows={3}
                  placeholder="Tulis pesan peringatan (misal: Banjir naik 20cm di kawasan pelabuhan)..."
                  value={alertForm.message}
                  onChange={(e) => setAlertForm((c) => ({ ...c, message: e.target.value }))}
                  className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-3 text-sm outline-none ring-sea-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={sendAlert}
                  disabled={alertSending || !alertForm.message.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {alertSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {alertSending ? "Mengirim..." : "Kirim Push Notification"}
                </button>
                {alertResult && (
                  <p className={`rounded-md px-3 py-2 text-sm font-bold ${alertResult.startsWith("✅") ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"}`}>
                    {alertResult}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-sea-50 p-3 text-sea-700 dark:bg-sea-500/10">
                  <Shield size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black">Info Subscriber</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Statistik pengguna yang berlangganan notifikasi.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
                  <span className="text-sm font-bold">Push Notification</span>
                  <span className="rounded-full bg-purple-100 px-3 py-0.5 text-sm font-black text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                    {stats.pushSubscribers}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
                  <span className="text-sm font-bold">Telegram Bot</span>
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 text-sm font-black text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                    {stats.telegramSubscribers}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
                  <span className="text-sm font-bold">Total Laporan Warga</span>
                  <span className="rounded-full bg-sea-100 px-3 py-0.5 text-sm font-black text-sea-700 dark:bg-sea-500/20 dark:text-sea-400">
                    {stats.totalReports}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <div className={`mb-3 inline-flex rounded-md p-2.5 ${tone}`}>{icon}</div>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function RegionCard({ region, riskBadge }: { region: RegionStatus; riskBadge: (r: string) => React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-slate-400" />
          <div>
            <p className="text-sm font-bold">{region.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{region.province}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {riskBadge(region.risk)}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <p className="font-bold text-slate-500">Level Air</p>
              <p className="text-lg font-black">{region.waterLevelCm} cm</p>
            </div>
            <div>
              <p className="font-bold text-slate-500">Curah Hujan</p>
              <p className="text-lg font-black">{region.rainfallMm} mm</p>
            </div>
            <div>
              <p className="font-bold text-slate-500">Pasang</p>
              <p className="text-lg font-black">{region.tideCm} cm</p>
            </div>
            <div>
              <p className="font-bold text-slate-500">Laporan</p>
              <p className="text-lg font-black">{region.reports}</p>
            </div>
          </div>
          <p className="mt-3 rounded-md bg-white px-3 py-2 text-xs italic text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            {region.summary}
          </p>
          <p className="mt-2 text-[10px] text-slate-400">
            Koordinat: {region.lat}, {region.lng} · Update: {region.updatedAt}
          </p>
        </div>
      )}
    </div>
  );
}
