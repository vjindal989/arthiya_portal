import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const traders = await prisma.trader.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { firmName: { contains: search } },
            { mobile: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      purchases: {
        select: { buyerTotalAmount: true },
      },
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
  const body = await request.json();

  const trader = await prisma.trader.create({
    data: {
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
