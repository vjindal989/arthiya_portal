import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.settings.findMany();

  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const upserts = Object.entries(body).map(([key, value]) =>
    prisma.settings.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    })
  );

  await Promise.all(upserts);

  return NextResponse.json({ success: true });
}
