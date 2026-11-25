"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createConfirmationGate } from "@/lib/admin/confirmation";

type ConfirmationRequest = { message: string; actionLabel: string };
export type ConfirmAction = (message: string, actionLabel: string) => Promise<boolean>;

export function useAdminConfirmation() {
  const [gate] = useState(createConfirmationGate);
  const [pending, setPending] = useState<ConfirmationRequest | null>(null);

  // Do not authorize an action if the workspace disappears before a reply.
  useEffect(() => () => { gate.settle(false); }, [gate]);

  const confirm: ConfirmAction = (message, actionLabel) =>
    gate.request(() => setPending({ message, actionLabel }));

  function resolve(confirmed: boolean) {
    if (gate.settle(confirmed)) setPending(null);
  }

  return { confirm, pending, resolve };
}

export function AdminConfirmationDialog({
  pending, title, cancelLabel, onResolve,
}: {
  pending: ConfirmationRequest | null;
  title: string;
  cancelLabel: string;
  onResolve: (confirmed: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (pending && !element.open) {
      // showModal() displays a real, focus-trapped dialog without a blocking
      // browser alert. The request resumes only after a separate click.
      element.showModal();
      cancel.current?.focus();
    } else if (!pending && element.open) {
      element.close();
    }
  }, [pending]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onResolve(false);
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-purple-400/25 bg-[#14151c] p-0 text-white shadow-2xl shadow-black/70 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      {pending && (
        <div className="p-6 sm:p-7">
          <p className="text-[10px] font-black tracking-[0.2em] text-purple-400">MONSTER ARCHIVE</p>
          <h2 id={headingId} className="mt-3 text-xl font-black">{title}</h2>
          <p id={descriptionId} className="mt-4 whitespace-pre-line text-sm leading-6 text-zinc-300">{pending.message}</p>
          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <button
              ref={cancel}
              type="button"
              onClick={() => onResolve(false)}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold text-zinc-300 hover:border-white/30 hover:text-white focus-visible:outline-2 focus-visible:outline-purple-400"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => onResolve(true)}
              className="rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-black text-white hover:bg-purple-400 focus-visible:outline-2 focus-visible:outline-purple-200"
            >
              {pending.actionLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
