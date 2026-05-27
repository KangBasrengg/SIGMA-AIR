import { NextResponse } from "next/server";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

type RegionInput = {
  name: string;
  province: string;
  waterLevelCm: number;
  rainfallMm: number;
  tideCm: number;
  reports: number;
  risk: string;
};

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqChoice = {
  message: { content: string };
};

type GroqResponse = {
  choices?: GroqChoice[];
  error?: { message: string };
};

const SYSTEM_PROMPT = `Kamu adalah asisten AI ahli hidrologi dan mitigasi bencana banjir/rob di Indonesia.
Tugasmu adalah menganalisis data kondisi wilayah-wilayah pemantauan banjir dan rob, lalu memberikan ringkasan kondisi terkini beserta rekomendasi mitigasi.

Aturan output:
- Gunakan Bahasa Indonesia yang jelas dan ringkas.
- Maksimal 4-5 kalimat.
- Sebutkan wilayah-wilayah yang paling berisiko terlebih dahulu.
- Berikan satu rekomendasi aksi konkret yang bisa dilakukan warga dan BPBD.
- Jangan gunakan format markdown, cukup paragraf biasa.`;

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Groq API key is not configured.", requiresEnv: "GROQ_API_KEY" },
      { status: 503 }
    );
  }

  let regions: RegionInput[];

  try {
    const body = (await request.json()) as { regions?: RegionInput[] };
    regions = body.regions ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (regions.length === 0) {
    return NextResponse.json({ error: "No region data provided." }, { status: 400 });
  }

  const dataSnapshot = regions
    .map(
      (r) =>
        `- ${r.name} (${r.province}): air ${r.waterLevelCm} cm, hujan ${r.rainfallMm} mm, pasang ${r.tideCm} cm, ${r.reports} laporan warga, risiko ${r.risk}`
    )
    .join("\n");

  const userMessage = `Berikut data pemantauan terkini dari SIGMA AIR:\n\n${dataSnapshot}\n\nBerikan analisis ringkas kondisi saat ini dan rekomendasi mitigasi.`;

  const messages: OpenAIMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage }
  ];

  try {
    const response = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: 400,
        temperature: 0.6
      })
    });

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => ({}))) as GroqResponse;
      const errorMessage = errorPayload.error?.message ?? `Groq API error (${response.status})`;
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    const payload = (await response.json()) as GroqResponse;
    const analysis = payload.choices?.[0]?.message?.content?.trim() ?? "";

    if (!analysis) {
      return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });
    }

    return NextResponse.json({
      analysis,
      model: GROQ_MODEL,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[AI Analysis]", message);
    return NextResponse.json({ error: `Failed to call Groq: ${message}` }, { status: 502 });
  }
}
