import { toast } from "sonner";

/**
 * Toast notification utility.
 */
export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast(msg),
  promise<T>(
    p: Promise<T>,
    msgs: { loading: string; success: string; error: string },
  ) {
    return toast.promise(p, {
      loading: msgs.loading,
      success: msgs.success,
      error: msgs.error,
    });
  },
};
