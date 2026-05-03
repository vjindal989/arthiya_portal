"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/calc";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, SearchIcon, ExternalLinkIcon } from "lucide-react";

interface Trader {
  id: string;
  name: string;
  firmName: string | null;
  mobile: string | null;
  licenseNo: string | null;
  isActive: boolean;
  totalPurchased: number;
}

function TraderSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

export default function TradersPage() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTraders = useCallback(async () => {
    try {
      const res = await fetch(`/api/traders?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setTraders(data);
    } catch {
      toast.error("Failed to load traders");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchTraders, 300);
    return () => clearTimeout(t);
  }, [fetchTraders]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Traders</h1>
          <p className="text-sm text-muted-foreground">Manage registered traders / buyers</p>
        </div>
        <Link href="/traders/new" className={buttonVariants({})}>
          <PlusIcon />
          Add Trader
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SearchIcon className="size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or firm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Firm Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>License No</TableHead>
                <TableHead className="text-right">Total Purchased</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <TraderSkeleton key={i} />)
              ) : traders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No traders found.{" "}
                    <Link href="/traders/new" className="text-primary hover:underline">
                      Add your first trader
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                traders.map((trader) => (
                  <TableRow key={trader.id}>
                    <TableCell className="font-medium">{trader.name}</TableCell>
                    <TableCell>{trader.firmName ?? "—"}</TableCell>
                    <TableCell>{trader.mobile ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{trader.licenseNo ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(trader.totalPurchased)}
                    </TableCell>
                    <TableCell>
                      {trader.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/traders/${trader.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                        <ExternalLinkIcon />
                      </Link>
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
