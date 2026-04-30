import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function RunStatusBadge({ status }: { status: string }) {
  if (status === "ok") {
    return (
      <Badge variant="success">
        <CheckCircle2 size={11} />
        ok
      </Badge>
    );
  }
  if (status === "running") {
    return (
      <Badge variant="info">
        <Loader2 size={11} className="animate-spin" />
        running
      </Badge>
    );
  }
  return (
    <Badge variant="danger">
      <AlertCircle size={11} />
      error
    </Badge>
  );
}
