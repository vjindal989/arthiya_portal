import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  const date = dateStr ? new Date(dateStr) : new Date();
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const [lotsToday, salesAggregate, settlementsCount] = await Promise.all([
    prisma.lot.findMany({
      where: { date: { gte: date, lt: nextDay } },
      select: { netWeight: true },
    }),
    prisma.lotSale.aggregate({
      where: { lot: { date: { gte: date, lt: nextDay } } },
      _sum: { grossAmount: true, commission: true, marketFee: true },
      _count: true,
    }),
    prisma.settlement.count({
      where: { lot: { date: { gte: date, lt: nextDay } } },
    }),
  ]);

  return NextResponse.json({
    date: dateStr ?? date.toISOString().split("T")[0],
    lots: lotsToday.length,
    totalWeight: lotsToday.reduce((s, l) => s + l.netWeight, 0),
    totalSaleAmount: salesAggregate._sum.grossAmount ?? 0,
    totalCommission: salesAggregate._sum.commission ?? 0,
    totalMarketFee: salesAggregate._sum.marketFee ?? 0,
    settlements: settlementsCount,
  });
}
