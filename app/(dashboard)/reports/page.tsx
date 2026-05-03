"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/calc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCwIcon } from "lucide-react";

interface DailyReport {
  date: string;
  lots: number;
  totalWeight: number;
  totalCommission: number;
  totalMarketFee: number;
  totalSaleAmount: number;
  settlements: number;
}

interface SeasonSummary {
  season: string;
  totalLots: number;
  totalWeight: number;
  totalCommission: number;
  totalMarketFee: number;
  totalRdf: number;
  totalNetFarmerAmount: number;
  topCrop: string;
}

interface MonthlyCommission {
  month: string;
  lots: number;
  commission: number;
  marketFee: number;
  rdf: number;
  total: number;
}

function LoadingRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedSeason, setSelectedSeason] = useState("2024-25");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [seasonSummary, setSeasonSummary] = useState<SeasonSummary | null>(null);
  const [monthlyCommissions, setMonthlyCommissions] = useState<MonthlyCommission[]>([]);

  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  const fetchDailyReport = async () => {
    setLoadingDaily(true);
    try {
      const res = await fetch(`/api/reports/daily?date=${selectedDate}`);
      const data = await res.json();
      setDailyReport(data);
    } catch {
      toast.error("Failed to load daily report");
    } finally {
      setLoadingDaily(false);
    }
  };

  const fetchSeasonSummary = async () => {
    setLoadingSeason(true);
    try {
      const res = await fetch(`/api/reports/season?season=${encodeURIComponent(selectedSeason)}`);
      const data = await res.json();
      setSeasonSummary(data);
    } catch {
      toast.error("Failed to load season summary");
    } finally {
      setLoadingSeason(false);
    }
  };

  const fetchMonthlyCommissions = async () => {
    setLoadingMonthly(true);
    try {
      const res = await fetch(`/api/reports/monthly?year=${selectedMonth.split("-")[0]}`);
      const data = await res.json();
      setMonthlyCommissions(data);
    } catch {
      toast.error("Failed to load monthly commissions");
    } finally {
      setLoadingMonthly(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Business analytics and summaries</p>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="season">Season Summary</TabsTrigger>
          <TabsTrigger value="monthly">Commission Statement</TabsTrigger>
        </TabsList>

        {/* Daily Report */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Daily Report</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <Button onClick={fetchDailyReport} disabled={loadingDaily}>
                  {loadingDaily ? <RefreshCwIcon className="animate-spin" /> : <RefreshCwIcon />}
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {dailyReport && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Total Lots", value: dailyReport.lots.toString() },
                { label: "Total Weight (Qtl)", value: formatNumber(dailyReport.totalWeight / 100) },
                { label: "Total Sale Amount", value: formatCurrency(dailyReport.totalSaleAmount) },
                { label: "Commission Earned", value: formatCurrency(dailyReport.totalCommission) },
                { label: "Market Fee", value: formatCurrency(dailyReport.totalMarketFee) },
                { label: "Settlements Done", value: dailyReport.settlements.toString() },
              ].map((item) => (
                <Card key={item.label} size="sm">
                  <CardContent className="pt-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-bold mt-0.5">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Season Summary */}
        <TabsContent value="season" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Season Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className="space-y-1.5">
                  <Label>Season</Label>
                  <Input
                    placeholder="e.g., 2024-25"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="w-32"
                  />
                </div>
                <Button onClick={fetchSeasonSummary} disabled={loadingSeason}>
                  {loadingSeason ? <RefreshCwIcon className="animate-spin" /> : <RefreshCwIcon />}
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {seasonSummary && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Lots", value: seasonSummary.totalLots.toString() },
                { label: "Total Weight (Qtl)", value: formatNumber(seasonSummary.totalWeight / 100) },
                { label: "Commission Earned", value: formatCurrency(seasonSummary.totalCommission) },
                { label: "Market Fee Collected", value: formatCurrency(seasonSummary.totalMarketFee) },
                { label: "RDF Collected", value: formatCurrency(seasonSummary.totalRdf) },
                { label: "Net Paid to Farmers", value: formatCurrency(seasonSummary.totalNetFarmerAmount) },
                { label: "Top Crop", value: seasonSummary.topCrop },
              ].map((item) => (
                <Card key={item.label} size="sm">
                  <CardContent className="pt-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-bold mt-0.5">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Monthly Commission */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Monthly Commission Statement</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className="space-y-1.5">
                  <Label>Year</Label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-40"
                  />
                </div>
                <Button onClick={fetchMonthlyCommissions} disabled={loadingMonthly}>
                  {loadingMonthly ? <RefreshCwIcon className="animate-spin" /> : <RefreshCwIcon />}
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {monthlyCommissions.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Lots</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Market Fee</TableHead>
                      <TableHead className="text-right">RDF</TableHead>
                      <TableHead className="text-right">Total Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingMonthly ? (
                      <LoadingRows cols={6} />
                    ) : (
                      <>
                        {monthlyCommissions.map((row) => (
                          <TableRow key={row.month}>
                            <TableCell className="font-medium">{row.month}</TableCell>
                            <TableCell className="text-right">{row.lots}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.commission)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.marketFee)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.rdf)}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(row.total)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/40 font-bold">
                          <TableCell>TOTAL</TableCell>
                          <TableCell className="text-right">
                            {monthlyCommissions.reduce((s, r) => s + r.lots, 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(monthlyCommissions.reduce((s, r) => s + r.commission, 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(monthlyCommissions.reduce((s, r) => s + r.marketFee, 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(monthlyCommissions.reduce((s, r) => s + r.rdf, 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(monthlyCommissions.reduce((s, r) => s + r.total, 0))}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
