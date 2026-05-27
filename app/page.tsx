"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Activity,
  Bell,
  Bot,
  CloudRain,
  Droplets,
  ExternalLink,
  Github,
  Globe2,
  Loader2,
  MapPin,
  Moon,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  Smartphone,
  Sun,
  Waves
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import RegisterServiceWorker from "@/Components/RegisterServiceWorker";
import { initialReports, regions, riskCopy, sources, type CitizenReport } from "@/lib/data";

const MapView = dynamic(() => import("@/Components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-sea-50 text-sm font-semibold text-sea-700">
      Memuat peta SIGMA AIR...
    </div>
  )
});

type Channel = "push" | "telegram";
type Language = "id" | "en";
type ApiStatus = "loading" | "live" | "error";
type LiveWeather = {
  source: string;
  observedAt: string;
  temperatureC: number | null;
  humidityPercent: number | null;
  precipitationMm: number;
  rainMm: number;
  windKmh: number | null;
};
type LiveTide = {
  source: string;
  observedAt: string | null;
  tideHeightM: number | null;
  tideHeightCm: number | null;
  nextExtreme: {
    type: string | null;
    at: string | null;
    heightM: number | null;
    heightCm: number | null;
  } | null;
};
type AiAnalysis = {
  analysis: string;
  model: string;
  generatedAt: string;
};

const channelLabels: Record<Channel, string> = {
  push: "Push",
  telegram: "Telegram"
};

