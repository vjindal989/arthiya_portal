import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const trader = await prisma.trader.findUnique({
    where: { id, userId },
    include: {
      purchases: {
        include: {
          lot: { include: { farmer: { select: { name: true } } } },
        },
        orderBy: { saleDate: "desc" },
      },
    },
  });

  if (!trader) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trader);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const trader = await prisma.trader.update({
    where: { id, userId },
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
