import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateCharges } from "@/lib/calc";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  // Verify lot exists and is pending
  const lot = await prisma.lot.findUnique({ where: { id } });
  if (!lot) return NextResponse.json({ error: "Lot not found" }, { status: 404 });
  if (lot.status !== "PENDING") {
    return NextResponse.json({ error: "Lot is not in PENDING status" }, { status: 400 });
  }

  const charges = calculateCharges({
    netWeight: lot.netWeight,
    ratePerQuintal: Number(body.ratePerQuintal),
    commissionRate: Number(body.commissionRate ?? 2.5),
    marketFeeRate: Number(body.marketFeeRate ?? 2),
    rdfRate: Number(body.rdfRate ?? 2),
    labourCharges: Number(body.labourCharges ?? 0),
    gunnyBagCharges: Number(body.gunnyBagCharges ?? 0),
    otherDeductions: Number(body.otherDeductions ?? 0),
  });

  // Create sale record
  const sale = await prisma.lotSale.create({
    data: {
      lotId: id,
      traderId: body.traderId,
      ratePerQuintal: Number(body.ratePerQuintal),
      grossAmount: charges.grossAmount,
      marketFee: charges.marketFee,
      rdf: charges.rdf,
      commission: charges.commission,
      labourCharges: charges.labourCharges,
      gunnyBagCharges: charges.gunnyBagCharges,
      otherDeductions: charges.otherDeductions,
      netFarmerAmount: charges.netFarmerAmount,
      buyerTotalAmount: charges.buyerTotalAmount,
      notes: body.notes,
      saleDate: new Date(),
    },
  });

  // Update lot status
  await prisma.lot.update({ where: { id }, data: { status: "SOLD" } });

  // Ledger entries
  await prisma.ledgerEntry.create({
    data: {
      type: "SALE",
      farmerId: lot.farmerId,
      description: `Lot ${lot.lotNumber} sold — Net farmer amount`,
      credit: charges.netFarmerAmount,
      debit: 0,
      balance: charges.netFarmerAmount,
      referenceId: id,
    },
  });
  await prisma.ledgerEntry.create({
    data: {
      type: "COMMISSION",
      traderId: body.traderId,
      description: `Commission on lot ${lot.lotNumber}`,
      credit: charges.commission,
      debit: 0,
      balance: charges.commission,
      referenceId: id,
    },
  });

  return NextResponse.json(sale, { status: 201 });
}