const copy = {
  id: {
    navMap: "Peta",
    navReport: "Lapor",
    navNotifications: "Notifikasi",
    tagline: "Sistem Informasi Genangan, Monitoring, dan Analisis Air",
    liveOn: "Berita terkini",
    liveOff: "Mode demo",
    liveLoading: "Memuat API",
    liveError: "API gagal",
    liveOnDetail: "Data ditandai memakai pembaruan terkini",
    liveOffDetail: "Data simulasi untuk demo MVP",
    liveErrorDetail: "API belum tersedia, memakai data demo",
    heroTitle: "Pantau banjir dan rob Indonesia secara real-time.",
    heroBody:
      "SIGMA AIR menggabungkan data BMKG, Open-Meteo, pasang surut, dan laporan warga untuk membantu warga, BPBD, jurnalis, dan peneliti membaca risiko air lebih cepat.",
    openMap: "Buka Peta",
    sendReport: "Kirim Laporan",
    alertZones: "Zona Siaga",
    activeReports: "Laporan Aktif",
    avgWater: "Rata Air",
    update: "Update",
    mapTitle: "Peta Risiko Live",
    mapBody: "Overlay zona rawan, cuaca, pasang surut, dan laporan warga.",
    waterThreshold: "Threshold air",
    thresholdHint: "Wilayah di bawah threshold disembunyikan kecuali sedang dipilih.",
    earlyWarning: "Notifikasi Dini",
    earlyWarningBody: "Simulasi preferensi kanal alert ketika threshold terlampaui.",
    dataSources: "Sumber Data",
    citizenReports: "Laporan Warga",
    citizenReportsBody: "Laporan baru langsung masuk ke daftar dan siap ditampilkan di peta.",
    locationPlaceholder: "Lokasi terdampak",
    heightAria: "Tinggi air dalam sentimeter",
    reportAccepted: "Laporan diterima.",
    aiTitle: "Analisis Risiko AI",
    aiSummaryLabel: "Ringkasan kondisi saat ini",
    aiSummary:
      "Area pesisir utara Jawa menunjukkan risiko gabungan rob dan genangan. Fokus mitigasi berada pada pintu air, pompa, jalan rendah, serta validasi cepat laporan warga di Jakarta Utara dan Semarang.",
    feedTitle: "Feed Laporan Terbaru",
    valid: "valid",
    waterLevel: "Tinggi air",
    rain: "Hujan",
    tide: "Pasang",
    reports: "Laporan",
    temperature: "Suhu",
    humidity: "Kelembapan",
    wind: "Angin",
    weatherApi: "Cuaca API",
    tideApi: "Pasang Surut API",
    tideApiKeyMissing: "WorldTides butuh WORLDTIDES_API_KEY",
    nextTide: "Titik pasang berikutnya",
    footerSources: "Sumber API realtime",
    github: "GitHub",
    justNow: "Baru saja",
    hiddenStatus: "Status data"
  },
  en: {
    navMap: "Map",
    navReport: "Report",
    navNotifications: "Alerts",
    tagline: "Flooding, Monitoring, and Water Analysis Information System",
    liveOn: "Latest news",
    liveOff: "Demo mode",
    liveLoading: "Loading API",
    liveError: "API failed",
    liveOnDetail: "Data is marked as using latest updates",
    liveOffDetail: "Simulated data for the MVP demo",
    liveErrorDetail: "API is unavailable, using demo data",
    heroTitle: "Monitor flooding and coastal inundation across Indonesia in real time.",
    heroBody:
      "SIGMA AIR combines BMKG, Open-Meteo, tidal information, and citizen reports to help residents, BPBD teams, journalists, and researchers read water risk faster.",
    openMap: "Open Map",
    sendReport: "Send Report",
    alertZones: "Alert Zones",
    activeReports: "Active Reports",
    avgWater: "Avg Water",
    update: "Update",
    mapTitle: "Live Risk Map",
    mapBody: "Overlay of hazard zones, weather, tides, and citizen reports.",
    waterThreshold: "Water threshold",
    thresholdHint: "Regions below the threshold are hidden unless currently selected.",
    earlyWarning: "Early Warning",
    earlyWarningBody: "Simulated alert channel preferences when thresholds are exceeded.",
    dataSources: "Data Sources",
    citizenReports: "Citizen Reports",
    citizenReportsBody: "New reports enter the feed immediately and are ready to appear on the map.",
    locationPlaceholder: "Affected location",
    heightAria: "Water height in centimeters",
    reportAccepted: "Report received.",
    aiTitle: "AI Risk Analysis",
    aiSummaryLabel: "Current condition summary",
    aiSummary:
      "North Java coastal areas show combined tidal and flood risk. Mitigation focus is on floodgates, pumps, low roads, and rapid validation of citizen reports in North Jakarta and Semarang.",
    feedTitle: "Latest Report Feed",
    valid: "valid",
    waterLevel: "Water level",
    rain: "Rain",
    tide: "Tide",
    reports: "Reports",
    temperature: "Temp",
    humidity: "Humidity",
    wind: "Wind",
    weatherApi: "Weather API",
    tideApi: "Tide API",
    tideApiKeyMissing: "WorldTides needs WORLDTIDES_API_KEY",
    nextTide: "Next tide extreme",
    footerSources: "Realtime API sources",
    github: "GitHub",
    justNow: "Just now",
    hiddenStatus: "Data status"
  }
} satisfies Record<Language, Record<string, string>>;

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>("id");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("loading");
  const [liveWeather, setLiveWeather] = useState<LiveWeather | null>(null);
  const [tideStatus, setTideStatus] = useState<ApiStatus>("loading");
  const [liveTide, setLiveTide] = useState<LiveTide | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(regions[0].id);
  const [threshold, setThreshold] = useState(40);
  const [channels, setChannels] = useState<Record<Channel, boolean>>({ push: true, telegram: true });
  const [reports, setReports] = useState<CitizenReport[]>(initialReports);
  const [reportForm, setReportForm] = useState({ regionId: regions[0].id, description: "" });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiStatus, setAiStatus] = useState<ApiStatus>("loading");
  const [aiError, setAiError] = useState<string | null>(null);
  const t = copy[language];
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/";

  const selected = regions.find((region) => region.id === selectedId) ?? regions[0];
  const displayedRainfall = liveWeather?.precipitationMm ?? selected.rainfallMm;
  const displayedTide = liveTide?.tideHeightCm ?? selected.tideCm;
  const highRiskCount = regions.filter((region) => region.risk === "high").length;
  const activeReports = regions.reduce((sum, region) => sum + region.reports, 0);
  const averageWater = Math.round(regions.reduce((sum, region) => sum + region.waterLevelCm, 0) / regions.length);

  const filteredRegions = useMemo(
    () => regions.filter((region) => region.waterLevelCm >= threshold || region.id === selectedId),
    [selectedId, threshold]
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    return () => document.documentElement.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setApiStatus("loading");

      try {
        const response = await fetch(`/api/weather?lat=${selected.lat}&lng=${selected.lng}`, {
          signal: controller.signal
        });

        if (!response.ok) throw new Error("Weather API failed");

        const payload = (await response.json()) as LiveWeather;
        setLiveWeather(payload);
        setApiStatus("live");
      } catch {
        if (controller.signal.aborted) return;
        setLiveWeather(null);
        setApiStatus("error");
      }
    }

    loadWeather();
    return () => controller.abort();
  }, [selected.lat, selected.lng, refreshIndex]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTides() {
      setTideStatus("loading");

      try {
        const response = await fetch(`/api/tides?lat=${selected.lat}&lng=${selected.lng}`, {
          signal: controller.signal
        });

        if (!response.ok) throw new Error("Tide API failed");

        const payload = (await response.json()) as LiveTide;
        setLiveTide(payload);
        setTideStatus("live");
      } catch {
        if (controller.signal.aborted) return;
        setLiveTide(null);
        setTideStatus("error");
      }
    }

    loadTides();
    return () => controller.abort();
  }, [selected.lat, selected.lng, refreshIndex]);

  const fetchAiAnalysis = useCallback(async (signal?: AbortSignal) => {
    setAiStatus("loading");
    setAiError(null);

    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regions: regions.map((r) => ({
            name: r.name,
            province: r.province,
            waterLevelCm: r.waterLevelCm,
            rainfallMm: r.rainfallMm,
            tideCm: r.tideCm,
            reports: r.reports,
            risk: r.risk
          }))
        }),
        signal
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "AI analysis failed");
      }

      const payload = (await response.json()) as AiAnalysis;
      setAiAnalysis(payload);
      setAiStatus("live");
    } catch (err) {
      if (signal?.aborted) return;
      setAiAnalysis(null);
      setAiStatus("error");
      setAiError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAiAnalysis(controller.signal);
    return () => controller.abort();
  }, [fetchAiAnalysis, refreshIndex]);

  useEffect(() => {
    async function loadReports() {
      const { data } = await supabase
        .from("citizen_reports")
        .select("*")
        .eq("region_id", selectedId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setReports((current) => {
          const loaded = data.map((d: any) => ({
            id: d.id,
            regionId: d.region_id,
            description: d.description,
            mediaUrl: d.media_url,
            time: new Date(d.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
            confidence: d.confidence
          }));
          return [...loaded, ...initialReports.filter(r => r.regionId === selectedId)];
        });
      }
    }

    loadReports();

    const channel = supabase
      .channel("public:citizen_reports")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "citizen_reports" },
        (payload) => {
          const d = payload.new;
          if (d.region_id !== selectedId) return;
          setReports((current) => [
            {
              id: d.id,
              regionId: d.region_id,
              description: d.description,
              mediaUrl: d.media_url,
              time: new Date(d.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
              confidence: d.confidence
            },
            ...current
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  const liveStatusLabel =
    apiStatus === "loading" ? t.liveLoading : apiStatus === "live" ? t.liveOn : t.liveError;
  const liveStatusDetail =
    apiStatus === "live" ? t.liveOnDetail : apiStatus === "error" ? t.liveErrorDetail : t.liveOffDetail;

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportForm.description.trim()) return;

    setIsSubmitting(true);
    let media_url = null;

    if (mediaFile) {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data } = await supabase.storage
        .from('media')
        .upload(fileName, mediaFile);
      if (data) {
        media_url = supabase.storage.from('media').getPublicUrl(fileName).data.publicUrl;
      }
    }

    const { error } = await supabase.from("citizen_reports").insert({
      region_id: reportForm.regionId,
      description: reportForm.description.trim(),
      media_url,
      confidence: 73
    });

    setIsSubmitting(false);
    if (!error) {
      setReportForm(curr => ({ ...curr, description: "" }));
      setMediaFile(null);
      setSubmitted(true);
      window.setTimeout(() => setSubmitted(false), 2600);
    }
  }

  return (
    <main
      className="min-h-screen bg-transparent px-4 py-4 text-ink transition-colors dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8"
    >
      <RegisterServiceWorker />

      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 rounded-lg border border-white/80 bg-white/85 px-4 py-3 shadow-soft backdrop-blur dark:border-slate-700 dark:bg-slate-900">
        <a className="flex min-w-0 items-center gap-3" href="#peta" aria-label="SIGMA AIR">
          <Image src="/logo.png" alt="Logo SIGMA AIR" width={52} height={52} className="h-12 w-12 rounded-md object-cover" priority />
          <div className="min-w-0">
            <p className="text-lg font-black leading-5 tracking-normal text-ink dark:text-white">SIGMA AIR</p>
            <p className="max-w-[260px] truncate text-xs font-medium text-slate-500 dark:text-slate-300">{t.tagline}</p>
          </div>
        </a>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <a className="rounded-md px-3 py-2 hover:bg-sea-50 hover:text-sea-700 dark:hover:bg-slate-800 dark:hover:text-sea-300" href="#peta">
            {t.navMap}
          </a>
          <a className="rounded-md px-3 py-2 hover:bg-sea-50 hover:text-sea-700 dark:hover:bg-slate-800 dark:hover:text-sea-300" href="#lapor">
            {t.navReport}
          </a>
          <a className="rounded-md px-3 py-2 hover:bg-sea-50 hover:text-sea-700 dark:hover:bg-slate-800 dark:hover:text-sea-300" href="#notifikasi">
            {t.navNotifications}
          </a>
          <button
            type="button"
            onClick={() => setRefreshIndex((current) => current + 1)}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-black ${
              apiStatus === "live"
                ? "border-green-200 bg-green-50 text-signal-green dark:border-green-500/40 dark:bg-green-950/40 dark:text-green-300"
                : apiStatus === "loading"
                  ? "border-cyan-200 bg-sea-50 text-sea-700 dark:border-cyan-500/40 dark:bg-cyan-950/40 dark:text-cyan-300"
                : "border-orange-200 bg-orange-50 text-signal-orange dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-300"
            }`}
            aria-label={t.hiddenStatus}
            title={liveStatusDetail}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                apiStatus === "live" ? "bg-signal-green" : apiStatus === "loading" ? "bg-sea-500" : "bg-signal-orange"
              }`}
            />
            {liveStatusLabel}
          </button>
          <button
            type="button"
            onClick={() => setDarkMode((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-ink hover:bg-sea-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label={darkMode ? "Light mode" : "Dark mode"}
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={() => setLanguage((current) => (current === "id" ? "en" : "id"))}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-ink hover:bg-sea-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label="Switch language"
            title="Switch language"
          >
            <Globe2 size={16} />
            {language === "id" ? "ID" : "EN"}
          </button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div>
                <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal text-ink dark:text-white sm:text-5xl">
                  {t.heroTitle}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
                  {t.heroBody}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    className="inline-flex items-center gap-2 rounded-md bg-sea-700 px-4 py-3 text-sm font-bold text-white shadow-soft hover:bg-sea-500"
                    href="#peta"
                  >
                    <MapPin size={18} /> {t.openMap}
                  </a>
                  <a
                    className="inline-flex items-center gap-2 rounded-md border border-sea-100 bg-white px-4 py-3 text-sm font-bold text-sea-700 hover:bg-sea-50 dark:border-slate-700 dark:bg-slate-800 dark:text-sea-300 dark:hover:bg-slate-700"
                    href="#lapor"
                  >
                    <Send size={18} /> {t.sendReport}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                <Metric icon={<ShieldAlert size={20} />} label={t.alertZones} value={highRiskCount.toString()} tone="text-signal-red" />
                <Metric icon={<Radio size={20} />} label={t.activeReports} value={activeReports.toString()} tone="text-sea-700 dark:text-sea-300" />
                <Metric icon={<Droplets size={20} />} label={t.avgWater} value={`${averageWater} cm`} tone="text-sea-700 dark:text-sea-300" />
                <Metric icon={<Activity size={20} />} label={t.update} value="15 mnt" tone="text-signal-green" />
              </div>
            </div>
          </section>

          <section id="peta" className="overflow-hidden rounded-lg border border-white/80 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-black text-ink dark:text-white">{t.mapTitle}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.mapBody}</p>
              </div>
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none ring-sea-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid min-h-[560px] lg:grid-cols-[1fr_320px]">
              <div className="min-h-[420px]">
                <MapView regions={filteredRegions} selectedId={selectedId} onSelect={setSelectedId} />
              </div>
              <aside className="border-t border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40 lg:border-l lg:border-t-0">
                <div className={`rounded-lg ${riskCopy[selected.risk].bg} p-4 dark:bg-slate-800`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-300">{selected.province}</p>
                    <span className={`text-sm font-black ${riskCopy[selected.risk].color}`}>{riskCopy[selected.risk].label}</span>
                  </div>
                  <h3 className="mt-1 text-2xl font-black text-ink dark:text-white">{selected.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{selected.summary}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <SmallStat label={t.waterLevel} value={`${selected.waterLevelCm} cm`} />
                  <SmallStat label={t.rain} value={`${displayedRainfall.toFixed(1)} mm`} />
                  <SmallStat label={t.tide} value={`${displayedTide} cm`} />
                  <SmallStat label={t.reports} value={selected.reports.toString()} />
                </div>
                <div className="mt-4 rounded-md border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.weatherApi}</p>
                  <p className="mt-1 text-sm font-semibold text-ink dark:text-white">{liveStatusDetail}</p>
                  {liveWeather && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        <b className="block text-base text-ink dark:text-white">{liveWeather.temperatureC ?? "-"} C</b>
                        {t.temperature}
                      </span>
                      <span>
                        <b className="block text-base text-ink dark:text-white">{liveWeather.humidityPercent ?? "-"}%</b>
                        {t.humidity}
                      </span>
                      <span>
                        <b className="block text-base text-ink dark:text-white">{liveWeather.windKmh ?? "-"} km/j</b>
                        {t.wind}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 rounded-md border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.tideApi}</p>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        tideStatus === "live" ? "bg-signal-green" : tideStatus === "loading" ? "bg-sea-500" : "bg-signal-orange"
                      }`}
                    />
                  </div>
                  {liveTide ? (
                    <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      <b className="block text-lg text-ink dark:text-white">{displayedTide} cm</b>
                      {liveTide.nextExtreme && (
                        <span>
                          {t.nextTide}: {liveTide.nextExtreme.type ?? "-"} {liveTide.nextExtreme.heightCm ?? "-"} cm
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{t.tideApiKeyMissing}</p>
                  )}
                </div>
                <div className="mt-5">
                  <label className="flex items-center justify-between text-sm font-bold text-ink dark:text-white" htmlFor="threshold">
                    {t.waterThreshold} <span>{threshold} cm</span>
                  </label>
                  <input
                    id="threshold"
                    type="range"
                    min="10"
                    max="80"
                    value={threshold}
                    onChange={(event) => setThreshold(Number(event.target.value))}
                    className="mt-3 w-full accent-cyan-600"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t.thresholdHint}</p>
                </div>
              </aside>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section id="notifikasi" className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-sea-50 p-3 text-sea-700">
                <Bell size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black">{t.earlyWarning}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.earlyWarningBody}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {(Object.keys(channels) as Channel[]).map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setChannels((current) => ({ ...current, [channel]: !current[channel] }))}
                  className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 text-left dark:border-slate-700 dark:bg-slate-800"
                >
                  <span className="flex items-center gap-3 text-sm font-bold">
                    {channel === "push" ? <Smartphone size={18} /> : <Bot size={18} />}
                    {channelLabels[channel]}
                  </span>
                  <span
                    className={`h-6 w-11 rounded-full p-1 transition ${channels[channel] ? "bg-sea-700" : "bg-slate-200"}`}
                    aria-hidden="true"
                  >
                    <span
                      className={`block h-4 w-4 rounded-full bg-white transition ${channels[channel] ? "translate-x-5" : ""}`}
                    />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-black">{t.dataSources}</h2>
            <div className="mt-4 grid gap-2">
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold dark:bg-slate-800">
                <span>{liveStatusLabel}</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    apiStatus === "live" ? "bg-signal-green" : apiStatus === "loading" ? "bg-sea-500" : "bg-signal-orange"
                  }`}
                />
              </div>
              {sources.map((source) => (
                <div key={source} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold dark:bg-slate-800">
                  <span>{source}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      source === "WorldTides"
                        ? tideStatus === "live"
                          ? "bg-signal-green"
                          : tideStatus === "loading"
                            ? "bg-sea-500"
                            : "bg-signal-orange"
                        : "bg-signal-green"
                    }`}
                  />
                </div>
              ))}
            </div>
          </section>

          <section id="lapor" className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-sea-50 p-3 text-sea-700">
                <CloudRain size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black">{t.citizenReports}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.citizenReportsBody}</p>
              </div>
            </div>

            <form className="mt-4 space-y-3" onSubmit={submitReport}>
              <select
                value={reportForm.regionId}
                onChange={(event) => setReportForm((current) => ({ ...current, regionId: event.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none ring-sea-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <textarea
                required
                rows={3}
                value={reportForm.description}
                onChange={(event) => setReportForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Jelaskan situasi saat ini (misal: Jalan A banjir sebetis)..."
                className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-3 text-sm outline-none ring-sea-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size > 10 * 1024 * 1024) {
                    alert("Ukuran file maksimal 10MB");
                    e.target.value = "";
                    return;
                  }
                  setMediaFile(file || null);
                }}
                className="w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-sea-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sea-700 hover:file:bg-sea-100 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-sea-400"
              />
              <button disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-bold text-white hover:bg-sea-700 disabled:opacity-70">
                {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                {isSubmitting ? "Mengirim..." : t.sendReport}
              </button>
              {submitted && <p className="rounded-md bg-green-50 px-3 py-2 text-sm font-bold text-signal-green">{t.reportAccepted}</p>}
            </form>
          </section>
        </aside>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 pb-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">{t.aiTitle}</h2>
            <button
              type="button"
              onClick={() => fetchAiAnalysis()}
              disabled={aiStatus === "loading"}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-ink hover:bg-sea-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              title={language === "id" ? "Perbarui analisis AI" : "Refresh AI analysis"}
            >
              <RefreshCw size={14} className={aiStatus === "loading" ? "animate-spin" : ""} />
              {language === "id" ? "Perbarui" : "Refresh"}
            </button>
          </div>
          <div className="mt-4 rounded-lg bg-ink p-5 text-white">
            <div className="flex items-center gap-3 text-sea-100">
              <Waves size={22} />
              <span className="text-sm font-bold">{t.aiSummaryLabel}</span>
              {aiAnalysis && (
                <span className="ml-auto rounded-full bg-sea-700/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sea-200">
                  {aiAnalysis.model}
                </span>
              )}
            </div>
            {aiStatus === "loading" ? (
              <div className="mt-4 flex items-center gap-3 text-slate-300">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm font-semibold">{language === "id" ? "Menganalisis data wilayah..." : "Analyzing region data..."}</span>
              </div>
            ) : aiStatus === "error" ? (
              <div className="mt-4">
                <p className="text-base leading-7 text-slate-100">
                  {t.aiSummary}
                </p>
                {aiError && (
                  <p className="mt-3 rounded-md bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-200">
                    ⚠ {aiError}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-base leading-7 text-slate-100">
                {aiAnalysis?.analysis ?? t.aiSummary}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-black">{t.feedTitle}</h2>
          <div className="mt-4 space-y-3">
            {reports.slice(0, 5).map((report) => (
              <article key={report.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
                <div>
                  <p className="font-bold text-ink dark:text-white text-sm line-clamp-2">{report.description}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{report.time}</p>
                  {report.mediaUrl && (
                    <a href={report.mediaUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block rounded-md bg-sea-50 px-2 py-1 text-xs font-semibold text-sea-700 hover:bg-sea-100 dark:bg-slate-800 dark:text-sea-400">
                      Lihat Foto/Video
                    </a>
                  )}
                </div>
                <div className="text-right text-xs font-bold text-sea-700 dark:text-sea-300">
                  {report.confidence}%
                  <span className="block font-medium text-slate-400">{t.valid}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto mb-4 flex max-w-7xl flex-wrap items-center justify-between gap-4 rounded-lg border border-white/80 bg-white/90 px-5 py-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <div>
          <p className="text-sm font-black text-ink dark:text-white">SIGMA AIR</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.footerSources}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FooterLink href={githubUrl} label={t.github} icon={<Github size={17} />} />
          <FooterLink href="https://open-meteo.com/en/docs" label="Open-Meteo" />
          <FooterLink href="https://www.worldtides.info/apidocs" label="WorldTides" />
          <FooterLink href="https://data.bmkg.go.id/prakiraan-cuaca/" label="BMKG" />
          <FooterLink href="https://www.openstreetmap.org/copyright" label="OpenStreetMap" />
        </div>
      </footer>
    </main>
  );
}

function FooterLink({ href, label, icon }: { href: string; label: string; icon?: ReactNode }) {
  return (
    <a
      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-ink hover:bg-sea-50 hover:text-sea-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {icon}
      {label}
      <ExternalLink size={13} />
    </a>
  );
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
      <div className={`${tone} mb-3`}>{icon}</div>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-ink dark:text-white">{value}</p>
    </div>
  );
}
