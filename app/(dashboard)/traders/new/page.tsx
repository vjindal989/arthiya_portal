"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  firmName: z.string().optional(),
  mobile: z.string().optional(),
  licenseNo: z.string().optional(),
  address: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  creditLimit: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewTraderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) as Resolver<FormData> });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/traders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const trader = await res.json();
      toast.success("Trader registered successfully");
      router.push(`/traders/${trader.id}`);
    } catch {
      toast.error("Failed to register trader");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/traders" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}><ArrowLeftIcon /></Link>
        <div>
          <h1 className="text-xl font-semibold">Register New Trader</h1>
          <p className="text-sm text-muted-foreground">Add a buyer / trader to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Trader Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Full Name *</Label>
              <Input {...register("name")} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Firm Name</Label>
              <Input {...register("firmName")} placeholder="Trade/Company name" />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input {...register("mobile")} type="tel" />
            </div>
            <div className="space-y-1.5">
              <Label>APMC License No.</Label>
              <Input {...register("licenseNo")} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Address</Label>
              <Input {...register("address")} />
            </div>
            <div className="space-y-1.5">
              <Label>Credit Limit (₹)</Label>
              <Input {...register("creditLimit")} type="number" placeholder="0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Account Number</Label>
              <Input {...register("bankAccount")} />
            </div>
            <div className="space-y-1.5">
              <Label>Bank Name</Label>
              <Input {...register("bankName")} />
            </div>
            <div className="space-y-1.5">
              <Label>IFSC Code</Label>
              <Input {...register("ifscCode")} className="uppercase" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2Icon className="animate-spin" />}
            Register Trader
          </Button>
          <Link href="/traders" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
