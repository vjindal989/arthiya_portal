import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayLots, pendingSale, pendingSettlement, todayCommissionAgg, outstandingLoansAgg] =
    await Promise.all([
      prisma.lot.count({ where: { farmer: { userId }, date: { gte: today, lt: tomorrow } } }),
      prisma.lot.count({ where: { farmer: { userId }, status: "PENDING" } }),
      prisma.lot.count({ where: { farmer: { userId }, status: "SOLD" } }),
      prisma.lotSale.aggregate({
        where: { lot: { farmer: { userId }, date: { gte: today, lt: tomorrow } } },
        _sum: { commission: true },
      }),
      prisma.loan.aggregate({
        where: { farmer: { userId }, status: "OUTSTANDING" },
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
