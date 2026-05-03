"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";

interface Farmer {
  id: string;
  name: string;
  village: string;
}

const schema = z.object({
  farmerId: z.string().min(1, "Farmer is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  purpose: z.string().optional(),
  givenOn: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function NewLoanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedFarmerId = searchParams.get("farmerId") ?? "";

  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmerSearch, setFarmerSearch] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      farmerId: preselectedFarmerId,
      givenOn: new Date().toISOString().split("T")[0],
    },
  });

  const fetchFarmers = useCallback(async () => {
    try {
      const res = await fetch(`/api/farmers?search=${encodeURIComponent(farmerSearch)}`);
      const data = await res.json();
      setFarmers(data);
    } catch {}
  }, [farmerSearch]);

  useEffect(() => {
    const t = setTimeout(fetchFarmers, 200);
    return () => clearTimeout(t);
  }, [fetchFarmers]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const loan = await res.json();
      toast.success("Loan recorded successfully");
      router.push(`/farmers/${loan.farmerId}`);
    } catch {
      toast.error("Failed to record loan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/loans" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}><ArrowLeftIcon /></Link>
        <div>
          <h1 className="text-xl font-semibold">Record New Loan</h1>
          <p className="text-sm text-muted-foreground">Give an advance to a farmer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Loan Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Search Farmer</Label>
              <Input
                placeholder="Type to search..."
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Select Farmer *</Label>
              <Select
                value={watch("farmerId") ?? ""}
                onValueChange={(v) => setValue("farmerId", v ?? "")}
              >
                <SelectTrigger className="w-full" aria-invalid={!!errors.farmerId}>
                  <SelectValue placeholder="Select farmer" />
                </SelectTrigger>
                <SelectContent>
                  {farmers.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} — {f.village}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.farmerId && <p className="text-xs text-destructive">{errors.farmerId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Amount (₹) *</Label>
              <Input {...register("amount")} type="number" step="0.01" aria-invalid={!!errors.amount} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Purpose</Label>
              <Input {...register("purpose")} placeholder="e.g., Seeds, Fertilizer, Personal" />
            </div>

            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input {...register("givenOn")} type="date" aria-invalid={!!errors.givenOn} />
              {errors.givenOn && <p className="text-xs text-destructive">{errors.givenOn.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input {...register("notes")} placeholder="Additional notes..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2Icon className="animate-spin" />}
            Record Loan
          </Button>
          <Link href="/loans" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}

export default function NewLoanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <NewLoanContent />
    </Suspense>
  );
}
