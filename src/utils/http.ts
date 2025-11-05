export async function postJson<TResponse, TPayload = unknown>(url: string, payload: TPayload): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && data && "error" in data && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Не удалось выполнить запрос";
    throw new Error(message);
  }

  return data as TResponse;
}
