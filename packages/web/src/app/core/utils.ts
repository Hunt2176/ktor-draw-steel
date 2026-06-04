/** Small client-side helpers ported from the original `utils.ts`. */

export function parseIntOrUndefined(val: unknown): number | undefined {
  if (val == null) return undefined;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const parsed = Number.parseInt(String(val), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function trimToNull(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export type SortBy<T> = keyof T | ((val: T) => unknown);
export type SortDir = 'ASC' | 'DESC';
export interface SortOption<T> {
  sortBy: SortBy<T>;
  dir: SortDir;
}

function sortFn<T>(sortBy: SortBy<T>, dir: SortDir): (a: T, b: T) => number {
  return (a, b) => {
    const aVal = typeof sortBy === 'function' ? sortBy(a) : a[sortBy];
    const bVal = typeof sortBy === 'function' ? sortBy(b) : b[sortBy];
    const mod = dir === 'ASC' ? 1 : -1;
    if ((aVal as never) < (bVal as never)) return -1 * mod;
    if ((aVal as never) > (bVal as never)) return 1 * mod;
    return 0;
  };
}

export function multiSort<T>(options: SortOption<T>[]): (a: T, b: T) => number {
  return (a, b) => {
    for (const option of options) {
      const res = sortFn(option.sortBy, option.dir)(a, b);
      if (res !== 0) return res;
    }
    return 0;
  };
}
