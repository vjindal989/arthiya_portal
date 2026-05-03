"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/calc";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, ExternalLinkIcon } from "lucide-react";

interface Lot {
  id: string;
  lotNumber: string;
  date: string;
  season: string;
  cropType: string;
  netWeight: number;
  status: string;
  farmer: { name: string };
  sale: { ratePerQuintal: number; netFarmerAmount: number } | null;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING") return <Badge variant="secondary">Pending</Badge>;
  if (status === "SOLD") return <Badge variant="outline">Sold</Badge>;
  if (status === "SETTLED") return <Badge>Settled</Badge>;
  return <Badge variant="ghost">{status}</Badge>;
}

function LotSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

function LotTable({ lots, loading }: { lots: Lot[]; loading: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lot #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Farmer</TableHead>
          <TableHead>Crop</TableHead>
          <TableHead className="text-right">Net Wt (Qtl)</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-14"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <LotSkeleton key={i} />)
        ) : lots.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              No lots found.{" "}
              <Link href="/lots/new" className="text-primary hover:underline">
                Create a new lot
              </Link>
            </TableCell>
          </TableRow>
        ) : (
          lots.map((lot) => (
            <TableRow key={lot.id}>
              <TableCell>
                <Link href={`/lots/${lot.id}`} className="font-mono text-xs text-primary hover:underline">
                  {lot.lotNumber}
                </Link>
              </TableCell>
              <TableCell>{format(new Date(lot.date), "dd/MM/yy")}</TableCell>
              <TableCell>{lot.farmer.name}</TableCell>
              <TableCell className="capitalize">{lot.cropType.replace(/_/g, " ")}</TableCell>
              <TableCell className="text-right">{(lot.netWeight / 100).toFixed(2)}</TableCell>
              <TableCell className="text-right">
                {lot.sale ? `₹${lot.sale.ratePerQuintal}` : "—"}
              </TableCell>
              <TableCell><StatusBadge status={lot.status} /></TableCell>
              <TableCell>
                <Link href={`/lots/${lot.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}><ExternalLinkIcon /></Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default function LotsPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const fetchLots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab.toUpperCase());
      if (dateFilter === "today") params.set("date", "today");
      else if (dateFilter === "week") params.set("date", "week");

      const res = await fetch(`/api/lots?${params.toString()}`);
      const data = await res.json();
      setLots(data);
    } catch {
      toast.error("Failed to load lots");
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFilter]);

  useEffect(() => { fetchLots(); }, [fetchLots]);

  const filtered = lots;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Lots</h1>
          <p className="text-sm text-muted-foreground">Farmer produce arrivals</p>
        </div>
        <Link href="/lots/new" className={buttonVariants({})}>
          <PlusIcon />
          New Lot
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1 text-sm">
          {(["all", "today", "week"] as const).map((f) => (
            <Button
              key={f}
              variant={dateFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter(f)}
            >
              {f === "all" ? "All Dates" : f === "today" ? "Today" : "This Week"}
            </Button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="sold">Sold</TabsTrigger>
          <TabsTrigger value="settled">Settled</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-0">
              <LotTable lots={filtered} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
