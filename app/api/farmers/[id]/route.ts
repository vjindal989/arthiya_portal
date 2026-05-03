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

  const farmer = await prisma.farmer.findUnique({
    where: { id, userId },
    include: {
      _count: { select: { lots: true, loans: true } },
      loans: { where: { status: "OUTSTANDING" }, select: { balance: true } },
    },
  });

  if (!farmer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...farmer,
    loanBalance: farmer.loans.reduce((s, l) => s + l.balance, 0),
  });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const farmer = await prisma.farmer.update({
    where: { id, userId },
    data: {
      name: body.name,
      nameHindi: body.nameHindi,
      fatherName: body.fatherName,
      village: body.village,
      tehsil: body.tehsil,
      district: body.district,
      mobile: body.mobile,
      aadhaar: body.aadhaar,
      bankAccount: body.bankAccount,
      bankName: body.bankName,
      ifscCode: body.ifscCode,
      notes: body.notes,
      isActive: body.isActive,
    },
  });

  return NextResponse.json(farmer);
}
