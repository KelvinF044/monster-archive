import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ReportDecision, ReportFilter, ReportKind, ReportReason } from "./model";

type ReportAction = {
  id: string;
  actor_role: "admin" | "moderator";
  decision: ReportDecision;
  note: string;
  created_at: string;
};

type Report = {
  id: string;
  target_kind: ReportKind;
  title: string;
  content: string;
  reason: ReportReason;
  details: string;
  created_at: string;
  community_report_actions: ReportAction[];
};

const reportPageSize = 20;

export async function getReportQueue(status: ReportFilter, page: number) {
  const db = await createClient();
  const offset = (page - 1) * reportPageSize;
  const { data, error } = await db.from("community_reports")
    .select("id,target_kind,title,content,reason,details,created_at,community_report_actions(id,actor_role,decision,note,created_at)")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .order("id")
    .order("created_at", { referencedTable: "community_report_actions", ascending: true })
    .range(offset, offset + reportPageSize)
    .returns<Report[]>();
  if (error) return null;

  const reports = data.slice(0, reportPageSize);
  const currentPaths = new Map<string, string>();
  if (reports.length > 0 && status !== "hidden") {
    const { data: targets, error: targetError } = await db.rpc("get_community_report_paths", {
      reports: reports.map((report) => report.id),
    });
    if (targetError) return null;
    const paths = Array.isArray(targets) ? targets as { report_id: string; current_path: string | null }[] : [];
    for (const { report_id, current_path } of paths) {
      if (current_path) currentPaths.set(report_id, current_path);
    }
  }
  return { reports: reports.map((report) => ({ ...report, currentPath: currentPaths.get(report.id) })), hasNext: data.length > reportPageSize };
}
