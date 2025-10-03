// A validator returns a string (error) or undefined (ok)
export type Validator<T = unknown> = (ctx: { value: T }) => string | undefined;

/** Run validators in order; return the first error. */
export const combine = <T>(...validators: Validator<T>[]): Validator<T> => {
  return (ctx) => {
    for (const v of validators) {
      const res = v(ctx);
      if (res) return res;
    }
    return undefined;
  };
};

export const required: Validator<string | null | undefined> = ({ value }) => {
  const s = (value ?? "").trim();
  return s ? undefined : "Required";
};

export const minLength =
  (n: number): Validator<string | null | undefined> =>
  ({ value }) => {
    const s = (value ?? "").trim();
    if (!s) return undefined; // let `required` handle empty
    return s.length >= n ? undefined : `Must be at least ${n} characters`;
  };

export const email: Validator<string | null | undefined> = ({ value }) => {
  const s = (value ?? "").trim();
  if (!s) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? undefined : "Invalid email";
};

export const url: Validator<string | null | undefined> = ({ value }) => {
  const s = (value ?? "").trim();
  if (!s) return undefined;
  try {
    new URL(s);
    return undefined;
  } catch {
    return "Invalid URL";
  }
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DT_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const integer: Validator<string | null | undefined> = ({ value }) => {
  const s = (value ?? "").trim();
  if (!s) return undefined;
  return /^\d+$/.test(s) ? undefined : "Enter a whole number";
};

export const date: Validator<string | null | undefined> = ({ value }) => {
  const s = (value ?? "").trim();
  if (!s) return undefined;
  return DATE_RE.test(s) ? undefined : "Enter a date (YYYY-MM-DD)";
};

export const optionalDateTime: Validator<string | null | undefined> = ({
  value,
}) => {
  const s = (value ?? "").trim();
  if (!s) return undefined;
  return DT_LOCAL_RE.test(s) ? undefined : "Enter YYYY-MM-DDTHH:MM";
};

/** Cross-field helper (not a Field validator): pass raw strings */
export const salaryBounds = (min: string, max: string) => {
  if (!min.trim() || !max.trim()) return undefined;
  const a = Number(min.replaceAll(",", ""));
  const b = Number(max.replaceAll(",", ""));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return undefined;
  return a <= b ? undefined : "Min must be ≤ Max";
};
