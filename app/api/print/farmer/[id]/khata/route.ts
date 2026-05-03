import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [farmer, rawSettings] = await Promise.all([
    prisma.farmer.findUnique({
      where: { id },
      include: {
        lots: {
          include: { sale: { include: { trader: true } }, settlement: true },
          orderBy: { date: "desc" },
        },
        loans: { include: { payments: true }, orderBy: { givenOn: "desc" } },
        ledgerEntries: { orderBy: { date: "asc" } },
      },
    }),
    prisma.settings.findMany(),
  ]);

  if (!farmer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = Object.fromEntries(rawSettings.map((s) => [s.key, s.value]));
  return NextResponse.json({ farmer, settings });
}
