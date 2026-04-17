import { allMovies } from '../../api/Movies';
import { allCharacters } from '../../api/Characters';
import { type GhibliCharacter, type GhibliMovie } from '../../types/ghibli';
import { pickRandom, shuffleArray } from '../utils/random';

/**
 * Generates a quiz question where the player must identify a character from a randomly selected movie.
 * @returns A promise resolving to an object containing the selected movie, the correct character answer, and a list of wrong character answers.
 */

export async function characterFromMovie() {
    const movies = await allMovies();
    const characters = await allCharacters();

    const movieList: GhibliMovie[] = movies;
    const characterList: GhibliCharacter[] = characters;

    if (movieList.length === 0 || characterList.length === 0) return null;

    const oneMovie = pickRandom(movieList);
    if (!oneMovie) return null;

    const movieUrl = oneMovie.url;

    const movieCharacters = characterList.filter((c) => c.films.includes(movieUrl));

    if (movieCharacters.length === 0) return null;

    const correctAnswer = pickRandom(movieCharacters);
    if (!correctAnswer) return null;

    const movieCharacterIds = new Set(movieCharacters.map((c) => c.id));
    const wrongAnswer = shuffleArray(
        characterList.filter((c) => !movieCharacterIds.has(c.id))
    ).slice(0, 3);

    if (wrongAnswer.length < 1) return null;

    return { oneMovie, correctAnswer, wrongAnswer };
}
