// const config = useRuntimeConfig();
import { ref } from 'vue';
import { type GhibliMovie, isGhibliMovie } from '../types/ghibli';

const BASE_URL = "https://ghibliapi.vercel.app"; 

export async function allMovies() {
    const collection = ref<GhibliMovie[]>([]);

    try {
        const response = await fetch(`${BASE_URL}/films`);
        if (!response.ok) {
            console.error(`[allMovies] HTTP ${response.status} ${response.statusText}`);
            return collection;
        }

        const data = await response.json();
        collection.value = Array.isArray(data) ? data.filter(isGhibliMovie) : [];
        return collection;
    } catch (error) {
        console.error('[allMovies] Fetch failed', error);
        return collection;
    }
}

export async function movieByID(movieId: string) {
    const collection = ref<GhibliMovie | null>(null);

    try {
        const response = await fetch(`${BASE_URL}/films/${movieId}`);
        if (!response.ok) {
            console.error(`[movieByID] HTTP ${response.status} ${response.statusText}`);
            return collection;
        }

        const data = await response.json();
        collection.value = isGhibliMovie(data) ? data : null;
        return collection;
    } catch (error) {
        console.error('[movieByID] Fetch failed', error);
        return collection;
    }
}