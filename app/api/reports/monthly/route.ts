import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear } from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearStr = searchParams.get("year") ?? new Date().getFullYear().toString();
  const year = parseInt(yearStr.split("-")[0]);

  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const result = await Promise.all(
    months.map(async (monthDate) => {
      const from = startOfMonth(monthDate);
      const to = endOfMonth(monthDate);

      const agg = await prisma.lotSale.aggregate({
        where: { lot: { date: { gte: from, lte: to } } },
        _sum: { commission: true, marketFee: true, rdf: true },
        _count: true,
      });

      return {
        month: format(monthDate, "MMMM yyyy"),
        lots: agg._count,
        commission: agg._sum.commission ?? 0,
        marketFee: agg._sum.marketFee ?? 0,
        rdf: agg._sum.rdf ?? 0,
        total: (agg._sum.commission ?? 0) + (agg._sum.marketFee ?? 0) + (agg._sum.rdf ?? 0),
      };
    })
  );

  // Filter out months with no activity
  return NextResponse.json(result.filter((r) => r.lots > 0));
}
