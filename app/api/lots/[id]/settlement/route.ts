import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  // Verify lot exists and is sold
  const lot = await prisma.lot.findUnique({
    where: { id },
    include: { sale: true },
  });
  if (!lot) return NextResponse.json({ error: "Lot not found" }, { status: 404 });
  if (lot.status !== "SOLD") {
    return NextResponse.json({ error: "Lot is not in SOLD status" }, { status: 400 });
  }
  if (!lot.sale) {
    return NextResponse.json({ error: "No sale record found for this lot" }, { status: 400 });
  }

  const grossFarmerAmount = Number(body.grossFarmerAmount ?? lot.sale.netFarmerAmount);
  const loanDeductions = Number(body.loanDeductions ?? 0);
  const otherDeductions = Number(body.otherDeductions ?? 0);
  const netPayable = Math.max(0, grossFarmerAmount - loanDeductions - otherDeductions);

  // Create settlement
  const settlement = await prisma.settlement.create({
    data: {
      lotId: id,
      grossFarmerAmount,
      loanDeductions,
      otherDeductions,
      netPayable,
      paymentMethod: body.paymentMethod,
      paymentRef: body.paymentRef,
      paidOn: new Date(),
    },
  });

  // Update lot status and add ledger entry
  await prisma.lot.update({ where: { id }, data: { status: "SETTLED" } });
  await prisma.ledgerEntry.create({
    data: {
      type: "SETTLEMENT",
      farmerId: lot.farmerId,
      description: `Settlement for lot ${lot.lotNumber} — ${body.paymentMethod ?? "Cash"}`,
      debit: netPayable,
      credit: 0,
      balance: 0,
      referenceId: id,
    },
  });

  // If loan deductions > 0, reduce outstanding loans (oldest first)
  if (loanDeductions > 0) {
    const outstandingLoans = await prisma.loan.findMany({
      where: { farmerId: lot.farmerId, status: "OUTSTANDING" },
      orderBy: { givenOn: "asc" },
    });

    let remaining = loanDeductions;
    for (const loan of outstandingLoans) {
      if (remaining <= 0) break;
      const deducted = Math.min(remaining, loan.balance);
      const newBalance = loan.balance - deducted;
      const newRecovered = loan.recovered + deducted;
      remaining -= deducted;

      await prisma.loan.update({
        where: { id: loan.id },
        data: {
          recovered: newRecovered,
          balance: newBalance,
          status: newBalance <= 0 ? "RECOVERED" : "OUTSTANDING",
        },
      });
    }
  }

  return NextResponse.json(settlement, { status: 201 });
}
