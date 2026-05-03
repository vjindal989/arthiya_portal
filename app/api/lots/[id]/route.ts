import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const lot = await prisma.lot.findUnique({
    where: { id },
    include: {
      farmer: {
        select: {
          id: true,
          name: true,
          village: true,
          tehsil: true,
          mobile: true,
          bankAccount: true,
          bankName: true,
        },
      },
      sale: {
        include: {
          trader: { select: { id: true, name: true, firmName: true } },
        },
      },
      settlement: true,
    },
  });

  if (!lot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lot);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  const lot = await prisma.lot.update({
    where: { id },
    data: {
      cropType: body.cropType,
      variety: body.variety,
      grossWeight: body.grossWeight !== undefined ? Number(body.grossWeight) : undefined,
      deductions: body.deductions !== undefined ? Number(body.deductions) : undefined,
      netWeight: body.netWeight !== undefined ? Number(body.netWeight) : undefined,
      noOfBags: body.noOfBags !== undefined ? Number(body.noOfBags) : undefined,
      bagType: body.bagType,
      qualityGrade: body.qualityGrade,
      arhatiyaMode: body.arhatiyaMode,
      status: body.status,
      notes: body.notes,
    },
  });

  return NextResponse.json(lot);
}
