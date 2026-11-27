"use client";

import Link from "next/link";
import { ReportDecisionForm } from "@/components/CommunityReportForms";
import { useLanguage } from "@/components/LanguageProvider";
import { authMessages } from "@/lib/auth/messages";
import type { getReportQueue } from "@/lib/moderation/data";
import { moderationMessages } from "@/lib/moderation/messages";
import { queueHref, reportFilters, type ReportFilter } from "@/lib/moderation/model";

export default function ModerationQueue({ queue, status, page }: {
  queue: Awaited<ReturnType<typeof getReportQueue>>;
  status: ReportFilter;
  page: number;
}) {
  const { locale } = useLanguage();
  const copy = moderationMessages(locale);
  const dateTime = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo",
  });

  return (
    <main className="community-surface min-h-[65vh] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black sm:text-4xl">{copy.heading}</h1>
          <Link href="/account" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:border-purple-400">
            {authMessages(locale).account}
          </Link>
        </div>
        <nav aria-label={copy.heading} className="mb-6 flex flex-wrap gap-2">
          {reportFilters.map((filter) => (
            <Link key={filter} href={queueHref(filter)} prefetch={false} aria-current={status === filter ? "page" : undefined}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold ${status === filter ? "border-purple-400/50 bg-purple-500/15" : "border-white/15 text-zinc-300 hover:border-purple-400"}`}>
              {copy.filters[filter]}
            </Link>
          ))}
        </nav>
        {!queue ? <p role="alert" className="text-red-200">{copy.loadError}</p> : queue.reports.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#15111d] p-5 text-zinc-300">{copy.empty}</p>
        ) : (
          <ul className="space-y-4">
            {queue.reports.map((report) => (
              <li key={report.id} className="rounded-xl border border-white/10 bg-[#15111d] p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-purple-300">{copy.kind[report.target_kind]} · {copy.reasons[report.reason]}</p>
                    <h2 className="mt-1 break-words text-lg font-bold">{report.title}</h2>
                  </div>
                  <time dateTime={report.created_at} className="text-xs text-zinc-400">{dateTime.format(new Date(report.created_at))}</time>
                </div>
                {report.content && <blockquote className="mt-3 whitespace-pre-wrap break-words border-l-2 border-white/15 pl-3 text-sm text-zinc-300">{report.content}</blockquote>}
                {report.details && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-200">{report.details}</p>}
                {report.currentPath && (
                  <Link href={report.currentPath} prefetch={false} className="mt-3 inline-block text-sm font-semibold text-purple-200 hover:underline">{copy.view}</Link>
                )}
                {report.community_report_actions.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-sm text-zinc-300">
                    <h3 className="font-bold text-white">{copy.log}</h3>
                    <ul className="space-y-2">
                      {report.community_report_actions.map((action) => (
                        <li key={action.id} className="break-words">
                          {copy.decisions[action.decision]} · {copy.role[action.actor_role]} · {dateTime.format(new Date(action.created_at))}
                          {action.note && <p className="whitespace-pre-wrap">{action.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {status === "pending" && <ReportDecisionForm id={report.id} decisions={report.currentPath ? ["resolve", "dismiss", "hide"] : ["resolve", "dismiss"]} />}
                {status === "hidden" && <ReportDecisionForm id={report.id} decisions={["restore"]} />}
              </li>
            ))}
          </ul>
        )}
        {queue && (page > 1 || queue.hasNext) && (
          <div className="mt-6 flex gap-4 text-sm font-semibold text-purple-200">
            {page > 1 && <Link href={queueHref(status, page - 1)}>{copy.previous}</Link>}
            {queue.hasNext && <Link href={queueHref(status, page + 1)}>{copy.next}</Link>}
          </div>
        )}
      </div>
    </main>
  );
}
