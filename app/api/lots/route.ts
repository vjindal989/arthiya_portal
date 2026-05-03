import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLotNumber } from "@/lib/calc";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const where: Record<string, unknown> = { farmer: { userId } };

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
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Get mandi prefix from user-scoped settings, fall back to global
  const mandiCodeSetting = await prisma.settings.findFirst({
    where: { OR: [{ key: `${userId}:mandi_code` }, { key: "mandi_code" }] },
    orderBy: { key: "desc" },
  });
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
