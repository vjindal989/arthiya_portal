"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2Icon, SaveIcon } from "lucide-react";

const schema = z.object({
  firm_name: z.string().min(1),
  firm_name_hindi: z.string().optional(),
  pan_number: z.string().optional(),
  mc_license_no: z.string().optional(),
  mobile1: z.string().optional(),
  mobile2: z.string().optional(),
  shop_no: z.string().optional(),
  address: z.string().optional(),
  market_committee_name: z.string().optional(),
  mandi_name: z.string().min(1),
  mandi_code: z.string().min(1),
  commission_rate: z.coerce.number().min(0).max(20),
  market_fee_rate: z.coerce.number().min(0).max(20),
  rdf_rate: z.coerce.number().min(0).max(20),
  labour_rate: z.coerce.number().min(0),
  current_season: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) as Resolver<FormData> });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        reset({
          firm_name: data.firm_name ?? "Arhatiya Portal",
          firm_name_hindi: data.firm_name_hindi ?? "",
          pan_number: data.pan_number ?? "",
          mc_license_no: data.mc_license_no ?? "",
          mobile1: data.mobile1 ?? "",
          mobile2: data.mobile2 ?? "",
          shop_no: data.shop_no ?? "",
          address: data.address ?? "",
          market_committee_name: data.market_committee_name ?? "",
          mandi_name: data.mandi_name ?? "",
          mandi_code: data.mandi_code ?? "",
          commission_rate: Number(data.commission_rate ?? 2.5),
          market_fee_rate: Number(data.market_fee_rate ?? 2),
          rdf_rate: Number(data.rdf_rate ?? 2),
          labour_rate: Number(data.labour_rate ?? 0),
          current_season: data.current_season ?? "2024-25",
        });
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure portal, firm details and charge rates</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Firm Details */}
        <Card>
          <CardHeader><CardTitle>Firm Details (Letterhead)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Firm Name (English)</Label>
              <Input {...register("firm_name")} aria-invalid={!!errors.firm_name} />
              {errors.firm_name && <p className="text-xs text-destructive">{errors.firm_name.message}</p>}
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Firm Name (Hindi — appears on Form-J/I)</Label>
              <Input {...register("firm_name_hindi")} placeholder="मैं० राम लाल एंड सन्स आढ़ती" />
              <p className="text-xs text-muted-foreground">Shown large on printed forms. Use Hindi script.</p>
            </div>
            <div className="space-y-1.5">
              <Label>PAN Number</Label>
              <Input {...register("pan_number")} placeholder="ABCDE1234F" />
            </div>
            <div className="space-y-1.5">
              <Label>M.C. License No.</Label>
              <Input {...register("mc_license_no")} placeholder="4980/KTH/BOARD" />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile 1</Label>
              <Input {...register("mobile1")} placeholder="9034453960" />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile 2</Label>
              <Input {...register("mobile2")} placeholder="9991163383" />
            </div>
            <div className="space-y-1.5">
              <Label>Shop No.</Label>
              <Input {...register("shop_no")} placeholder="65" />
            </div>
            <div className="space-y-1.5">
              <Label>Market Committee Name</Label>
              <Input {...register("market_committee_name")} placeholder="Kaithal" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Full Address</Label>
              <Input {...register("address")} placeholder="दुकान नं. 65, अतिरिक्त अनाज मण्डी, कैथल" />
            </div>
            <div className="space-y-1.5">
              <Label>Mandi Name</Label>
              <Input {...register("mandi_name")} placeholder="Karnal Grain Mandi" />
            </div>
            <div className="space-y-1.5">
              <Label>Mandi Code</Label>
              <Input {...register("mandi_code")} placeholder="KNL001" />
            </div>
            <div className="space-y-1.5">
              <Label>Current Season</Label>
              <Input {...register("current_season")} placeholder="Rabi 2025-26" />
            </div>
          </CardContent>
        </Card>

        {/* Charge Rates */}
        <Card>
          <CardHeader><CardTitle>Charge Rates (APMC Haryana)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Arhatiya Commission Rate (%)</Label>
              <Input {...register("commission_rate")} type="number" step="0.1" />
              {errors.commission_rate && (
                <p className="text-xs text-destructive">{errors.commission_rate.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Deducted from farmer (आढ़त)</p>
            </div>
            <div className="space-y-1.5">
              <Label>Market Fee Rate / मार्किट टैक्स (%)</Label>
              <Input {...register("market_fee_rate")} type="number" step="0.1" />
              <p className="text-xs text-muted-foreground">Added to buyer total</p>
            </div>
            <div className="space-y-1.5">
              <Label>RDF / उपकर (%)</Label>
              <Input {...register("rdf_rate")} type="number" step="0.1" />
              <p className="text-xs text-muted-foreground">Rural Development Fund — from buyer</p>
            </div>
            <div className="space-y-1.5">
              <Label>Default Labour Rate ₹/qtl (मजदूरी)</Label>
              <Input {...register("labour_rate")} type="number" step="0.5" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
          Save Settings
        </Button>
      </form>
    </div>
  );
}
