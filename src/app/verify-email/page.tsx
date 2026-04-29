"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const modeParam = searchParams.get("mode");
  const [email, setEmail] = useState(emailParam || "");
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setResending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(
          data.emailDelivery === "log"
            ? "Dev mode: verification link printed in your server terminal."
            : "Verification email sent! Check your inbox."
        );
      } else {
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setMessage("Something went wrong");
    }
    setResending(false);
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        emailParam
          ? `We sent a verification link to ${emailParam}. Click the link in that email to activate your account.`
          : "We sent a verification link to your email. Click the link to activate your account."
      }
      footer={
        <Link href="/login" className="font-medium text-teal-600 hover:text-teal-700">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4">
        <Link href="/login">
          <Button className="w-full">Go to sign in</Button>
        </Link>
        <form onSubmit={handleResend} className="border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600 mb-3">Didn&apos;t receive the email?</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" variant="outline" disabled={resending}>
              {resending ? "Sending..." : "Resend"}
            </Button>
          </div>
          {message && (
            <p className={`mt-2 text-sm ${message.includes("sent") ? "text-teal-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
