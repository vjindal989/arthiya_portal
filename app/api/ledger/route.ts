import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get("farmerId");
  const traderId = searchParams.get("traderId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {
    OR: [{ farmer: { userId } }, { trader: { userId } }],
  };

  if (farmerId) where.farmerId = farmerId;
  if (traderId) where.traderId = traderId;

  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
    };
  }

  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: { date: "asc" },
    include: {
      farmer: { select: { id: true, name: true } },
      trader: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(entries);
}
