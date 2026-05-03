import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season") ?? "2024-25";

  const [lots, sales] = await Promise.all([
    prisma.lot.findMany({
      where: { season },
      select: { netWeight: true, cropType: true, status: true },
    }),
    prisma.lotSale.aggregate({
      where: { lot: { season } },
      _sum: { commission: true, marketFee: true, rdf: true, netFarmerAmount: true },
    }),
  ]);

  // Count crop types
  const cropCounts: Record<string, number> = {};
  for (const lot of lots) {
    cropCounts[lot.cropType] = (cropCounts[lot.cropType] ?? 0) + 1;
  }
  const topCrop =
    Object.entries(cropCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, " ") ?? "—";

  return NextResponse.json({
    season,
    totalLots: lots.length,
    totalWeight: lots.reduce((s, l) => s + l.netWeight, 0),
    totalCommission: sales._sum.commission ?? 0,
    totalMarketFee: sales._sum.marketFee ?? 0,
    totalRdf: sales._sum.rdf ?? 0,
    totalNetFarmerAmount: sales._sum.netFarmerAmount ?? 0,
    topCrop,
  });
}
