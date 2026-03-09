import { ref } from 'vue';
import { type GhibliSpecies, isGhibliSpecies } from '../types/ghibli';

const BASE_URL = "https://ghibliapi.vercel.app";

export async function allSpecies() {
    const collection = ref<GhibliSpecies[]>([]);
    console.log("Fetching from API URL:", BASE_URL);

    const response = await fetch(`${BASE_URL}/species`);
    const data = await response.json();
    collection.value = Array.isArray(data) ? data.filter(isGhibliSpecies) : [];
    return collection;
}