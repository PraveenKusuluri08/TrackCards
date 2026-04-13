import React from "react";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeCard } from "@/lib/utils";
import { EditCardForm } from "@/components/cards/edit-card-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EditCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const card = await prisma.creditCard.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!card) {
    notFound();
  }

  const serializedCard = serializeCard({ ...card });

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-xl font-bold text-teal-600">
            PayTrack AI
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8">
        <EditCardForm card={serializedCard as React.ComponentProps<typeof EditCardForm>["card"]} />
      </main>
    </div>
  );
}
