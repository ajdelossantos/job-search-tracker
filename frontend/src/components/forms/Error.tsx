/**
 * Error component that displays validation or error messages.
 *
 * @param props - The component props
 * @param props.msg - Optional error message to display. If not provided, component renders nothing
 * @returns JSX element containing the error message or null if no message is provided
 *
 * @example
 * ```tsx
 * <Error msg="This field is required" />
 * <Error /> // renders nothing
 * ```
 */
export function Error({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}
