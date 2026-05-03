import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const trader = await prisma.trader.findUnique({
    where: { id },
    include: {
      purchases: {
        include: {
          lot: {
            include: { farmer: { select: { name: true } } },
          },
        },
        orderBy: { saleDate: "desc" },
      },
    },
  });

  if (!trader) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trader);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  const trader = await prisma.trader.update({
    where: { id },
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
      isActive: body.isActive,
    },
  });

  return NextResponse.json(trader);
}
