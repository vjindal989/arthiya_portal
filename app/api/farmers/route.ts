import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const farmers = await prisma.farmer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { village: { contains: search } },
            { mobile: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { lots: true, loans: true } },
      loans: {
        where: { status: "OUTSTANDING" },
        select: { balance: true },
      },
    },
  });

  const result = farmers.map((f) => ({
    ...f,
    loanBalance: f.loans.reduce((s, l) => s + l.balance, 0),
    loans: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const farmer = await prisma.farmer.create({
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
    },
  });

  return NextResponse.json(farmer, { status: 201 });
}
