import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().split("T")[0];
  const fromStr = searchParams.get("from") ?? today;
  const toStr = searchParams.get("to") ?? today;

  const from = new Date(fromStr + "T00:00:00.000Z");
  const to = new Date(toStr + "T23:59:59.999Z");

  const [settlements, loans, loanPayments, rawSettings] = await Promise.all([
    prisma.settlement.findMany({
      where: { paidOn: { gte: from, lte: to } },
      include: { lot: { include: { farmer: true, sale: { include: { trader: true } } } } },
      orderBy: { paidOn: "asc" },
    }),
    prisma.loan.findMany({
      where: { givenOn: { gte: from, lte: to } },
      include: { farmer: true },
      orderBy: { givenOn: "asc" },
    }),
    prisma.loanPayment.findMany({
      where: { paidOn: { gte: from, lte: to } },
      include: { loan: { include: { farmer: true } } },
      orderBy: { paidOn: "asc" },
    }),
    prisma.settings.findMany(),
  ]);

  const settings = Object.fromEntries(rawSettings.map((s) => [s.key, s.value]));

  // Build unified cash entries
  const entries: {
    date: Date;
    type: "receipt" | "payment";
    description: string;
    amount: number;
    party: string;
    method?: string | null;
  }[] = [];

  for (const s of settlements) {
    entries.push({
      date: s.paidOn ?? s.createdAt,
      type: "payment",
      description: `Settlement — ${s.lot.farmer.name} / Lot ${s.lot.lotNumber}`,
      amount: s.netPayable,
      party: s.lot.farmer.name,
      method: s.paymentMethod,
    });
  }

  for (const l of loans) {
    entries.push({
      date: l.givenOn,
      type: "payment",
      description: `Loan — ${l.farmer.name}`,
      amount: l.amount,
      party: l.farmer.name,
      method: "Cash",
    });
  }

  for (const lp of loanPayments) {
    entries.push({
      date: lp.paidOn,
      type: "receipt",
      description: `Loan Recovery — ${lp.loan.farmer.name}`,
      amount: lp.amount,
      party: lp.loan.farmer.name,
      method: "Cash",
    });
  }

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({ from: fromStr, to: toStr, entries, settings });
}
