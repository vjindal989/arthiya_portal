"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon, WheatIcon, MailIcon } from "lucide-react";

const detailsSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Enter a valid phone number").max(15),
    firmName: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type DetailsForm = z.infer<typeof detailsSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [formData, setFormData] = useState<DetailsForm | null>(null);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<DetailsForm>({ resolver: zodResolver(detailsSchema) });

  const sendOtp = async (data: DetailsForm) => {
    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to send OTP"); return; }
      setFormData(data);
      setStep("otp");
      toast.success(`OTP sent to ${data.email}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSendingOtp(false);
    }
  };

  const resendOtp = async () => {
    if (!formData) return;
    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to resend OTP"); return; }
      toast.success("New OTP sent");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyAndCreate = async () => {
    if (!formData || !otp) { toast.error("Enter the OTP"); return; }
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, otp }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Registration failed"); return; }
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground">
            <WheatIcon className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Arhatiya Portal</h1>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{step === "details" ? "Create Account" : "Verify Email"}</CardTitle>
            <CardDescription>
              {step === "details"
                ? "Fill in your details to get started"
                : `Enter the 6-digit code sent to ${formData?.email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "details" ? (
              <form onSubmit={handleSubmit(sendOtp)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" placeholder="Ram Lal" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="agent@mandi.com" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mobile">Phone Number *</Label>
                  <Input id="mobile" type="tel" placeholder="9876543210" autoComplete="tel" {...register("mobile")} aria-invalid={!!errors.mobile} />
                  {errors.mobile && <p className="text-xs text-destructive">{errors.mobile.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="firmName">Firm Name</Label>
                  <Input id="firmName" placeholder="Ram Lal & Sons" {...register("firmName")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" {...register("password")} aria-invalid={!!errors.password} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword} />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={sendingOtp}>
                  {sendingOtp ? <Loader2Icon className="animate-spin" /> : <MailIcon className="size-4" />}
                  Send OTP to Email
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
                </p>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="text-center text-2xl tracking-widest font-mono"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                  <p className="text-xs text-muted-foreground">Valid for 10 minutes</p>
                </div>

                <Button className="w-full" onClick={verifyAndCreate} disabled={verifying || otp.length < 6}>
                  {verifying && <Loader2Icon className="animate-spin" />}
                  Create Account
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setStep("details")}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={resendOtp}
                    disabled={sendingOtp}
                  >
                    {sendingOtp ? "Sending..." : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
