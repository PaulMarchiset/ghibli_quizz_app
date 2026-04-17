import { type GhibliCharacter, isGhibliCharacter } from "../types/ghibli";
import { fetchJsonOrFallback } from "./api";
import characterImageExceptions from "./characterImageExceptions.json";

// const config = useRuntimeConfig();
const BASE_URL = "https://ghibliapi.vercel.app";
const CHARACTER_URL = "https://api.jikan.moe/v4/characters";

const CHARACTER_SEARCH_EXCEPTIONS = Object.fromEntries(
    Object.entries(characterImageExceptions)
        .filter((entry): entry is [string, number] => typeof entry[0] === 'string' && typeof entry[1] === 'number')
        .map(([name, jikanId]) => [normalizeName(name), jikanId])
) as Record<string, number>;

// for jikan character that does not have a direct match
export type CharacterImageSource =
    | 'none'
    | 'exception-id'
    | 'species-match'
    | 'name-match';

export type CharacterImageResolution = {
    imageUrl: string | null;
    source: CharacterImageSource;
    characterName: string;
    normalizedCharacterName: string;
    requestedSpecies: string | null;
    inspectedCandidates: number;
    exceptionJikanId: number | null;
    matchedCharacterName: string | null;
};

type JikanCharacter = {
    mal_id?: number;
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

/**
 * Fetches a character image URL from Jikan API by character ID.
 * @param jikanCharacterId The Jikan character ID to fetch the image for.
 * @returns A promise resolving to the character image URL or null if not found.
 */

async function characterImageById(jikanCharacterId: number): Promise<string | null> {
    const data = await fetchJsonOrFallback<JikanCharacterByIdResponse, null>(
        `${CHARACTER_URL}/${jikanCharacterId}/full`,
        { context: 'characterImageById', fallback: null }
    );

    return data?.data?.images?.jpg?.image_url ?? null;
}

/**
 * Fetches a list of all Ghibli characters from the Ghibli API.
 * @returns A promise resolving to an array of GhibliCharacter objects.
 */

export async function allCharacters(): Promise<GhibliCharacter[]> {
    const data = await fetchJsonOrFallback<unknown, []>(`${BASE_URL}/people`, {
        context: 'allCharacters',
        fallback: []
    });

    return Array.isArray(data) ? data.filter(isGhibliCharacter) : [];
}


/**
 * Fetches a single Ghibli character by ID from the Ghibli API.
 * @param characterId The ID of the character to fetch.
 * @returns A promise resolving to the GhibliCharacter object or null if not found.
 */

export async function characterByID(characterId: string): Promise<GhibliCharacter | null> {
    const data = await fetchJsonOrFallback<unknown, null>(`${BASE_URL}/people/${characterId}`, {
        context: 'characterByID',
        fallback: null
    });

    return isGhibliCharacter(data) ? data : null;
}

/**
 * Fetches a character image URL from Jikan API by character name and optional species filter.
 * @param characterName The name of the character to search for.
 * @param characterSpecies Optional species filter to improve matching accuracy.
 * @returns A promise resolving to a CharacterImageResolution object containing the image URL and metadata.
 */

export async function characterImageWithMetadataByName(
    characterName: string,
    characterSpecies?: string
): Promise<CharacterImageResolution> {
    let fallbackImage: string | null = null;
    let fallbackMatchName: string | null = null;
    let inspectedCandidates = 0;

    const q = normalizeName(characterName);
    const speciesLower = (characterSpecies ?? '').trim().toLowerCase();

    if (!q) {
        return {
            imageUrl: null,
            source: 'none',
            characterName,
            normalizedCharacterName: q,
            requestedSpecies: speciesLower || null,
            inspectedCandidates: 0,
            exceptionJikanId: null,
            matchedCharacterName: null
        };
    }

    const forcedJikanId = CHARACTER_SEARCH_EXCEPTIONS[q];
    if (typeof forcedJikanId === 'number') {
        const forcedImage = await characterImageById(forcedJikanId);
        if (forcedImage) {
            console.log(`Found image by exception id for "${characterName}" (${forcedJikanId})`);
            return {
                imageUrl: forcedImage,
                source: 'exception-id',
                characterName,
                normalizedCharacterName: q,
                requestedSpecies: speciesLower || null,
                inspectedCandidates: 0,
                exceptionJikanId: forcedJikanId,
                matchedCharacterName: null
            };
        }
    }

    console.log("Fetching from Character API URL:", CHARACTER_URL);

    const payload = await fetchJsonOrFallback<JikanCharacterSearchResponse, null>(
        `${CHARACTER_URL}?q=${encodeURIComponent(characterName)}`,
        { context: 'characterImageByName', fallback: null }
    );

    if (!payload) {
        return {
            imageUrl: null,
            source: 'none',
            characterName,
            normalizedCharacterName: q,
            requestedSpecies: speciesLower || null,
            inspectedCandidates,
            exceptionJikanId: typeof forcedJikanId === 'number' ? forcedJikanId : null,
            matchedCharacterName: null
        };
    }

    const results = payload.data ?? [];

    if (results.length === 0) {
        return {
            imageUrl: null,
            source: 'none',
            characterName,
            normalizedCharacterName: q,
            requestedSpecies: speciesLower || null,
            inspectedCandidates,
            exceptionJikanId: typeof forcedJikanId === 'number' ? forcedJikanId : null,
            matchedCharacterName: null
        };
    }

    for (const item of results) {
        inspectedCandidates += 1;

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

            // Always keep a fallback image for the best name/nickname match.
            // Many Jikan entries have an `about` that won't contain our species string.
            fallbackImage = fallbackImage ?? item.images?.jpg?.image_url ?? null;
            fallbackMatchName = fallbackMatchName ?? name;

            if (speciesLower && about && aboutLower.includes(speciesLower)) {
                const image = item.images?.jpg?.image_url ?? null;
                console.log(`Found image for character "${characterName}" (species match):`, image);
                return {
                    imageUrl: image,
                    source: image ? 'species-match' : 'none',
                    characterName,
                    normalizedCharacterName: q,
                    requestedSpecies: speciesLower || null,
                    inspectedCandidates,
                    exceptionJikanId: typeof forcedJikanId === 'number' ? forcedJikanId : null,
                    matchedCharacterName: name || null
                };
            }

            // If there's no species filter, return the first good match immediately.
            if (!speciesLower) {
                const image = item.images?.jpg?.image_url ?? null;
                console.log(`Found image for character "${characterName}":`, image);
                return {
                    imageUrl: image,
                    source: image ? 'name-match' : 'none',
                    characterName,
                    normalizedCharacterName: q,
                    requestedSpecies: null,
                    inspectedCandidates,
                    exceptionJikanId: typeof forcedJikanId === 'number' ? forcedJikanId : null,
                    matchedCharacterName: name || null
                };
            }
        }
    }

    // Species filter didn't match anything; fall back to first name/nickname match.
    return {
        imageUrl: fallbackImage,
        source: fallbackImage ? 'name-match' : 'none',
        characterName,
        normalizedCharacterName: q,
        requestedSpecies: speciesLower || null,
        inspectedCandidates,
        exceptionJikanId: typeof forcedJikanId === 'number' ? forcedJikanId : null,
        matchedCharacterName: fallbackMatchName
    };
}

export async function characterImageByName(characterName: string, characterSpecies?: string) {
    const imageResolution = await characterImageWithMetadataByName(characterName, characterSpecies);
    return imageResolution.imageUrl;
}