import { ref } from "vue";
import { type GhibliCharacter, isGhibliCharacter } from "../types/ghibli";

// const config = useRuntimeConfig();
const BASE_URL = "https://ghibliapi.vercel.app";
const CHARACTER_URL = "https://api.jikan.moe/v4/characters";

// Force specific names to use a known Jikan `mal_id` instead of fuzzy name search.
// Keys are normalized (lowercase + trimmed).
const CHARACTER_SEARCH_EXCEPTIONS: Record<string, number> = {
    // "name from ghibli api": 12345,
    "kiki": 6866,
};

type JikanCharacter = {
    name?: string;
    nicknames?: string[];
    about?: string;
    images?: {
        jpg?: {
            image_url?: string;
        };
    };
};

type JikanCharacterSearchResponse = {
    data?: JikanCharacter[];
};

type JikanCharacterByIdResponse = {
    data?: JikanCharacter;
};

function normalizeName(value: string): string {
    return value.trim().toLowerCase();
}

async function characterImageById(jikanCharacterId: number): Promise<string | null> {
    const response = await fetch(`${CHARACTER_URL}/${jikanCharacterId}/full`);
    if (!response.ok) return null;

    const data = (await response.json()) as JikanCharacterByIdResponse;
    return data?.data?.images?.jpg?.image_url ?? null;
}

export async function allCharacters() {
    const collection = ref<GhibliCharacter[]>([]);
    console.log("Fetching from API URL:", BASE_URL);

    const response = await fetch(`${BASE_URL}/people`);
    const data = await response.json();
    collection.value = Array.isArray(data) ? data.filter(isGhibliCharacter) : [];
    // console.log("[characters] Fetched collection:", collection.value);
    return collection;
}

export async function characterByID(characterId: string) {
    const collection = ref<GhibliCharacter | null>(null);
    console.log("Fetching from API URL:", BASE_URL);

    const response = await fetch(`${BASE_URL}/people/${characterId}`);
    const data = await response.json();
    collection.value = isGhibliCharacter(data) ? data : null;
    console.log("Fetched collection:", collection.value);
    return collection;
}

export async function characterImageByName(characterName: string, characterSpecies?: string) {
    const collection = ref<JikanCharacterSearchResponse | null>(null);
    let fallbackImage: string | null = null;

    const q = normalizeName(characterName);
    if (!q) return null;

    const forcedJikanId = CHARACTER_SEARCH_EXCEPTIONS[q];
    if (typeof forcedJikanId === 'number') {
        const forcedImage = await characterImageById(forcedJikanId);
        if (forcedImage) {
            console.log(`Found image by exception id for "${characterName}" (${forcedJikanId})`);
            return forcedImage;
        }
    }

    console.log("Fetching from Character API URL:", CHARACTER_URL);

    const response = await fetch(
        `${CHARACTER_URL}?q=${encodeURIComponent(characterName)}`
    );
    collection.value = (await response.json()) as JikanCharacterSearchResponse;

    console.log("Fetched character image collection:", collection.value);

    const results = collection.value?.data ?? [];
    if (results.length === 0) {
        return null;
    }

    for (const item of results) {
        const name = item.name ?? "";
        const nicknames = item.nicknames ?? [];
        const about = item.about ?? "";
        console.log(`Checking character "${name}" with nicknames:`, item.nicknames);

        const nameLower = name.toLowerCase();
        const nickLower = nicknames.map(n => (n ?? '').toLowerCase());

        const nameMatch = nameLower === q || nameLower.includes(q);
        const nicknameMatch = nickLower.some(n => n === q || n.includes(q));

        if (nameMatch || nicknameMatch) {
            const aboutLower = about.toLowerCase();
            const speciesLower = (characterSpecies ?? '').trim().toLowerCase();

            // Always keep a fallback image for the best name/nickname match.
            // Many Jikan entries have an `about` that won't contain our species string.
            fallbackImage = fallbackImage ?? item.images?.jpg?.image_url ?? null;

            if (speciesLower && about && aboutLower.includes(speciesLower)) {
                const image = item.images?.jpg?.image_url ?? null;
                console.log(`Found image for character "${characterName}" (species match):`, image);
                return image;
            }

            // If there's no species filter, return the first good match immediately.
            if (!speciesLower) {
                const image = item.images?.jpg?.image_url ?? null;
                console.log(`Found image for character "${characterName}":`, image);
                return image;
            }
        }
    }

    // Species filter didn't match anything; fall back to first name/nickname match.
    return fallbackImage;
}