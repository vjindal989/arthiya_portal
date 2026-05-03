import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [lot, rawSettings] = await Promise.all([
    prisma.lot.findUnique({
      where: { id },
      include: {
        farmer: true,
        sale: { include: { trader: true } },
        settlement: true,
      },
    }),
    prisma.settings.findMany(),
  ]);

  if (!lot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = Object.fromEntries(rawSettings.map((s) => [s.key, s.value]));
  return NextResponse.json({ lot, settings });
}
