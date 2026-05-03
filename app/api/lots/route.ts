import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateLotNumber } from "@/lib/calc";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const dateFilter = searchParams.get("date");
  const farmerId = searchParams.get("farmerId");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (farmerId) where.farmerId = farmerId;

  if (dateFilter === "today") {
    where.date = { gte: today, lt: tomorrow };
  } else if (dateFilter === "week") {
    where.date = { gte: weekAgo, lt: tomorrow };
  }

  const lots = await prisma.lot.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      farmer: { select: { name: true } },
      sale: { select: { ratePerQuintal: true, netFarmerAmount: true } },
    },
  });

  return NextResponse.json(lots);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Get mandi prefix from settings
  const mandiCodeSetting = await prisma.settings.findUnique({ where: { key: "mandi_code" } });
  const prefix = mandiCodeSetting?.value ?? "MND";
  const lotNumber = generateLotNumber(prefix, body.date ? new Date(body.date) : undefined);

  const lot = await prisma.lot.create({
    data: {
      lotNumber,
      date: body.date ? new Date(body.date) : new Date(),
      season: body.season,
      farmerId: body.farmerId,
      cropType: body.cropType,
      variety: body.variety,
      grossWeight: Number(body.grossWeight),
      deductions: Number(body.deductions ?? 0),
      netWeight: Number(body.netWeight),
      noOfBags: Number(body.noOfBags),
      bagType: body.bagType ?? "Gunny",
      qualityGrade: body.qualityGrade ?? "FAQ",
      arhatiyaMode: body.arhatiyaMode ?? "KUTCHA",
      notes: body.notes,
      status: "PENDING",
    },
  });

  return NextResponse.json(lot, { status: 201 });
}
