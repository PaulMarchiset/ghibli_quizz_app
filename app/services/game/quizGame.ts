import { characterSpecies } from "./questionType/characterSpecies";
import { characterFromMovie } from "./questionType/characterFromMovie";
import { findCharacter } from "./questionType/findCharacter";
import { japaneseName } from "./questionType/japaneseName";
import type { CharacterImageResolution } from "../api/Characters";
import { type GhibliCharacter, type GhibliMovie, type GhibliSpecies } from "../types/ghibli";
import { shuffleArray } from "./utils/random";

// Types and factories for quiz questions, plus the main quiz generation function.
export type QuizQuestionReportContext = {
    generatedBy: string;
    character?: {
        id: string;
        name: string;
        species?: string;
        speciesName?: string;
    };
    movie?: {
        id: string;
        title: string;
        url?: string;
    };
    image?: {
        source: string;
        requestedCharacterName?: string;
        normalizedCharacterName?: string;
        requestedSpecies?: string | null;
        matchedCharacterName?: string | null;
        exceptionJikanId?: number | null;
        inspectedCandidates?: number;
    };
};

export type QuizQuestion = {
    id: string;
    type: "character-species" | "character-movie" | "movie-character" | "japanese-name";
    prompt: string;
    image?: string;
    choices: {
        id: string;
        label: string;
    }[];
    correctChoiceId: string;
    reportContext?: QuizQuestionReportContext;
};

export type QuestionTypeKey = QuizQuestion['type']

export const QUESTION_TYPE_LABELS: Record<QuestionTypeKey, string> = {
    'character-species': 'Character species',
    'character-movie': 'Character movie',
    'movie-character': 'Movie character',
    'japanese-name': 'Japanese title'
}

export const QUESTION_TYPE_KEYS = Object.keys(QUESTION_TYPE_LABELS) as QuestionTypeKey[]

type QuizChoice = QuizQuestion['choices'][number];
type QuestionFactory = () => Promise<QuizQuestion>;

/**
 * Builds the image context for a quiz question report.
 * @param imageResolution Resolved image details and source.
 * @param sourceOverride Optional string to override the image source.
 * @returns The image context object, or undefined if unavailable.
 */

function buildImageReportContext(
    imageResolution?: CharacterImageResolution,
    sourceOverride?: string
): QuizQuestionReportContext['image'] | undefined {
    if (!imageResolution && !sourceOverride) return undefined;

    return {
        source: sourceOverride ?? imageResolution?.source ?? 'none',
        requestedCharacterName: imageResolution?.characterName,
        normalizedCharacterName: imageResolution?.normalizedCharacterName,
        requestedSpecies: imageResolution?.requestedSpecies ?? null,
        matchedCharacterName: imageResolution?.matchedCharacterName ?? null,
        exceptionJikanId: imageResolution?.exceptionJikanId ?? null,
        inspectedCandidates: imageResolution?.inspectedCandidates
    };
}

/**
 * Validates that a quiz question has the necessary fields and a correct answer present in the choices.
 * @param q The quiz question to validate.
 * @returns The validated quiz question with properly typed choices.
 * @throws An error if the question is invalid (e.g., too few choices, missing correct answer).
 */

function hasChoiceFields(x: unknown): x is QuizChoice {
    if (typeof x !== 'object' || x === null) return false;
    const candidate = x as Record<string, unknown>;
    return typeof candidate.id === 'string' && typeof candidate.label === 'string';
}


function ensureValidQuestion(q: QuizQuestion) {
    const choices = Array.isArray(q.choices) ? q.choices.filter(hasChoiceFields) : [];
    if (choices.length < 2) throw new Error('Generated question has too few choices');

    const ids = new Set<string>();
    for (const c of choices) {
        if (ids.has(c.id)) throw new Error('Generated question has duplicate choice ids');
        ids.add(c.id);
    }

    if (!ids.has(q.correctChoiceId)) throw new Error('Generated question missing correctChoiceId in choices');
    return { ...q, choices };
}

/**
 * Generates a multiple-choice quiz question about a character's species.
 * @returns A promise resolving to the constructed quiz question.
 * @throws {Error} If the question generation fails.
 */

export async function makeCharacterSpeciesQuestion(): Promise<QuizQuestion> {
    const result = await characterSpecies();
    if (!result) throw new Error('Failed to generate character species question');
    const { character, answers, correctSpecies, image, imageResolution } = result;

    return ensureValidQuestion({
        id: crypto.randomUUID(),
        type: "character-species",
        prompt: `Quelle est l'espèce de ${character.name} ?`,
        image: image ?? undefined,
        choices: answers
            .filter(Boolean)
            .map((s: GhibliSpecies) => ({
                id: s.id,
                label: s.name
            }))
            .filter((c) => c.id && c.label),
        correctChoiceId: correctSpecies.id,
        reportContext: {
            generatedBy: 'characterSpecies',
            character: {
                id: character.id,
                name: character.name,
                species: character.species,
                speciesName: correctSpecies.name
            },
            image: buildImageReportContext(imageResolution)
        }
    });
}

/**
 * Generates a multiple-choice quiz question identifying a character's movie.
 * @returns A promise resolving to the constructed quiz question.
 * @throws {Error} If the question generation fails.
 */

