import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const traders = await prisma.trader.findMany({
    where: {
      userId,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { firmName: { contains: search } },
              { mobile: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      purchases: { select: { buyerTotalAmount: true } },
    },
  });

  const result = traders.map((t) => ({
    ...t,
    totalPurchased: t.purchases.reduce((s, p) => s + p.buyerTotalAmount, 0),
    purchases: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const trader = await prisma.trader.create({
    data: {
      userId,
      name: body.name,
      firmName: body.firmName,
      mobile: body.mobile,
      licenseNo: body.licenseNo,
      address: body.address,
      bankAccount: body.bankAccount,
      bankName: body.bankName,
      ifscCode: body.ifscCode,
      creditLimit: body.creditLimit ? Number(body.creditLimit) : null,
    },
  });

  return NextResponse.json(trader, { status: 201 });
}
