import { cn } from "@/lib/utils";

type Status = "overdue" | "due_soon" | "paid" | "high_utilization" | "ok";

// Card health: Green = healthy, Yellow = medium risk, Red = high risk
const statusConfig: Record<Status, { label: string; className: string }> = {
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800" },
  due_soon: { label: "Due Soon", className: "bg-amber-100 text-amber-800" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-800" },
  high_utilization: { label: "High Risk", className: "bg-red-100 text-red-800" },
  ok: { label: "Healthy", className: "bg-emerald-100 text-emerald-800" },
};

export function CardStatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] || statusConfig.ok;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
