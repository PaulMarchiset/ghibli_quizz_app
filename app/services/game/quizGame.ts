import { characterSpecies } from "./questionType/characterSpecies";
import { characterFromMovie } from "./questionType/characterFromMovie";
import { findCharacter } from "./questionType/findCharacter";
import { japaneseName } from "./questionType/japaneseName";
import { type GhibliCharacter, type GhibliMovie, type GhibliSpecies } from "../types/ghibli";
import { shuffleArray } from "./utils/random";

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
};

export type QuestionTypeKey = QuizQuestion['type']

type QuizChoice = QuizQuestion['choices'][number];
type QuestionFactory = () => Promise<QuizQuestion>;

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

export async function makeCharacterSpeciesQuestion(): Promise<QuizQuestion> {
    const result = await characterSpecies();
    if (!result) throw new Error('Failed to generate character species question');
    const { character, answers, correctSpecies, image } = result;

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
        correctChoiceId: correctSpecies.id
    });
}

export async function makeFindCharacterQuestion(): Promise<QuizQuestion> {
    const result = await findCharacter();
    if (!result) throw new Error('Failed to generate character movie question');
    const { correctAnswer, wrongAnswer, image } = result;
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
        correctChoiceId: correctAnswer.id
    });
}


export async function makeCharacterFromMovieQuestion(): Promise<QuizQuestion> {
    const result = await characterFromMovie();
    if (!result) throw new Error('Failed to generate movie character question');
    const { oneMovie, correctAnswer, wrongAnswer } = result;

    const choices = shuffleArray([...wrongAnswer, correctAnswer]);

    const image = oneMovie.image ?? oneMovie.image_url;

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
        correctChoiceId: correctAnswer.id
    });
}

export async function makeJapaneseNameQuestion(): Promise<QuizQuestion> {
    const { correctAnswer, wrongAnswer, oneMovie } = await japaneseName();
    const choices = shuffleArray([correctAnswer, ...wrongAnswer]);
    const image = oneMovie?.image ?? oneMovie?.image_url;
    return ensureValidQuestion({
        id: crypto.randomUUID(),
        type: "japanese-name",
        prompt: `Quel est le titre japonais de ce film ?`,
        image,
        choices: choices.map((title, index) => ({
            id: index.toString(),
            label: title
        })),
        correctChoiceId: choices.findIndex(title => title === correctAnswer).toString()
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

export function getQuestionFactoriesForSelection(selection: 'all' | QuestionTypeKey) {
    if (selection === 'all') return QUESTION_FACTORIES
    return [QUESTION_FACTORY_BY_TYPE[selection]]
}


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
