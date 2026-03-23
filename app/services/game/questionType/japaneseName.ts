import { allMovies } from '~/services/api/Movies';
import { type GhibliMovie } from '~/services/types/ghibli';
import { pickRandom } from '../utils/random';

function movieDisplayTitle(movie?: GhibliMovie | null) {
    return (
        movie?.original_title ??
        movie?.title ??
        movie?.original_title_romanised ??
        ''
    ).trim();
}

export async function japaneseName() {
    const movies = await allMovies();

    const list: GhibliMovie[] = movies;
    const usable = list.filter((m) => movieDisplayTitle(m).length > 0);

    if (usable.length === 0) {
        return {
            correctAnswer: '',
            wrongAnswer: [] as string[],
            oneMovie: null,
            error: 'No movies available',
        };
    }

    const oneMovie = pickRandom(usable);
    if (!oneMovie) {
        return {
            correctAnswer: '',
            wrongAnswer: [] as string[],
            oneMovie: null,
            error: 'No movie picked',
        };
    }
    const correctAnswer = movieDisplayTitle(oneMovie);

    const wrongAnswer: string[] = [];
    const used = new Set<string>([correctAnswer]);

    const targetWrong = Math.min(3, Math.max(0, usable.length - 1));
    while (wrongAnswer.length < targetWrong) {
        const randomMovie = pickRandom(usable);
        const candidate = movieDisplayTitle(randomMovie);
        if (!candidate || used.has(candidate)) continue;
        used.add(candidate);
        wrongAnswer.push(candidate);
    }

    return { correctAnswer, wrongAnswer, oneMovie };

}