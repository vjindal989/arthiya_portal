"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/calc";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon, SearchIcon, ExternalLinkIcon, Loader2Icon } from "lucide-react";

interface Farmer {
  id: string;
  name: string;
  village: string;
  tehsil: string | null;
  mobile: string | null;
  isActive: boolean;
  _count: { lots: number; loans: number };
  loanBalance: number;
}

const farmerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  village: z.string().min(1, "Village is required"),
  tehsil: z.string().min(1),
  mobile: z.string().min(1),
  aadhaar: z.string().min(1),
  bankAccount: z.string().min(1),
  bankName: z.string().min(1),
  ifscCode: z.string().min(1),
  notes: z.string().optional(),
});

type FarmerForm = z.infer<typeof farmerSchema>;

function FarmerSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FarmerForm>({ resolver: zodResolver(farmerSchema) });

  const fetchFarmers = useCallback(async () => {
    try {
      const res = await fetch(`/api/farmers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setFarmers(data);
    } catch {
      toast.error("Failed to load farmers");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchFarmers, 300);
    return () => clearTimeout(t);
  }, [fetchFarmers]);

  const onSubmit = async (data: FarmerForm) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Farmer added successfully");
      reset();
      setDialogOpen(false);
      fetchFarmers();
    } catch {
      toast.error("Failed to add farmer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Farmers</h1>
          <p className="text-sm text-muted-foreground">Manage registered farmers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <PlusIcon />
            Add Farmer
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Farmer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label>Full Name *</Label>
                  <Input {...register("name")} aria-invalid={!!errors.name} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Village *</Label>
                  <Input {...register("village")} aria-invalid={!!errors.village} />
                  {errors.village && <p className="text-xs text-destructive">{errors.village.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Tehsil</Label>
                  <Input {...register("tehsil")} />
                </div>
                <div className="space-y-1">
                  <Label>Mobile</Label>
                  <Input {...register("mobile")} type="tel" />
                </div>
                <div className="space-y-1">
                  <Label>Aadhaar</Label>
                  <Input {...register("aadhaar")} />
                </div>
                <div className="space-y-1">
                  <Label>Bank Account</Label>
                  <Input {...register("bankAccount")} />
                </div>
                <div className="space-y-1">
                  <Label>Bank Name</Label>
                  <Input {...register("bankName")} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>IFSC Code</Label>
                  <Input {...register("ifscCode")} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2Icon className="animate-spin" />}
                  Save Farmer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SearchIcon className="size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or village..."
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
                <TableHead>Village / Tehsil</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead className="text-right">Active Lots</TableHead>
                <TableHead className="text-right">Loan Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <FarmerSkeleton key={i} />)
              ) : farmers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No farmers found.{" "}
                    <button
                      onClick={() => setDialogOpen(true)}
                      className="text-primary hover:underline"
                    >
                      Add your first farmer
                    </button>
                  </TableCell>
                </TableRow>
              ) : (
                farmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">{farmer.name}</TableCell>
                    <TableCell>
                      <span>{farmer.village}</span>
                      {farmer.tehsil && (
                        <span className="text-muted-foreground"> / {farmer.tehsil}</span>
                      )}
                    </TableCell>
                    <TableCell>{farmer.mobile ?? "—"}</TableCell>
                    <TableCell className="text-right">{farmer._count.lots}</TableCell>
                    <TableCell className="text-right">
                      {farmer.loanBalance > 0 ? (
                        <span className="text-destructive font-medium">
                          {formatCurrency(farmer.loanBalance)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {farmer.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                      <TableCell>
                        <Link href={`/farmers/${farmer.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
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
