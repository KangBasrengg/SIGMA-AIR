import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "sigma-admin-2026";
const COOKIE_NAME = "sigma-admin-auth";
const SESSION_TOKEN = "sigma-air-authenticated";

// POST /api/admin/login — verify password and set auth cookie
export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set(COOKIE_NAME, SESSION_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/login — logout (clear cookie)
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}

// GET /api/admin/login — check if authenticated
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);

  if (token?.value === SESSION_TOKEN) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
