import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      farmer: { select: { id: true, name: true, village: true } },
      payments: { orderBy: { paidOn: "desc" } },
    },
  });

  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(loan);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  const loan = await prisma.loan.update({
    where: { id },
    data: {
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      purpose: body.purpose,
      recovered: body.recovered !== undefined ? Number(body.recovered) : undefined,
      balance: body.balance !== undefined ? Number(body.balance) : undefined,
      status: body.status,
      notes: body.notes,
    },
  });

  return NextResponse.json(loan);
}
