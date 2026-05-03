"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/calc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  farmer?: { id: string; name: string } | null;
  trader?: { id: string; name: string } | null;
}

interface Farmer {
  id: string;
  name: string;
}

interface Trader {
  id: string;
  name: string;
  firmName: string | null;
}

function LedgerSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [farmerId, setFarmerId] = useState("all");
  const [traderId, setTraderId] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/farmers").then((r) => r.json()),
      fetch("/api/traders").then((r) => r.json()),
    ])
      .then(([f, t]) => {
        setFarmers(f);
        setTraders(t);
      })
      .catch(() => {});
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (farmerId && farmerId !== "all") params.set("farmerId", farmerId);
      if (traderId && traderId !== "all") params.set("traderId", traderId);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/ledger?${params.toString()}`);
      if (!res.ok) {
        // Ledger entries might not exist via dedicated route, build from available data
        setEntries([]);
        return;
      }
      const data = await res.json();
      setEntries(data);
    } catch {
      toast.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, [farmerId, traderId, dateFrom, dateTo]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Compute running balance
  const runningEntries = entries.reduce<(LedgerEntry & { runningBalance: number })[]>(
    (acc, entry) => {
      const prev = acc[acc.length - 1];
      const runningBalance = (prev?.runningBalance ?? 0) + entry.credit - entry.debit;
      return [...acc, { ...entry, runningBalance }];
    },
    []
  );

  const filtered = filterType === "all"
    ? runningEntries
    : runningEntries.filter((e) => e.type === filterType);

  const totalDebit = filtered.reduce((s, e) => s + e.debit, 0);
  const totalCredit = filtered.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Ledger</h1>
        <p className="text-sm text-muted-foreground">Account entries and transaction history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Farmer</Label>
            <Select value={farmerId} onValueChange={(v) => { setFarmerId(v ?? "all"); setTraderId("all"); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Farmers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Farmers</SelectItem>
                {farmers.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Trader</Label>
            <Select value={traderId} onValueChange={(v) => { setTraderId(v ?? "all"); setFarmerId("all"); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Traders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Traders</SelectItem>
                {traders.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}{t.firmName ? ` — ${t.firmName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>From Date</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>To Date</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-xs text-muted-foreground">Total Debit</p>
            <p className="font-bold text-destructive">{formatCurrency(totalDebit)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-xs text-muted-foreground">Total Credit</p>
            <p className="font-bold text-primary">{formatCurrency(totalCredit)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-xs text-muted-foreground">Net Balance</p>
            <p className={`font-bold ${totalCredit - totalDebit >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatCurrency(totalCredit - totalDebit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Party</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <LedgerSkeleton key={i} />)
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No ledger entries found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.date), "dd/MM/yy")}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {entry.farmer?.name ?? entry.trader?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.debit > 0 ? (
                        <span className="text-destructive">{formatCurrency(entry.debit)}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.credit > 0 ? (
                        <span className="text-primary">{formatCurrency(entry.credit)}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(entry.runningBalance)}
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
