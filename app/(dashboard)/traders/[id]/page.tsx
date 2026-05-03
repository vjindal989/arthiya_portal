export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/calc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeftIcon, PrinterIcon } from "lucide-react";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TraderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const trader = await prisma.trader.findUnique({
    where: { id },
    include: {
      purchases: {
        orderBy: { saleDate: "desc" },
        include: { lot: { include: { farmer: { select: { name: true } } } } },
      },
    },
  });

  if (!trader) notFound();

  const totalPurchased = trader.purchases.reduce((s, p) => s + p.buyerTotalAmount, 0);
  const totalPaid = trader.purchases.filter(p => p.buyerPaid).reduce((s, p) => s + p.buyerTotalAmount, 0);
  const outstandingDue = totalPurchased - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/traders" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}><ArrowLeftIcon /></Link>
        <div>
          <h1 className="text-xl font-semibold">{trader.name}</h1>
          <p className="text-sm text-muted-foreground">{trader.firmName ?? "Independent Trader"}</p>
        </div>
        <div className="ml-auto">
          <a
            href={`/print/trader-khata/${trader.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <PrinterIcon />
            खाता / Khata
          </a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Trader Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Firm Name</p>
              <p className="font-medium">{trader.firmName ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mobile</p>
              <p className="font-medium">{trader.mobile ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">License No.</p>
              <p className="font-medium font-mono text-xs">{trader.licenseNo ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              {trader.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
            </div>
            <div>
              <p className="text-muted-foreground">Bank Account</p>
              <p className="font-medium">{trader.bankAccount ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bank Name</p>
              <p className="font-medium">{trader.bankName ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{trader.address ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card size="sm">
            <CardContent className="pt-3">
              <div className="text-xs text-muted-foreground">Total Purchased</div>
              <div className="text-xl font-bold mt-1">{formatCurrency(totalPurchased)}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="pt-3">
              <div className="text-xs text-muted-foreground">Outstanding Due</div>
              <div className={`text-xl font-bold mt-1 ${outstandingDue > 0 ? "text-destructive" : ""}`}>
                {formatCurrency(outstandingDue)}
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="pt-3">
              <div className="text-xs text-muted-foreground">Total Purchases</div>
              <div className="text-xl font-bold mt-1">{trader.purchases.length} lots</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Purchase History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Lot #</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Buyer Total</TableHead>
                <TableHead>Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trader.purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    No purchases yet
                  </TableCell>
                </TableRow>
              ) : (
                trader.purchases.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(sale.saleDate, "dd/MM/yy")}</TableCell>
                    <TableCell>
                      <Link href={`/lots/${sale.lotId}`} className="font-mono text-xs text-primary hover:underline">
                        {sale.lot.lotNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{sale.lot.farmer.name}</TableCell>
                    <TableCell className="capitalize">{sale.lot.cropType.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-right">₹{sale.ratePerQuintal}/qtl</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(sale.buyerTotalAmount)}</TableCell>
                    <TableCell>
                      {sale.buyerPaid ? (
                        <Badge variant="secondary">Paid</Badge>
                      ) : (
                        <Badge variant="destructive">Unpaid</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
