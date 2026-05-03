import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const startOfDay = new Date(dateStr + "T00:00:00.000Z");
  const endOfDay = new Date(dateStr + "T23:59:59.999Z");

  const [lots, rawSettings] = await Promise.all([
    prisma.lot.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
      include: {
        farmer: true,
        sale: { include: { trader: true } },
        settlement: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.settings.findMany(),
  ]);

  const settings = Object.fromEntries(rawSettings.map((s) => [s.key, s.value]));
  return NextResponse.json({ date: dateStr, lots, settings });
}
