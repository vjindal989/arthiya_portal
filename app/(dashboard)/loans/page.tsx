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

interface Loan {
  id: string;
  farmerId: string;
  amount: number;
  purpose: string | null;
  givenOn: string;
  recovered: number;
  balance: number;
  status: string;
  farmer: { name: string; village: string };
}

function LoanStatusBadge({ status }: { status: string }) {
  if (status === "OUTSTANDING") return <Badge variant="destructive">Outstanding</Badge>;
  return <Badge variant="secondary">Recovered</Badge>;
}

function LoanSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

function LoanTable({ loans, loading }: { loans: Loan[]; loading: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Farmer</TableHead>
          <TableHead>Purpose</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Recovered</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-14"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <LoanSkeleton key={i} />)
        ) : loans.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              No loans found.{" "}
              <Link href="/loans/new" className="text-primary hover:underline">
                Record a loan
              </Link>
            </TableCell>
          </TableRow>
        ) : (
          loans.map((loan) => (
            <TableRow key={loan.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{loan.farmer.name}</p>
                  <p className="text-xs text-muted-foreground">{loan.farmer.village}</p>
                </div>
              </TableCell>
              <TableCell>{loan.purpose ?? "—"}</TableCell>
              <TableCell>{format(new Date(loan.givenOn), "dd/MM/yy")}</TableCell>
              <TableCell className="text-right">{formatCurrency(loan.amount)}</TableCell>
              <TableCell className="text-right">{formatCurrency(loan.recovered)}</TableCell>
              <TableCell className="text-right font-medium">
                {loan.balance > 0 ? (
                  <span className="text-destructive">{formatCurrency(loan.balance)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell><LoanStatusBadge status={loan.status} /></TableCell>
              <TableCell>
                <Link href={`/farmers/${loan.farmerId}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}><ExternalLinkIcon /></Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === "outstanding") params.set("status", "OUTSTANDING");
      else if (activeTab === "recovered") params.set("status", "RECOVERED");

      const res = await fetch(`/api/loans?${params.toString()}`);
      const data = await res.json();
      setLoans(data);
    } catch {
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const totalOutstanding = loans
    .filter((l) => l.status === "OUTSTANDING")
    .reduce((s, l) => s + l.balance, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Loans Book</h1>
          <p className="text-sm text-muted-foreground">
            Total Outstanding:{" "}
            <span className="font-semibold text-destructive">{formatCurrency(totalOutstanding)}</span>
          </p>
        </div>
        <Link href="/loans/new" className={buttonVariants({})}>
          <PlusIcon />
          New Loan
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
          <TabsTrigger value="recovered">Fully Recovered</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-0">
              <LoanTable loans={loans} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