export async function makeFindCharacterQuestion(): Promise<QuizQuestion> {
    const result = await findCharacter();
    if (!result) throw new Error('Failed to generate character movie question');
    const { correctAnswer, wrongAnswer, image, oneCharacter, imageResolution, imageSource } = result;
    const choices = shuffleArray([...(Array.isArray(wrongAnswer) ? wrongAnswer : []), correctAnswer]);

    return ensureValidQuestion({
        id: crypto.randomUUID(),
        type: "character-movie",
        prompt: `Dans quel film apparaît ce personnage ?`,
        image: image ?? undefined,
        choices: choices
            .filter(Boolean)
            .map((c: GhibliMovie) => ({
                id: c.id,
                label: c.title
            }))
            .filter((c) => c.id && c.label),
        correctChoiceId: correctAnswer.id,
        reportContext: {
            generatedBy: 'findCharacter',
            character: {
                id: oneCharacter.id,
                name: oneCharacter.name,
                species: oneCharacter.species
            },
            movie: {
                id: correctAnswer.id,
                title: correctAnswer.title,
                url: correctAnswer.url
            },
            image: buildImageReportContext(imageResolution, imageSource)
        }
    });
}

/**
 * Generates a multiple-choice quiz question identifying which character belongs to a specific movie.
 * @returns A promise resolving to the constructed quiz question.
 * @throws {Error} If the question generation fails.
 */

export async function makeCharacterFromMovieQuestion(): Promise<QuizQuestion> {
    const result = await characterFromMovie();
    if (!result) throw new Error('Failed to generate movie character question');
    const { oneMovie, correctAnswer, wrongAnswer } = result;

    const choices = shuffleArray([...wrongAnswer, correctAnswer]);

    const image = oneMovie.image ?? oneMovie.image_url;
    const imageSource = oneMovie.image || oneMovie.image_url ? 'movie-image' : oneMovie.movie_banner ? 'movie-banner' : 'none';

    return ensureValidQuestion({
        id: crypto.randomUUID(),
        type: "movie-character",
        prompt: `Quel personnage apparaît dans le film "${oneMovie.title}" ?`,
        image,
        choices: choices
            .filter(Boolean)
            .map((c: GhibliCharacter) => ({
                id: c.id,
                label: c.name
            }))
            .filter((c) => c.id && c.label),
        correctChoiceId: correctAnswer.id,
        reportContext: {
            generatedBy: 'characterFromMovie',
            character: {
                id: correctAnswer.id,
                name: correctAnswer.name,
                species: correctAnswer.species
            },
            movie: {
                id: oneMovie.id,
                title: oneMovie.title,
                url: oneMovie.url
            },
            image: {
                source: imageSource
            }
        }
    });
}

/**
 * Generates a multiple-choice quiz question identifying a movie's Japanese title.
 * @returns A promise resolving to the constructed quiz question.
 */

export async function makeJapaneseNameQuestion(): Promise<QuizQuestion> {
    const { correctAnswer, wrongAnswer, oneMovie } = await japaneseName();
    const choices = shuffleArray([correctAnswer, ...wrongAnswer]);
    const image = oneMovie?.image ?? oneMovie?.image_url;
    const imageSource = oneMovie?.image || oneMovie?.image_url ? 'movie-image' : oneMovie?.movie_banner ? 'movie-banner' : 'none';
    return ensureValidQuestion({
        id: crypto.randomUUID(),
        type: "japanese-name",
        prompt: `Quel est le titre japonais de ce film ?`,
        image,
        choices: choices.map((title, index) => ({
            id: index.toString(),
            label: title
        })),
        correctChoiceId: choices.findIndex(title => title === correctAnswer).toString(),
        reportContext: {
            generatedBy: 'japaneseName',
            movie: oneMovie
                ? {
                    id: oneMovie.id,
                    title: oneMovie.title,
                    url: oneMovie.url
                }
                : undefined,
            image: {
                source: imageSource
            }
        }
    });
}

const QUESTION_FACTORIES: QuestionFactory[] = [
    makeCharacterSpeciesQuestion,
    makeCharacterFromMovieQuestion,
    makeFindCharacterQuestion,
    makeJapaneseNameQuestion
];

const QUESTION_FACTORY_BY_TYPE: Record<QuestionTypeKey, QuestionFactory> = {
    'character-species': makeCharacterSpeciesQuestion,
    'movie-character': makeCharacterFromMovieQuestion,
    'character-movie': makeFindCharacterQuestion,
    'japanese-name': makeJapaneseNameQuestion
}

export function getQuestionFactoriesForSelection(selection: 'all' | QuestionTypeKey[]) {
    if (selection === 'all') return QUESTION_FACTORIES
    if (selection.length === 0) return QUESTION_FACTORIES
    return selection
        .map((type) => QUESTION_FACTORY_BY_TYPE[type])
        .filter(Boolean)
}

/**
 * Generates a randomized quiz with a specified number of questions.
 * @param count Number of questions to generate (default: 10).
 * @param types Array of question factory functions to randomly select from.
 * @returns A promise resolving to an array of generated quiz questions.
 * @throws {Error} If parameters are invalid or if it fails to generate the required amount.
 */

export async function generateQuiz(
    count = 10,
    types: QuestionFactory[] = QUESTION_FACTORIES
): Promise<QuizQuestion[]> {
    if (count < 1) throw new Error('Quiz question count must be greater than 0');
    if (types.length === 0) throw new Error('No question factories available');

    const questions: QuizQuestion[] = [];

    const maxAttempts = Math.max(10, count * 4);
    let attempts = 0;
    while (questions.length < count && attempts < maxAttempts) {
        attempts += 1;

        const factory =
            types[
                Math.floor(Math.random() * types.length)
            ] ?? makeCharacterSpeciesQuestion;

        try {
            const question = await factory();
            questions.push(question);
        } catch {
            // ignore and retry with another random factory
        }
    }

    if (questions.length < count) {
        throw new Error(`Could not generate requested quiz (${questions.length}/${count})`);
    }

    return questions;
}

export function checkAnswer(
  question: QuizQuestion,
  selectedChoiceId: string
) {
  return selectedChoiceId === question.correctChoiceId;
}
