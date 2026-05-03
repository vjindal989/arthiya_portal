export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/calc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  IndianRupeeIcon,
  TrendingDownIcon,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayLots, pendingSale, pendingSettlement, todayCommission, outstandingLoans, recentLots] =
    await Promise.all([
      prisma.lot.count({ where: { date: { gte: today, lt: tomorrow } } }),
      prisma.lot.count({ where: { status: "PENDING" } }),
      prisma.lot.count({ where: { status: "SOLD" } }),
      prisma.lotSale.aggregate({
        where: { lot: { date: { gte: today, lt: tomorrow } } },
        _sum: { commission: true },
      }),
      prisma.loan.aggregate({
        where: { status: "OUTSTANDING" },
        _sum: { balance: true },
      }),
      prisma.lot.findMany({
        take: 10,
        orderBy: { date: "desc" },
        include: { farmer: { select: { name: true } } },
      }),
    ]);

  return {
    todayLots,
    pendingSale,
    pendingSettlement,
    todayCommission: todayCommission._sum.commission ?? 0,
    outstandingLoans: outstandingLoans._sum.balance ?? 0,
    recentLots,
  };
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING") return <Badge variant="secondary">Pending</Badge>;
  if (status === "SOLD") return <Badge variant="outline">Sold</Badge>;
  if (status === "SETTLED") return <Badge>Settled</Badge>;
  return <Badge variant="ghost">{status}</Badge>;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const kpis = [
    {
      title: "Today's Lots",
      value: data.todayLots.toString(),
      icon: ShoppingBagIcon,
      description: "Arrivals today",
    },
    {
      title: "Pending Sale",
      value: data.pendingSale.toString(),
      icon: ClockIcon,
      description: "Awaiting sale",
    },
    {
      title: "Pending Settlement",
      value: data.pendingSettlement.toString(),
      icon: CheckCircleIcon,
      description: "Sold, not settled",
    },
    {
      title: "Today's Commission",
      value: formatCurrency(data.todayCommission),
      icon: IndianRupeeIcon,
      description: "Commission earned today",
    },
    {
      title: "Outstanding Loans",
      value: formatCurrency(data.outstandingLoans),
      icon: TrendingDownIcon,
      description: "Total loan balance",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} size="sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-xs text-muted-foreground">{kpi.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Lots */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Lots</CardTitle>
            <Link href="/lots" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot #</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead className="text-right">Net Weight (Qtl)</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentLots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No lots yet. <Link href="/lots/new" className="text-primary hover:underline">Create your first lot</Link>
                  </TableCell>
                </TableRow>
              ) : (
                data.recentLots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell>
                      <Link href={`/lots/${lot.id}`} className="font-mono text-xs text-primary hover:underline">
                        {lot.lotNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{lot.farmer.name}</TableCell>
                    <TableCell className="capitalize">{lot.cropType.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-right">
                      {(lot.netWeight / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>{format(lot.date, "dd/MM/yy")}</TableCell>
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
    </div>
  );
}
