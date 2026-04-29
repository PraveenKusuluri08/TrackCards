import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { AppHeader } from "@/components/app-header";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/settings");
  }

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">Settings</h1>
        <ProfileSettingsForm />
      </main>
    </div>
  );
}
