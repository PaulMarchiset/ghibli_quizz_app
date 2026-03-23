import { allCharacters, characterImageByName } from '../../api/Characters';
import { allMovies } from '../../api/Movies';
import { type GhibliCharacter, type GhibliMovie } from '../../types/ghibli';
import { pickRandom, shuffleArray } from '../utils/random';

function toFilmUrl(movie: GhibliMovie): string {
    return movie.url;
}

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
    const characterImage = await characterImageByName(oneCharacter.name, oneCharacter.species ?? '');

    const filmUrls = oneCharacter.films.filter(Boolean);
    if (filmUrls.length === 0) return null;

    const correctFilmUrl = pickRandom(filmUrls);
    if (!correctFilmUrl) return null;

    const correctAnswer = movieList.find(m => toFilmUrl(m) === correctFilmUrl) ?? null;
    if (!correctAnswer) return null;

    // Fallback: if we can't find a character portrait (Jikan often has no match),
    // show the movie poster/banner instead so the UI still has an image.
    const fallbackImage = correctAnswer.image ?? correctAnswer.movie_banner ?? null;

    const finalWrongAnswer = shuffleArray(
        movieList.filter(m => toFilmUrl(m) !== correctFilmUrl)
    ).slice(0, 3);

    if (finalWrongAnswer.length < 1) return null;

    return {
        oneCharacter,
        image: characterImage ?? fallbackImage,
        correctAnswer,
        wrongAnswer: finalWrongAnswer
    };
}