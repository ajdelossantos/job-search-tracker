import { client } from "@/client/client.gen";

/**
 * Makes an HTTP request and returns the response data with type safety.
 *
 * @template TData - The expected type of the response data
 * @template TBody - The type of the request body (defaults to unknown)
 *
 * @param args - The request configuration object
 * @param args.method - The HTTP method to use for the request
 * @param args.url - The URL endpoint to send the request to
 * @param args.body - Optional request body data
 *
 * @returns A promise that resolves to the typed response data, typically objects or arrays
 *
 * @throws {Error} When the response is empty, null, or not an object
 *
 * @example
 * ```typescript
 * // GET request
 * const users = await requestData<User[]>({
 *   method: 'GET',
 *   url: '/api/users'
 * });
 *
 * // POST request with body
 * const newUser = await requestData<User, CreateUserRequest>({
 *   method: 'POST',
 *   url: '/api/users',
 *   body: { name: 'John', email: 'john@example.com' }
 * });
 * ```
 */
export async function requestData<TData, TBody = unknown>(args: {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  url: string;
  body?: TBody;
}): Promise<TData> {
  const res = await client.request<TData>(args);
  if (!res || res.data == null || typeof res.data !== "object") {
    throw new Error("Unexpected empty response payload");
  }
  return res.data as TData;
}
