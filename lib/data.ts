export type RiskLevel = "high" | "medium" | "low";

export type RegionStatus = {
  id: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  waterLevelCm: number;
  rainfallMm: number;
  tideCm: number;
  reports: number;
  updatedAt: string;
  risk: RiskLevel;
  summary: string;
};

export type CitizenReport = {
  id: string;
  regionId: string;
  description: string;
  mediaUrl?: string | null;
  time: string;
  confidence: number;
};

export const regions: RegionStatus[] = [
  {
    id: "jakarta-utara",
    name: "Jakarta Utara",
    province: "DKI Jakarta",
    lat: -6.1267,
    lng: 106.8732,
    waterLevelCm: 68,
    rainfallMm: 18,
    tideCm: 94,
    reports: 24,
    updatedAt: "2 menit lalu",
    risk: "high",
    summary: "Pasang laut tinggi bertemu hujan lokal. Prioritaskan kanal siaga dan akses evakuasi pesisir."
  },
  {
    id: "semarang",
    name: "Semarang",
    province: "Jawa Tengah",
    lat: -6.9667,
    lng: 110.4167,
    waterLevelCm: 52,
    rainfallMm: 9,
    tideCm: 86,
    reports: 17,
    updatedAt: "8 menit lalu",
    risk: "high",
    summary: "Rob aktif di kawasan pesisir dan pelabuhan. Pantau pompa serta jalur kendaraan rendah."
  },
  {
    id: "pekalongan",
    name: "Pekalongan",
    province: "Jawa Tengah",
    lat: -6.8898,
    lng: 109.6753,
    waterLevelCm: 43,
    rainfallMm: 6,
    tideCm: 73,
    reports: 11,
    updatedAt: "13 menit lalu",
    risk: "medium",
    summary: "Genangan rob mulai surut, tetapi area permukiman rendah masih membutuhkan pemantauan."
  },
  {
    id: "surabaya",
    name: "Surabaya",
    province: "Jawa Timur",
    lat: -7.2575,
    lng: 112.7521,
    waterLevelCm: 28,
    rainfallMm: 14,
    tideCm: 47,
    reports: 8,
    updatedAt: "19 menit lalu",
    risk: "medium",
    summary: "Hujan sedang meningkatkan debit saluran kota. Risiko meningkat jika intensitas bertahan."
  },
  {
    id: "makassar",
    name: "Makassar",
    province: "Sulawesi Selatan",
    lat: -5.1477,
    lng: 119.4327,
    waterLevelCm: 19,
    rainfallMm: 2,
    tideCm: 32,
    reports: 3,
    updatedAt: "25 menit lalu",
    risk: "low",
    summary: "Kondisi terkendali. Tetap pantau kanal laporan warga untuk perubahan cepat."
  }
];

export const initialReports: CitizenReport[] = [
  { id: "R-1024", regionId: "jakarta-utara", description: "Air laut naik hingga merendam jalan utama, lalu lintas macet.", time: "01.18 WIB", confidence: 92 },
  { id: "R-1023", regionId: "semarang", description: "Pelabuhan tergenang air pasang, aktivitas bongkar muat terhambat.", time: "01.07 WIB", confidence: 89 },
  { id: "R-1022", regionId: "semarang", description: "Hujan lebat membuat selokan meluap, genangan sekitar mata kaki.", time: "00.52 WIB", confidence: 84 },
  { id: "R-1021", regionId: "surabaya", description: "Jalanan banjir setinggi betis, kendaraan roda dua banyak yang mogok.", time: "00.31 WIB", confidence: 77 }
];

export const riskCopy: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  high: { label: "Siaga", color: "text-signal-red", bg: "bg-red-50" },
  medium: { label: "Waspada", color: "text-signal-orange", bg: "bg-orange-50" },
  low: { label: "Normal", color: "text-signal-green", bg: "bg-green-50" }
};

export const sources = ["BMKG", "Open-Meteo", "WorldTides", "Laporan Warga", "Supabase Realtime"];
