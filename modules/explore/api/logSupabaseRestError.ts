/**
 * Logs Supabase PostgREST / RPC error bodies for debugging.
 * Never pass this text to the UI — it may contain schema or constraint details.
 */
export async function logSupabaseRestError(
  context: string,
  res: Response,
): Promise<void> {
  try {
    const text = await res.text();
    console.error(`${context}: HTTP ${res.status}`, text.slice(0, 4000));
  } catch {
    console.error(`${context}: HTTP ${res.status} (response body unreadable)`);
  }
}
