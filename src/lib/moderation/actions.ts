"use server";

import { revalidatePath } from "next/cache";
import { getAccount, getSessionClaims } from "@/lib/auth/session";
import { isListId } from "@/lib/lists/model";
import { validHandle } from "@/lib/profiles/model";
import { createClient } from "@/lib/supabase/server";
import { moderationHref, reportDecisions, reportReasons, type ReportDecision, type ReportReason, type ReportState } from "./model";

export async function submitReport(_: ReportState, form: FormData): Promise<ReportState> {
  const kind = form.get("kind");
  const target = form.get("target");
  const reason = form.get("reason") as ReportReason;
  const details = form.get("details");
  if (!await getSessionClaims()) return { result: "error" };
  if (
    !(kind === "profile" && typeof target === "string" && validHandle(target) || kind === "list" && isListId(target)) ||
    !reportReasons.includes(reason) || typeof details !== "string" || Array.from(details).length > 400
  ) return { result: "invalid" };

  const db = await createClient();
  const { data, error } = await db.rpc("submit_community_report", {
    kind, target, category: reason, context: details,
  });
  if (error) return { result: "error" };
  if (data === "sent" || data === "duplicate" || data === "limited" || data === "unavailable" || data === "self" || data === "invalid") {
    return { result: data };
  }
  return { result: "error" };
}

export async function decideReport(_: { failed?: boolean }, form: FormData): Promise<{ failed?: boolean }> {
  const account = await getAccount();
  if (!account || account.role === "member") return { failed: true };
  const report = form.get("report");
  const action = form.get("action") as ReportDecision;
  const note = form.get("note");
  if (!isListId(report) || !reportDecisions.includes(action) || typeof note !== "string" || Array.from(note).length > 400) {
    return { failed: true };
  }

  const db = await createClient();
  const { data, error } = await db.rpc("decide_community_report", { report, action, internal_note: note });
  if (error || data !== true) return { failed: true };
  revalidatePath(moderationHref);
  if (action === "hide") {
    revalidatePath("/u/[handle]", "page");
    revalidatePath("/lists/[id]", "page");
  }
  return {};
}
