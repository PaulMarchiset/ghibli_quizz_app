// const config = useRuntimeConfig();
import { type GhibliMovie, isGhibliMovie } from '../types/ghibli';
import { fetchJsonOrFallback } from './api';

const BASE_URL = "https://ghibliapi.vercel.app"; 

export async function allMovies(): Promise<GhibliMovie[]> {
    const data = await fetchJsonOrFallback<unknown, []>(`${BASE_URL}/films`, {
        context: 'allMovies',
        fallback: []
    });

    return Array.isArray(data) ? data.filter(isGhibliMovie) : [];
}

export async function movieByID(movieId: string): Promise<GhibliMovie | null> {
    const data = await fetchJsonOrFallback<unknown, null>(`${BASE_URL}/films/${movieId}`, {
        context: 'movieByID',
        fallback: null
    });

    return isGhibliMovie(data) ? data : null;
}