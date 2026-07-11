/** Merges `updates` into an existing URLSearchParams, removing keys whose
 * value is null/empty, and always resets pagination since filters changed. */
export function withParams(
  current: URLSearchParams,
  updates: Record<string, string | null | undefined>,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  if (!("page" in updates)) {
    next.delete("page");
  }
  return next;
}
