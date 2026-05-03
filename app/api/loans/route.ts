import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const farmerId = searchParams.get("farmerId");

  const loans = await prisma.loan.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(farmerId ? { farmerId } : {}),
    },
    orderBy: { givenOn: "desc" },
    include: {
      farmer: { select: { name: true, village: true } },
    },
  });

  return NextResponse.json(loans);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const amount = Number(body.amount);

  const loan = await prisma.loan.create({
    data: {
      farmerId: body.farmerId,
      amount,
      purpose: body.purpose,
      givenOn: body.givenOn ? new Date(body.givenOn) : new Date(),
      recovered: 0,
      balance: amount,
      notes: body.notes,
      status: "OUTSTANDING",
    },
  });

  // Create ledger entry
  await prisma.ledgerEntry.create({
    data: {
      type: "LOAN",
      farmerId: body.farmerId,
      description: `Loan given — ${body.purpose ?? "Advance"}`,
      debit: amount,
      credit: 0,
      balance: -amount,
      referenceId: loan.id,
    },
  });

  return NextResponse.json(loan, { status: 201 });
}
