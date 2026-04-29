import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimelineEvent } from "@/lib/timeline";

function severityClasses(severity: TimelineEvent["severity"]) {
  if (severity === "high") return "bg-rose-50 text-rose-800 border-rose-200";
  if (severity === "medium") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export function UpcomingTimeline({ events }: { events: TimelineEvent[] }) {
  const upcoming = events.slice(0, 6);

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Upcoming timeline</CardTitle>
            <p className="text-sm text-slate-500">What’s coming next</p>
          </div>
          <Link href="/timeline" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming events yet.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((e, idx) => (
              <li key={`${e.type}-${e.href}-${idx}`}>
                <Link
                  href={e.href}
                  className={`block rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-white ${severityClasses(e.severity)}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{e.title}</span>
                    <span className="text-xs tabular-nums opacity-80">
                      {e.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs opacity-90">{e.subtitle}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

