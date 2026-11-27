export const reportReasons = ["spam", "harassment", "inappropriate", "other"] as const;
export const reportFilters = ["pending", "resolved", "dismissed", "hidden"] as const;
export const reportDecisions = ["resolve", "dismiss", "hide", "restore"] as const;

export type ReportReason = (typeof reportReasons)[number];
export type ReportFilter = (typeof reportFilters)[number];
export type ReportDecision = (typeof reportDecisions)[number];
export type ReportKind = "profile" | "list";

export type ReportStatus = "sent" | "duplicate" | "limited" | "unavailable" | "self" | "invalid" | "error";
export type ReportState = { result?: ReportStatus };
export const moderationHref = "/admin/moderation";

export function queueHref(status: ReportFilter, page = 1) {
  const params = new URLSearchParams();
  if (status !== "pending") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  return params.size ? `${moderationHref}?${params}` : moderationHref;
}
