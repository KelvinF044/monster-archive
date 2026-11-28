"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useAdminText } from "@/components/useAdminText";

type Era = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  release_id: string | null;
  video_count: number | null;
};

type Release = { id: string; name: string };

type Props = {
  initialEras: Era[];
  initialReleases: Release[];
};

type EraFilter = "all" | "active" | "inactive";

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleUpperCase("en-US");
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sortEras(items: Era[]) {
  return [...items].sort(
    (a, b) =>
      a.display_order - b.display_order ||
      a.name.localeCompare(b.name)
  );
}

function getNextOrder(eras: Era[]) {
  return eras.reduce(
    (highest, era) => Math.max(highest, era.display_order),
    0
  ) + 10;
}

export default function AdminEraManager({ initialEras, initialReleases }: Props) {
  const router = useRouter();
  const t = useAdminText();
  const supabase = createClient();

  const [eras, setEras] = useState(() => sortEras(initialEras));
  const [releases, setReleases] = useState(initialReleases);
  const [releaseName, setReleaseName] = useState("");
  const [newReleaseId, setNewReleaseId] = useState("");
  const [editingReleaseId, setEditingReleaseId] = useState("");
  const [newName, setNewName] = useState("");
  const [newOrder, setNewOrder] = useState(() =>
    String(getNextOrder(initialEras))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingOrder, setEditingOrder] = useState("");
  const [filter, setFilter] = useState<EraFilter>("all");
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredEras = useMemo(
    () =>
      eras.filter((era) => {
        if (filter === "active") return era.is_active;
        if (filter === "inactive") return !era.is_active;
        return true;
      }),
    [eras, filter]
  );

  const activeCount = eras.filter((era) => era.is_active).length;
  const inactiveCount = eras.length - activeCount;

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function validateEra(name: string, orderValue: string) {
    const normalizedName = normalizeName(name);
    const order = Number(orderValue);

    if (!normalizedName) {
      throw new Error(t("Enter an era name."));
    }

    if (normalizedName.length > 60) {
      throw new Error(t("The era name cannot exceed 60 characters."));
    }

    if (!Number.isSafeInteger(order) || order < 0 || order > 99999) {
      throw new Error(t("Display order must be a whole number between 0 and 99999."));
    }

    return { normalizedName, order };
  }

  async function handleCreateRelease(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const name = releaseName.trim();
    const slug = createSlug(name);
    if (!slug) {
      setError(t("This name cannot be converted into a valid URL identifier."));
      return;
    }

    setSaving(true);

    try {
      const { data, error: releaseError } = await supabase
        .from("watch_releases")
        .insert({ name, slug })
        .select("id, name")
        .single();

      if (releaseError) {
        setError(t(releaseError.code === "23505"
          ? "A release with this name already exists."
          : "Could not create this release."));
        return;
      }

      setReleases((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewReleaseId(data.id);
      setReleaseName("");
      setSuccess(t("Release created successfully."));
    } finally {
      setSaving(false);
    }
  }

  function releaseSelect(value: string, onChange: (value: string) => void) {
    return (
      <label className="block text-xs font-bold text-zinc-400">
        {t("Album or release")}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 block w-full rounded-lg border border-white/10 bg-[#15161d] px-3 py-2 text-sm font-normal text-white focus:border-purple-400"
        >
          <option value="">{t("Standalone campaign")}</option>
          {releases.map((release) => <option key={release.id} value={release.id}>{release.name}</option>)}
        </select>
      </label>
    );
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    let validated: ReturnType<typeof validateEra>;

    try {
      validated = validateEra(newName, newOrder);
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : t("Check the era information.")
      );
      return;
    }

    const slug = createSlug(validated.normalizedName);

    if (!slug) {
      setError(t("This name cannot be converted into a valid URL identifier."));
      return;
    }

    setSaving(true);

    try {
      const { data, error: insertError } = await supabase
        .from("watch_eras")
        .insert({
          name: validated.normalizedName,
          slug,
          normalized_name: validated.normalizedName,
          display_order: validated.order,
          is_active: true,
          release_id: newReleaseId || null,
        })
        .select("id, name, slug, display_order, is_active, release_id")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error(t("An era with this name or URL identifier already exists."));
        }

        if (insertError.code === "42501" || insertError.code === "PGRST301") {
          throw new Error(t("You do not have permission to manage eras. Check the administrator access migration."));
        }

        throw new Error(insertError.message);
      }

      setEras((current) =>
        sortEras([
          ...current,
          { ...data, video_count: 0 },
        ])
      );
      setNewName("");
      setNewOrder(String(validated.order + 10));
      setSuccess(t("Era created successfully."));
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : t("Unable to create this era.")
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(era: Era) {
    clearMessages();
    setEditingId(era.id);
    setEditingName(era.name);
    setEditingOrder(String(era.display_order));
    setEditingReleaseId(era.release_id ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName("");
    setEditingOrder("");
  }

  async function handleUpdate(eraId: string) {
    clearMessages();

    let validated: ReturnType<typeof validateEra>;

    try {
      validated = validateEra(editingName, editingOrder);
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : t("Check the era information.")
      );
      return;
    }

    const slug = createSlug(validated.normalizedName);

    if (!slug) {
      setError(t("This name cannot be converted into a valid URL identifier."));
      return;
    }

    setPendingId(eraId);

    try {
      const { data, error: updateError } = await supabase
        .from("watch_eras")
        .update({
          name: validated.normalizedName,
          slug,
          normalized_name: validated.normalizedName,
          display_order: validated.order,
          release_id: editingReleaseId || null,
        })
        .eq("id", eraId)
        .select("id, name, slug, display_order, is_active, release_id")
        .single();

      if (updateError) {
        if (updateError.code === "23505") {
          throw new Error(t("Another era already uses this name or URL identifier."));
        }

        if (updateError.code === "42501") {
          throw new Error(t("You do not have permission to edit this era."));
        }

        throw new Error(updateError.message);
      }

      setEras((current) =>
        sortEras(
          current.map((era) =>
            era.id === eraId
              ? { ...era, ...data }
              : era
          )
        )
      );
      cancelEditing();
      setSuccess(t("Era updated successfully."));
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : t("Unable to update this era.")
      );
    } finally {
      setPendingId(null);
    }
  }

  async function toggleActive(era: Era) {
    clearMessages();
    setPendingId(era.id);

    try {
      const { error: updateError } = await supabase
        .from("watch_eras")
        .update({ is_active: !era.is_active })
        .eq("id", era.id);

      if (updateError) {
        if (updateError.code === "42501") {
          throw new Error(t("You do not have permission to change this era."));
        }

        throw new Error(updateError.message);
      }

      setEras((current) =>
        current.map((item) =>
          item.id === era.id
            ? { ...item, is_active: !item.is_active }
            : item
        )
      );
      setSuccess(
        era.is_active
          ? t("Era deactivated. Existing video links were preserved.")
          : t("Era activated and available for future use.")
      );
      router.refresh();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : t("Unable to change the era status.")
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t("TOTAL ERAS"), value: eras.length },
          { label: t("ACTIVE"), value: activeCount },
          { label: t("INACTIVE"), value: inactiveCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-xs font-bold tracking-widest text-zinc-500">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-black">{item.value}</p>
          </div>
        ))}
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400"
        >
          {success}
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <div className="border-b border-white/10 pb-5">
          <p className="text-xs font-bold tracking-[0.25em] text-purple-400">
            {t("NEW ARCHIVE ERA")}
          </p>
          <h2 className="mt-3 text-2xl font-black">{t("Add an era.")}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {t("Create a central entry that can be linked to videos throughout the archive.")}
          </p>
        </div>

        <details className="mt-5 rounded-lg border border-white/10 p-4">
          <summary className="cursor-pointer text-sm font-bold">{t("Add an album or release")}</summary>
          <form onSubmit={handleCreateRelease} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-bold text-zinc-400">
              {t("Release name")}
              <input
                value={releaseName}
                onChange={(event) => setReleaseName(event.target.value)}
                required
                maxLength={60}
                className="mt-2 block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </label>
            <button type="submit" disabled={saving || pendingId !== null} className="rounded-lg border border-white/20 px-4 py-2 text-xs font-bold">
              {t("ADD RELEASE +")}
            </button>
          </form>
        </details>

        <form
          onSubmit={handleCreate}
          className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_120px_auto] md:items-end"
        >
          <div>
            <label
              htmlFor="new-era-name"
              className="mb-2 block text-xs font-bold tracking-widest text-zinc-400"
            >
              {t("ERA NAME *")}
            </label>
            <input
              id="new-era-name"
              required
              maxLength={60}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder={t("Example: FOREVER")}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400"
            />
          </div>

          {releaseSelect(newReleaseId, setNewReleaseId)}

          <div>
            <label
              htmlFor="new-era-order"
              className="mb-2 block text-xs font-bold tracking-widest text-zinc-400"
            >
              {t("DISPLAY ORDER")}
            </label>
            <input
              id="new-era-order"
              type="number"
              min="0"
              max="99999"
              step="1"
              required
              value={newOrder}
              onChange={(event) => setNewOrder(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-white px-6 py-3 text-xs font-black text-black transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t("SAVING...") : t("ADD ERA +")}
          </button>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-purple-400">
              {t("CENTRAL CATALOG")}
            </p>
            <h2 className="mt-2 text-2xl font-black">{t("Manage eras.")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              {t("Edit names and ordering, or deactivate eras that should no longer be available for new content.")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              ["all", t("ALL")],
              ["active", t("ACTIVE")],
              ["inactive", t("INACTIVE")],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`rounded-full px-4 py-2 text-[10px] font-bold tracking-widest transition ${
                  filter === value
                    ? "bg-purple-500 text-white"
                    : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_100px_110px_190px] gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-4 text-[10px] font-bold tracking-widest text-zinc-500 lg:grid">
            <span>{t("ERA")}</span>
            <span>{t("SLUG")}</span>
            <span>{t("ORDER")}</span>
            <span>{t("VIDEOS")}</span>
            <span className="text-right">{t("ACTIONS")}</span>
          </div>

          {filteredEras.length > 0 ? (
            <div className="divide-y divide-white/10">
              {filteredEras.map((era) => {
                const isEditing = editingId === era.id;
                const isPending = pendingId === era.id || saving;

                return (
                  <div
                    key={era.id}
                    className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_100px_110px_190px] lg:items-center"
                  >
                    <div className="min-w-0">
                      {isEditing ? (
                        <div>
                          <label
                            htmlFor={`edit-era-name-${era.id}`}
                            className="mb-2 block text-[10px] font-bold tracking-widest text-zinc-500 lg:hidden"
                          >
                            {t("ERA NAME")}
                          </label>
                          <input
                            id={`edit-era-name-${era.id}`}
                            maxLength={60}
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            className="mb-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-400"
                          />
                          {releaseSelect(editingReleaseId, setEditingReleaseId)}
                        </div>
                      ) : (
                        <>
                          <p className="break-words font-black">{era.name}</p>
                          {era.release_id && (
                            <p className="mt-1 text-xs text-zinc-400">
                              {releases.find(({ id }) => id === era.release_id)?.name}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] text-zinc-600 lg:hidden">
                            {era.slug}
                          </p>
                          <span
                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wider ${
                              era.is_active
                                ? "bg-green-500/10 text-green-400"
                                : "bg-zinc-500/10 text-zinc-400"
                            }`}
                          >
                            {era.is_active ? t("ACTIVE") : t("INACTIVE")}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="mb-1 text-[10px] font-bold tracking-widest text-zinc-600 lg:hidden">
                        {t("SLUG")}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {isEditing ? createSlug(editingName) : era.slug}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor={`edit-era-order-${era.id}`}
                        className="mb-1 block text-[10px] font-bold tracking-widest text-zinc-600 lg:hidden"
                      >
                        {t("ORDER")}
                      </label>
                      {isEditing ? (
                        <input
                          id={`edit-era-order-${era.id}`}
                          type="number"
                          min="0"
                          max="99999"
                          step="1"
                          value={editingOrder}
                          onChange={(event) => setEditingOrder(event.target.value)}
                          className="w-24 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-400"
                        />
                      ) : (
                        <span className="text-sm tabular-nums text-zinc-300">
                          {era.display_order}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="mb-1 text-[10px] font-bold tracking-widest text-zinc-600 lg:hidden">
                        {t("LINKED VIDEOS")}
                      </p>
                      <span className="text-sm tabular-nums text-zinc-300">
                        {era.video_count === null ? "—" : era.video_count}
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdate(era.id)}
                            disabled={isPending}
                            className="rounded-lg bg-white px-3 py-2 text-[10px] font-black text-black transition hover:bg-purple-200 disabled:opacity-50"
                          >
                            {isPending ? t("SAVING") : t("SAVE")}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={isPending}
                            className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-zinc-400 transition hover:bg-white/5"
                          >
                            {t("CANCEL")}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditing(era)}
                            disabled={Boolean(pendingId) || saving}
                            className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-zinc-300 transition hover:border-purple-400/50 hover:text-white disabled:opacity-50"
                          >
                            {t("EDIT")}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(era)}
                            disabled={isPending}
                            className={`rounded-lg border px-3 py-2 text-[10px] font-bold transition disabled:opacity-50 ${
                              era.is_active
                                ? "border-red-500/20 text-red-300 hover:bg-red-500/10"
                                : "border-green-500/20 text-green-300 hover:bg-green-500/10"
                            }`}
                          >
                            {isPending
                              ? "..."
                              : era.is_active
                                ? t("DEACTIVATE")
                                : t("ACTIVATE")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-bold text-white">{t("No eras found.")}</p>
              <p className="mt-2 text-sm text-zinc-500">
                {t("Try another filter or create a new era.")}
              </p>
            </div>
          )}
        </div>
      </section>

      <p className="text-xs leading-6 text-zinc-600">
        {t("Deactivating an era hides it from future selection. Existing video relationships are kept; no era or video is permanently deleted.")}
      </p>
    </div>
  );
}
