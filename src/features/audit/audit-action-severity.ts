/**
 * The single mapping from an audit action string to its severity.
 *
 * WHY THIS IS ITS OWN MODULE
 * --------------------------
 * This four-branch mapping was duplicated verbatim in `AuditTableView.tsx` and
 * `AuditLogDetailModal.tsx`. The two copies agreed on the rules but wrapped the
 * result in different classes, which made the duplication invisible — until an
 * action is added to one list and not the other, and the same event renders as
 * "destructive" in the table and "neutral" in the detail modal.
 *
 * Severity is a *fact about the action*. The wrapper styling is a
 * *presentation choice*. Only the first belongs in a shared module.
 *
 * It is a `.ts` file rather than living beside the badge because
 * `react-refresh/only-export-components` requires a module to export either
 * components or non-components — never both. Splitting them is what makes the
 * admin lint error-free without disabling the rule.
 */

export type AuditActionSeverity =
  | "neutral"
  | "destructive"
  | "constructive"
  | "modifying";

/** Removes or disables something. */
const DESTRUCTIVE_MARKERS = ["DELETE", "REVOKE", "PURGE", "SUSPEND"];

/** Brings something into existence, or back into use. */
const CONSTRUCTIVE_MARKERS = [
  "CREATE",
  "ACTIVATE",
  "PUBLISH",
  "RESTORE",
  "RENEW",
];

/** Changes something that already exists. */
const MODIFYING_MARKERS = ["UPDATE", "EDIT", "STATUS"];

/**
 * Resolve the severity of an audit action.
 *
 * Order matters and is deliberate: destructive is checked first so an action
 * like `REVOKE_UPDATE` is not misread as a modification. Keep the marker lists
 * in priority order.
 */
export function resolveAuditActionSeverity(
  action: string,
): AuditActionSeverity {
  const normalizedAction = action.toUpperCase();

  if (DESTRUCTIVE_MARKERS.some((marker) => normalizedAction.includes(marker))) {
    return "destructive";
  }
  if (CONSTRUCTIVE_MARKERS.some((marker) => normalizedAction.includes(marker))) {
    return "constructive";
  }
  if (MODIFYING_MARKERS.some((marker) => normalizedAction.includes(marker))) {
    return "modifying";
  }
  return "neutral";
}
