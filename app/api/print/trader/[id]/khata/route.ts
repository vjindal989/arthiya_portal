import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [trader, rawSettings] = await Promise.all([
    prisma.trader.findUnique({
      where: { id },
      include: {
        purchases: {
          include: { lot: { include: { farmer: true } } },
          orderBy: { saleDate: "desc" },
        },
        ledgerEntries: { orderBy: { date: "asc" } },
      },
    }),
    prisma.settings.findMany(),
  ]);

  if (!trader) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = Object.fromEntries(rawSettings.map((s) => [s.key, s.value]));
  return NextResponse.json({ trader, settings });
}
