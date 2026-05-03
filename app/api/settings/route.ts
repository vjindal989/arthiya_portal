import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch user-scoped settings; fall back to global (no-prefix) key
  const all = await prisma.settings.findMany({
    where: {
      OR: [
        { key: { startsWith: `${userId}:` } },
        // global keys (no colon prefix) as fallback
        { NOT: { key: { contains: ":" } } },
      ],
    },
  });

  const result: Record<string, string> = {};

  // First populate with global defaults
  for (const s of all) {
    if (!s.key.includes(":")) result[s.key] = s.value;
  }
  // Then override with user-specific values
  for (const s of all) {
    if (s.key.startsWith(`${userId}:`)) {
      result[s.key.slice(userId.length + 1)] = s.value;
    }
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const upserts = Object.entries(body).map(([key, value]) => {
    const scopedKey = `${userId}:${key}`;
    return prisma.settings.upsert({
      where: { key: scopedKey },
      create: { key: scopedKey, value: String(value) },
      update: { value: String(value) },
    });
  });

  await Promise.all(upserts);

  return NextResponse.json({ success: true });
}
