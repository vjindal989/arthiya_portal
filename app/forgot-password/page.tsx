"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon, WheatIcon, MailCheckIcon } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to send reset email"); return; }
      setSentEmail(data.email);
      setSent(true);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground">
            <WheatIcon className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Forgot Password</h1>
          <p className="text-sm text-muted-foreground">
            {sent ? "Check your inbox" : "Enter your email to reset your password"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {sent
                ? `A password reset link has been sent to ${sentEmail}`
                : "We'll send a reset link to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <MailCheckIcon className="size-12 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Open the email and click the reset link. Check your spam folder if you don&apos;t see it.
                </p>
                <p className="text-xs text-muted-foreground">Link expires in 1 hour.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="agent@mandi.com"
                    autoComplete="email"
                    {...register("email")}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2Icon className="animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline font-medium">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
