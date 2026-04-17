import { allCharacters, characterImageWithMetadataByName } from '../../api/Characters';
import { allMovies } from '../../api/Movies';
import { type GhibliCharacter, type GhibliMovie } from '../../types/ghibli';
import { pickRandom, shuffleArray } from '../utils/random';

function toFilmUrl(movie: GhibliMovie): string {
    return movie.url;
}

/**
 * Generates a quiz question where the player must identify a character from a randomly selected movie.
 * @returns A promise resolving to an object containing the selected movie, the correct character answer, and a list of wrong character answers.
 */

export async function findCharacter() {
    const characters = await allCharacters();
    const movies = await allMovies();

    const movieList: GhibliMovie[] = movies;
    const characterList: GhibliCharacter[] = characters;

    const usableCharacters = characterList.filter((c) => c.films.length > 0);

    if (usableCharacters.length === 0 || movieList.length === 0) {
        return null;
    }

    const oneCharacter = pickRandom(usableCharacters);
    if (!oneCharacter) return null;
    const imageResolution = await characterImageWithMetadataByName(oneCharacter.name, oneCharacter.species ?? '');

    const filmUrls = oneCharacter.films.filter(Boolean);
    if (filmUrls.length === 0) return null;

    const correctFilmUrl = pickRandom(filmUrls);
    if (!correctFilmUrl) return null;

    const correctAnswer = movieList.find(m => toFilmUrl(m) === correctFilmUrl) ?? null;
    if (!correctAnswer) return null;

    // Fallback: if we can't find a character portrait (Jikan can no match),
    // we show the movie poster/banner instead so the UI still has an image.
    const fallbackImage = correctAnswer.image ?? correctAnswer.movie_banner ?? null;
    const imageSource = imageResolution.imageUrl
        ? imageResolution.source
        : fallbackImage
            ? 'movie-fallback'
            : 'none';

    const finalWrongAnswer = shuffleArray(
        movieList.filter(m => toFilmUrl(m) !== correctFilmUrl)
    ).slice(0, 3);

    if (finalWrongAnswer.length < 1) return null;

    return {
        oneCharacter,
        image: imageResolution.imageUrl ?? fallbackImage,
        imageResolution,
        imageSource,
        correctAnswer,
        wrongAnswer: finalWrongAnswer
    };
}