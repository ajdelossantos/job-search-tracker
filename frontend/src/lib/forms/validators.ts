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
