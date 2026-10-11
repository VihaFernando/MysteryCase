import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { caseRepository } from "@/repositories/CaseRepository";
import { qk } from "@/hooks/queries";
import type { CaseBundle } from "@/types";

export type SaveState = "saved" | "saving" | "dirty" | "error";

interface DraftCtx {
  bundle: CaseBundle;
  update: (fn: (draft: CaseBundle) => CaseBundle) => void;
  saveNow: () => Promise<void>;
  saveState: SaveState;
  lastSavedAt: Date | null;
}

const Ctx = createContext<DraftCtx | null>(null);

const AUTOSAVE_MS = 1500;

/**
 * Holds the editable working copy of a case. Edits are local; autosave
 * persists through CaseRepository.save (→ PATCH /api/cases/:id).
 */
export function CaseDraftProvider({ initial, children }: { initial: CaseBundle; children: ReactNode }) {
  const qc = useQueryClient();
  const [bundle, setBundle] = useState(initial);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date(initial.case.updatedAt));
  const latest = useRef(bundle);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNow = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    setSaveState("saving");
    try {
      const saved = await caseRepository.save(latest.current);
      qc.setQueryData(qk.case(saved.case.id), saved);
      qc.invalidateQueries({ queryKey: qk.cases });
      qc.invalidateQueries({ queryKey: ["all"] });
      setLastSavedAt(new Date());
      setSaveState(latest.current === latest.current ? "saved" : "dirty");
    } catch {
      setSaveState("error");
    }
  }, [qc]);

  const update = useCallback((fn: (d: CaseBundle) => CaseBundle) => {
    setBundle((prev) => {
      const next = fn(prev);
      latest.current = next;
      return next;
    });
    setSaveState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void saveNow(), AUTOSAVE_MS);
  }, [saveNow]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveState === "dirty" || saveState === "saving") { e.preventDefault(); }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void saveNow(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveNow]);

  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); void caseRepository.save(latest.current); } }, []);

  return <Ctx.Provider value={{ bundle, update, saveNow, saveState, lastSavedAt }}>{children}</Ctx.Provider>;
}

export function useCaseDraft() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCaseDraft must be used inside CaseDraftProvider");
  return c;
}

/** Helper to update one item inside a bundle collection. */
export function replaceById<T extends { id: string }>(arr: T[], item: T): T[] {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i < 0) return [...arr, item];
  const copy = arr.slice();
  copy[i] = item;
  return copy;
}
