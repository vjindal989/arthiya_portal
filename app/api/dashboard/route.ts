import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayLots, pendingSale, pendingSettlement, todayCommissionAgg, outstandingLoansAgg] =
    await Promise.all([
      prisma.lot.count({ where: { date: { gte: today, lt: tomorrow } } }),
      prisma.lot.count({ where: { status: "PENDING" } }),
      prisma.lot.count({ where: { status: "SOLD" } }),
      prisma.lotSale.aggregate({
        where: { lot: { date: { gte: today, lt: tomorrow } } },
        _sum: { commission: true },
      }),
      prisma.loan.aggregate({
        where: { status: "OUTSTANDING" },
        _sum: { balance: true },
      }),
    ]);

  return NextResponse.json({
    todayLots,
    pendingSale,
    pendingSettlement,
    todayCommission: todayCommissionAgg._sum.commission ?? 0,
    outstandingLoans: outstandingLoansAgg._sum.balance ?? 0,
  });
}
