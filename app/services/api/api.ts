type JsonFetchOptions<TFallback> = {
    context: string;
    fallback: TFallback;
    init?: RequestInit;
};

export async function fetchJsonOrFallback<TResponse, TFallback>(
    url: string,
    options: JsonFetchOptions<TFallback>
): Promise<TResponse | TFallback> {
    const { context, fallback, init } = options;

    try {
        const response = await fetch(url, init);
        if (!response.ok) {
            console.error(`[${context}] HTTP ${response.status} ${response.statusText}`);
            return fallback;
        }

        return (await response.json()) as TResponse;
    } catch (error) {
        console.error(`[${context}] Fetch failed`, error);
        return fallback;
    }
}