export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/calc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PhoneIcon, MapPinIcon, CreditCardIcon, PlusIcon, ArrowLeftIcon, PrinterIcon } from "lucide-react";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getFarmerData(id: string) {
  const farmer = await prisma.farmer.findUnique({
    where: { id },
    include: {
      lots: {
        orderBy: { date: "desc" },
        include: { sale: true },
      },
      loans: {
        orderBy: { givenOn: "desc" },
      },
      ledgerEntries: {
        orderBy: { date: "desc" },
        take: 50,
      },
    },
  });
  return farmer;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING") return <Badge variant="secondary">Pending</Badge>;
  if (status === "SOLD") return <Badge variant="outline">Sold</Badge>;
  if (status === "SETTLED") return <Badge>Settled</Badge>;
  return <Badge variant="ghost">{status}</Badge>;
}

function LoanStatusBadge({ status }: { status: string }) {
  if (status === "OUTSTANDING") return <Badge variant="destructive">Outstanding</Badge>;
  return <Badge variant="secondary">Recovered</Badge>;
}

export default async function FarmerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const farmer = await getFarmerData(id);

  if (!farmer) notFound();

  const outstandingLoans = farmer.loans
    .filter((l) => l.status === "OUTSTANDING")
    .reduce((sum, l) => sum + l.balance, 0);

  const activeLots = farmer.lots.filter((l) => l.status !== "SETTLED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/farmers" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
          <ArrowLeftIcon />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">{farmer.name}</h1>
          <p className="text-sm text-muted-foreground">
            {farmer.village}{farmer.tehsil ? `, ${farmer.tehsil}` : ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={`/print/farmer-khata/${farmer.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <PrinterIcon />
            खाता / Khata
          </a>
          <Link href={`/lots/new?farmerId=${farmer.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <PlusIcon />
            New Lot
          </Link>
          <Link href={`/loans/new?farmerId=${farmer.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <PlusIcon />
            New Loan
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Farmer Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Farmer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Village</p>
                <p className="font-medium flex items-center gap-1">
                  <MapPinIcon className="size-3.5" />
                  {farmer.village}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Tehsil</p>
                <p className="font-medium">{farmer.tehsil ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Mobile</p>
                <p className="font-medium flex items-center gap-1">
                  <PhoneIcon className="size-3.5" />
                  {farmer.mobile ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Aadhaar</p>
                <p className="font-medium">{farmer.aadhaar ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bank Account</p>
                <p className="font-medium flex items-center gap-1">
                  <CreditCardIcon className="size-3.5" />
                  {farmer.bankAccount ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Bank Name</p>
                <p className="font-medium">{farmer.bankName ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">IFSC</p>
                <p className="font-medium font-mono text-xs">{farmer.ifscCode ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                {farmer.isActive ? (
                  <Badge variant="secondary">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Card */}
        <div className="space-y-3">
          <Card size="sm">
            <CardContent className="pt-3">
              <div className="text-xs text-muted-foreground">Outstanding Loan Balance</div>
              <div className={`text-xl font-bold mt-1 ${outstandingLoans > 0 ? "text-destructive" : ""}`}>
                {formatCurrency(outstandingLoans)}
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="pt-3">
              <div className="text-xs text-muted-foreground">Total Lots</div>
              <div className="text-xl font-bold mt-1">{farmer.lots.length}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="pt-3">
              <div className="text-xs text-muted-foreground">Active (Unsettled) Lots</div>
              <div className="text-xl font-bold mt-1">{activeLots}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lots">
        <TabsList>
          <TabsTrigger value="lots">Lots ({farmer.lots.length})</TabsTrigger>
          <TabsTrigger value="loans">Loans ({farmer.loans.length})</TabsTrigger>
          <TabsTrigger value="ledger">Ledger ({farmer.ledgerEntries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="lots">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Crop</TableHead>
                    <TableHead className="text-right">Net Wt (Qtl)</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmer.lots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        No lots yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    farmer.lots.map((lot) => (
                      <TableRow key={lot.id}>
                        <TableCell>
                          <Link href={`/lots/${lot.id}`} className="font-mono text-xs text-primary hover:underline">
                            {lot.lotNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{format(lot.date, "dd/MM/yy")}</TableCell>
                        <TableCell className="capitalize">{lot.cropType.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-right">{(lot.netWeight / 100).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {lot.sale ? `₹${lot.sale.ratePerQuintal}` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {lot.sale ? formatCurrency(lot.sale.netFarmerAmount) : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={lot.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Recovered</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmer.loans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        No loans
                      </TableCell>
                    </TableRow>
                  ) : (
                    farmer.loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>{format(loan.givenOn, "dd/MM/yy")}</TableCell>
                        <TableCell>{loan.purpose ?? "—"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(loan.amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(loan.recovered)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(loan.balance)}
                        </TableCell>
                        <TableCell>
                          <LoanStatusBadge status={loan.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmer.ledgerEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No ledger entries
                      </TableCell>
                    </TableRow>
                  ) : (
                    farmer.ledgerEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(entry.date, "dd/MM/yy")}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
