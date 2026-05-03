import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const farmer = await prisma.farmer.findUnique({
    where: { id },
    include: {
      _count: { select: { lots: true, loans: true } },
      loans: {
        where: { status: "OUTSTANDING" },
        select: { balance: true },
      },
    },
  });

  if (!farmer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...farmer,
    loanBalance: farmer.loans.reduce((s, l) => s + l.balance, 0),
  });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  const farmer = await prisma.farmer.update({
    where: { id },
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
