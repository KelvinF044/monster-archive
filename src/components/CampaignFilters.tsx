"use client";

import { useId, useState } from "react";
import type { WatchEra } from "@/components/WatchVideoGrid";

export type CampaignFilter = { type: "campaign" | "release"; id: string } | null;

type FilterGroup = { id: string; label: string; campaigns: WatchEra[] };

function groupCampaigns(eras: WatchEra[]) {
  const groups = new Map<string, FilterGroup>();

  for (const era of eras) {
    const key = era.release?.id ?? era.id;
    const group = groups.get(key);

    if (group) {
      group.campaigns.push(era);
    } else {
      groups.set(key, { id: key, label: era.release?.name ?? era.name, campaigns: [era] });
    }
  }

  return [...groups.values()];
}

function filterStyle(active: boolean) {
  return active
    ? "bg-purple-500 text-white"
    : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10";
}

export function CampaignFilters({
  eras,
  filter,
  onChange,
  allLabel,
  campaignsLabel,
}: {
  eras: WatchEra[];
  filter: CampaignFilter;
  onChange: (filter: CampaignFilter) => void;
  allLabel: string;
  campaignsLabel: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const id = useId();
  const buttonClass = "rounded-full px-5 py-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-purple-400";

  return (
    <div className="mb-9 flex flex-wrap items-start gap-2" role="group" aria-label={campaignsLabel}>
      <button type="button" onClick={() => onChange(null)} aria-pressed={!filter} className={`${buttonClass} ${filterStyle(!filter)}`}>
        {allLabel}
      </button>

      {groupCampaigns(eras).map((group) => {
        const linkedRelease = Boolean(group.campaigns[0].release);
        const groupType = linkedRelease ? "release" : "campaign";
        const selected = filter?.type === groupType && filter.id === group.id;
        const selectedCampaign = linkedRelease && filter?.type === "campaign"
          ? group.campaigns.find(({ id }) => filter.id === id)
          : undefined;
        const expanded = openId === group.id;
        const panelId = `${id}-${group.id}`;

        if (!linkedRelease) {
          return (
            <button key={group.id} type="button" onClick={() => onChange({ type: groupType, id: group.id })} aria-pressed={selected} className={`${buttonClass} ${filterStyle(selected)}`}>
              {group.label}
            </button>
          );
        }

        return (
          <div
            key={group.id}
            className="relative"
            data-campaign-panel
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setOpenId(group.id);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse" && !event.currentTarget.contains(document.activeElement)) {
                setOpenId((current) => current === group.id ? null : current);
              }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setOpenId((current) => current === group.id ? null : current);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && expanded) {
                setOpenId(null);
                event.currentTarget.querySelector<HTMLButtonElement>("[aria-expanded]")?.focus();
              }
            }}
          >
            <div className={`inline-flex rounded-full ${filterStyle(selected || Boolean(selectedCampaign))}`}>
              <button
                type="button"
                onClick={() => onChange({ type: "release", id: group.id })}
                aria-pressed={selected}
                className={`${buttonClass} min-h-11 rounded-r-none`}
              >
                {group.label}{selectedCampaign ? ` · ${selectedCampaign.name}` : ""}
              </button>
              <button
                type="button"
                aria-label={`${campaignsLabel} · ${group.label}`}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpenId(expanded ? null : group.id)}
                className="min-h-11 min-w-11 rounded-r-full border-l border-white/15 px-3 text-sm focus-visible:outline-2 focus-visible:outline-purple-400"
              >
                <span aria-hidden="true">▾</span>
              </button>
            </div>
            <div id={panelId} hidden={!expanded} className="z-20 w-max max-w-[calc(100vw-3rem)] pt-2 md:absolute md:left-0 md:top-full">
              <div className="rounded-xl border border-white/15 bg-[#171820] p-2 shadow-xl">
                {group.campaigns.map((era) => (
                  <button
                    key={era.id}
                    type="button"
                    aria-pressed={selectedCampaign?.id === era.id}
                    onClick={(event) => {
                      onChange({ type: "campaign", id: era.id });
                      const wrapper = event.currentTarget.closest("[data-campaign-panel]");
                      wrapper?.querySelector<HTMLButtonElement>("[aria-expanded]")?.focus();
                      setOpenId(null);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-purple-400 ${selectedCampaign?.id === era.id ? "bg-purple-500 text-white" : "text-zinc-200 hover:bg-white/10"}`}
                  >
                    {era.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
