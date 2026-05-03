"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CROP_OPTIONS, QUALITY_GRADES, BAG_TYPES, ARHATIYA_MODES } from "@/lib/calc";
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
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";

interface Farmer {
  id: string;
  name: string;
  village: string;
}

const schema = z.object({
  farmerId: z.string().min(1, "Farmer is required"),
  cropType: z.string().min(1, "Crop type is required"),
  variety: z.string().optional(),
  grossWeight: z.coerce.number().positive("Must be positive"),
  deductions: z.coerce.number().min(0).default(0),
  noOfBags: z.coerce.number().int().positive("Must be positive"),
  bagType: z.string().min(1),
  qualityGrade: z.string().min(1),
  arhatiyaMode: z.string().min(1),
  season: z.string().min(1, "Season is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function NewLotContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedFarmerId = searchParams.get("farmerId") ?? "";

  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [season, setSeason] = useState("2024-25");

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
      bagType: "Gunny",
      qualityGrade: "FAQ",
      arhatiyaMode: "KUTCHA",
      deductions: 0,
      season: season,
    },
  });

  const grossWeight = watch("grossWeight") ?? 0;
  const deductions = watch("deductions") ?? 0;
  const netWeight = Math.max(0, (grossWeight || 0) - (deductions || 0));

  // Load settings for default season
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((settings: Record<string, string>) => {
        if (settings.current_season) {
          setSeason(settings.current_season);
          setValue("season", settings.current_season);
        }
      })
      .catch(() => {});
  }, [setValue]);

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
      const payload = { ...data, netWeight };
      const res = await fetch("/api/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed");
      }
      const lot = await res.json();
      toast.success(`Lot ${lot.lotNumber} created`);
      router.push(`/lots/${lot.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create lot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/lots" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}><ArrowLeftIcon /></Link>
        <div>
          <h1 className="text-xl font-semibold">New Lot Entry</h1>
          <p className="text-sm text-muted-foreground">Record a new produce arrival</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Farmer & Season</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Select Farmer *</Label>
              <Input
                placeholder="Search farmer name..."
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
                className="mb-1"
              />
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
              <Label>Season *</Label>
              <Input {...register("season")} placeholder="e.g., 2024-25" aria-invalid={!!errors.season} />
              {errors.season && <p className="text-xs text-destructive">{errors.season.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Produce Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Crop Type *</Label>
              <Select
                value={watch("cropType") ?? ""}
                onValueChange={(v) => setValue("cropType", v ?? "")}
              >
                <SelectTrigger className="w-full" aria-invalid={!!errors.cropType}>
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  {CROP_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cropType && <p className="text-xs text-destructive">{errors.cropType.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Variety</Label>
              <Input {...register("variety")} placeholder="e.g., HD-2967" />
            </div>
            <div className="space-y-1.5">
              <Label>Quality Grade</Label>
              <Select value={watch("qualityGrade") ?? ""} onValueChange={(v) => setValue("qualityGrade", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Gross Weight (kg) *</Label>
              <Input {...register("grossWeight")} type="number" step="0.01" aria-invalid={!!errors.grossWeight} />
              {errors.grossWeight && <p className="text-xs text-destructive">{errors.grossWeight.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Deductions (kg)</Label>
              <Input {...register("deductions")} type="number" step="0.01" defaultValue={0} />
            </div>
            <div className="space-y-1.5">
              <Label>Net Weight (kg)</Label>
              <Input
                value={netWeight.toFixed(2)}
                readOnly
                className="bg-muted font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Net Weight (Quintals)</Label>
              <Input
                value={(netWeight / 100).toFixed(2)}
                readOnly
                className="bg-muted font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <Label>No. of Bags *</Label>
              <Input {...register("noOfBags")} type="number" aria-invalid={!!errors.noOfBags} />
              {errors.noOfBags && <p className="text-xs text-destructive">{errors.noOfBags.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Bag Type</Label>
              <Select value={watch("bagType") ?? ""} onValueChange={(v) => setValue("bagType", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BAG_TYPES.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Arhatiya Mode</Label>
              <Select value={watch("arhatiyaMode") ?? ""} onValueChange={(v) => setValue("arhatiyaMode", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARHATIYA_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Notes</Label>
              <Input {...register("notes")} placeholder="Any additional notes..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2Icon className="animate-spin" />}
            Create Lot
          </Button>
          <Link href="/lots" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}

export default function NewLotPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <NewLotContent />
    </Suspense>
  );
}
