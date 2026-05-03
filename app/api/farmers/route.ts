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

  const farmers = await prisma.farmer.findMany({
    where: {
      userId,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { village: { contains: search } },
              { mobile: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { lots: true, loans: true } },
      loans: { where: { status: "OUTSTANDING" }, select: { balance: true } },
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
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const farmer = await prisma.farmer.create({
    data: {
      userId,
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
