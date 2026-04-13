import Link from "next/link";
import { Button } from "@/components/ui/button";

type QuickActionsProps = {
  firstCardId?: string;
  hasCards: boolean;
};

export function QuickActions({ firstCardId, hasCards }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={hasCards && firstCardId ? `/cards/${firstCardId}/history` : "/cards/add"}>
        <Button size="sm" variant="outline" className="border-amber-200 hover:bg-amber-50">
          Record Payment
        </Button>
      </Link>
      <Link href="/cards/add">
        <Button size="sm" variant="outline" className="border-amber-200 hover:bg-amber-50">
          Add Card
        </Button>
      </Link>
      {hasCards && firstCardId && (
        <>
          <Link href={`/cards/${firstCardId}`}>
            <Button size="sm" variant="outline" className="border-amber-200 hover:bg-amber-50">
              Update Balance
            </Button>
          </Link>
          <Link href={`/cards/${firstCardId}/history`}>
            <Button size="sm" variant="outline" className="border-teal-200 bg-teal-50/50 hover:bg-teal-50">
              Pay Minimum
            </Button>
          </Link>
          <Link href={`/cards/${firstCardId}/history`}>
            <Button size="sm" variant="outline" className="border-teal-200 bg-teal-50/50 hover:bg-teal-50">
              Pay Full Balance
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
