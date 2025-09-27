import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { ApplicationRead } from "@/lib/api/applications";

export type SliceName = "contacts" | "interviews" | "pipeline_histories";

/**
 * Minimal shape we care about for cache operations.
 */
export type NestedApplicationEntities = Pick<ApplicationRead, "id"> &
  Partial<
    Pick<ApplicationRead, "contacts" | "interviews" | "pipeline_histories">
  >;

export const appKey = (id: number) =>
  ["applications", id] as const satisfies QueryKey;

export const sliceKey = (id: number, slice: SliceName) =>
  ["applications", id, slice] as const satisfies QueryKey;

export function getApp(qc: QueryClient, id: number) {
  return qc.getQueryData<NestedApplicationEntities>(appKey(id));
}

/**
 * Primary way to update the parent Application cache.
 * Always write via this to keep SSOT consistent.
 */
export function setApp(
  qc: QueryClient,
  id: number,
  updater: (prev: NestedApplicationEntities) => NestedApplicationEntities,
) {
  qc.setQueryData<NestedApplicationEntities>(appKey(id), (prev) => {
    // if (!prev) return prev as any;
    if (!prev) return undefined;
    const next = updater(prev);

    return next;
  });
}

/**
 * Replace a nested slice on the parent app and also set the mirror key.
 * Use this after a post-write sync of the slice endpoint.
 */
export function replaceSlice<T extends { id: number }>(
  qc: QueryClient,
  id: number,
  slice: SliceName,
  items: T[],
) {
  setApp(qc, id, (prev) => ({ ...prev, [slice]: items }));
  qc.setQueryData<T[]>(sliceKey(id, slice), items);
}

/** Optimistic helpers (insert / update / remove by id) */
export const optimistic = {
  insert<T extends { id: number }>(
    qc: QueryClient,
    id: number,
    slice: SliceName,
    item: T,
    position: "start" | "end" = "start",
  ) {
    setApp(qc, id, (prev) => {
      const current = (prev[slice] as T[] | undefined) ?? [];
      const next =
        position === "start" ? [item, ...current] : [...current, item];
      return { ...prev, [slice]: next };
    });
  },

  update<T extends { id: number }>(
    qc: QueryClient,
    id: number,
    slice: SliceName,
    item: T,
  ) {
    setApp(qc, id, (prev) => {
      const current = (prev[slice] as T[] | undefined) ?? [];
      const next = current.map((x) =>
        x.id === item.id ? { ...x, ...item } : x,
      );
      return { ...prev, [slice]: next };
    });
  },

  remove(qc: QueryClient, id: number, slice: SliceName, itemId: number) {
    setApp(qc, id, (prev) => {
      const current = (prev[slice] as Array<{ id: number }> | undefined) ?? [];
      const next = current.filter((x) => x.id !== itemId);
      return { ...prev, [slice]: next };
    });
  },
};

/**
 * Utility to safely read a slice array from a parent app.
 * Always returns an array (never undefined).
 */
export function readSlice<T extends { id: number }>(
  app: NestedApplicationEntities | undefined,
  slice: SliceName,
): T[] {
  return ((app?.[slice] as T[] | undefined) ?? []) as T[];
}
