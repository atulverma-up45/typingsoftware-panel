import type { FC } from "react";
import { cn } from "../../../lib/cn";
import {
  resolveAuditActionSeverity,
  type AuditActionSeverity,
} from "../audit-action-severity";

/**
 * The audit action pill.
 *
 * Replaces two hand-rolled copies of the same mapping (one in
 * `AuditTableView.tsx`, one in `AuditLogDetailModal.tsx`) that had drifted into
 * different wrapper classes. Severity now comes from
 * `resolveAuditActionSeverity`; only the size is a local choice.
 */

const SEVERITY_CLASSES: Record<AuditActionSeverity, string> = {
  neutral: "bg-blue-50 text-blue-700 border-blue-200",
  destructive: "bg-rose-50 text-rose-700 border-rose-200",
  constructive: "bg-emerald-50 text-emerald-700 border-emerald-200",
  modifying: "bg-amber-50 text-amber-700 border-amber-200",
};

interface AuditActionBadgeProps {
  action: string;
  /** `compact` for table rows and cards, `prominent` for detail headers. */
  variant?: "compact" | "prominent";
}

export const AuditActionBadge: FC<AuditActionBadgeProps> = ({
  action,
  variant = "compact",
}) => (
  <span
    className={cn(
      "inline-block font-mono font-bold border",
      variant === "prominent"
        ? "text-xs px-2.5 py-1 rounded-lg"
        : "text-[10px] px-2 py-0.5 rounded-md",
      SEVERITY_CLASSES[resolveAuditActionSeverity(action)],
    )}
  >
    {action}
  </span>
);
