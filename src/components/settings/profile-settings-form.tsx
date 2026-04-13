"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

type Profile = {
  name: string;
  email: string;
  emailVerified: boolean;
  timezone: string;
  reminderDays: string;
  reminderTime: string;
};

export function ProfileSettingsForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [reminderDays, setReminderDays] = useState<number[]>([7, 3, 1]);
  const [reminderTime, setReminderTime] = useState("09:00");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.name !== undefined) {
          setProfile(data);
          setName(data.name || "");
          setEmail(data.email || "");
          setTimezone(data.timezone || "America/New_York");
          const daysStr = data.reminderDays || "7,3,1";
          const days = (daysStr as string)
            .split(",")
            .map((d: string) => parseInt(d.trim(), 10))
            .filter((n: number) => [1, 3, 7].includes(n));
          setReminderDays(days.length ? days : [7, 3, 1]);
          setReminderTime(data.reminderTime || "09:00");
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const toggleReminderDay = (day: number) => {
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => b - a)
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() !== profile?.email ? email.trim() : undefined,
          timezone,
          reminderDays: reminderDays.length > 0 ? reminderDays.join(",") : "7,3,1",
          reminderTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update");
        setSaving(false);
        return;
      }
      setSuccess("Settings saved!");
      setProfile(data);
      router.refresh();
    } catch {
      setError("Something went wrong");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-700">{success}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <p className="text-sm text-slate-600">Your name and email</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5"
              required
            />
            {profile && !profile.emailVerified && (
              <p className="mt-1 text-xs text-amber-600">
                Changing email will require re-verification.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminder Preferences</CardTitle>
          <p className="text-sm text-slate-600">
            When to receive due-date reminders. Times use your timezone.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Timezone</Label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Remind me before due date</Label>
            <div className="mt-2 flex flex-wrap gap-4">
              {[7, 3, 1].map((day) => (
                <label key={day} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderDays.includes(day)}
                    onChange={() => toggleReminderDay(day)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">
                    {day} {day === 1 ? "day" : "days"} before
                  </span>
                </label>
              ))}
            </div>
            {reminderDays.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">Select at least one option.</p>
            )}
          </div>
          <div>
            <Label htmlFor="reminderTime">Reminder time (your timezone)</Label>
            <Input
              id="reminderTime"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
