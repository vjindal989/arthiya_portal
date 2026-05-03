"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  nameHindi: z.string().optional(),
  fatherName: z.string().optional(),
  village: z.string().min(1, "Village is required"),
  tehsil: z.string().optional(),
  district: z.string().optional(),
  mobile: z.string().optional(),
  aadhaar: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewFarmerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const farmer = await res.json();
      toast.success("Farmer registered successfully");
      router.push(`/farmers/${farmer.id}`);
    } catch {
      toast.error("Failed to register farmer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/farmers" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
          <ArrowLeftIcon />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Register New Farmer</h1>
          <p className="text-sm text-muted-foreground">Add a farmer to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Full Name *</Label>
              <Input {...register("name")} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Name (Hindi)</Label>
              <Input {...register("nameHindi")} placeholder="हिंदी में नाम" />
            </div>
            <div className="space-y-1.5">
              <Label>Father&apos;s Name</Label>
              <Input {...register("fatherName")} />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input {...register("mobile")} type="tel" placeholder="10-digit number" />
            </div>
            <div className="space-y-1.5">
              <Label>Aadhaar Number</Label>
              <Input {...register("aadhaar")} placeholder="XXXX XXXX XXXX" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Village *</Label>
              <Input {...register("village")} aria-invalid={!!errors.village} />
              {errors.village && <p className="text-xs text-destructive">{errors.village.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tehsil</Label>
              <Input {...register("tehsil")} />
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Input {...register("district")} defaultValue="Haryana" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Account Number</Label>
              <Input {...register("bankAccount")} />
            </div>
            <div className="space-y-1.5">
              <Label>Bank Name</Label>
              <Input {...register("bankName")} placeholder="e.g., SBI, PNB" />
            </div>
            <div className="space-y-1.5">
              <Label>IFSC Code</Label>
              <Input {...register("ifscCode")} className="uppercase" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input {...register("notes")} placeholder="Additional notes..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2Icon className="animate-spin" />}
            Register Farmer
          </Button>
          <Link href="/farmers" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
