type JsonFetchOptions<TFallback> = {
    context: string;
    fallback: TFallback;
    init?: RequestInit;
};

/**
 * Fetches JSON data from a URL or returns a fallback value if the request fails.
 * @param url The URL to fetch JSON data from.
 * @param options Configuration options for the fetch request.
 * @returns A promise resolving to the fetched JSON data or the fallback value.
 */

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