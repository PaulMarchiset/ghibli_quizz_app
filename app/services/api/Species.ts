import { type GhibliSpecies, isGhibliSpecies } from '../types/ghibli';
import { fetchJsonOrFallback } from './api';

const BASE_URL = "https://ghibliapi.vercel.app";

export async function allSpecies(): Promise<GhibliSpecies[]> {
    const data = await fetchJsonOrFallback<unknown, []>(`${BASE_URL}/species`, {
        context: 'allSpecies',
        fallback: []
    });

    return Array.isArray(data) ? data.filter(isGhibliSpecies) : [];
}