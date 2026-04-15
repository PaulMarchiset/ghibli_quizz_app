import { allSpecies } from "../../api/Species";
import { allCharacters, characterImageWithMetadataByName } from "../../api/Characters";
import { type GhibliCharacter, type GhibliSpecies } from "../../types/ghibli";
import { pickRandom, shuffleArray } from "../utils/random";

export async function characterSpecies() {
    const characters = await allCharacters();
    const species = await allSpecies();

    const characterList: GhibliCharacter[] = characters;
    const speciesList: GhibliSpecies[] = species;
    const usableCharacters = characterList.filter(
        (c) => typeof c.species === 'string' && c.species.length > 0
    );

    if (usableCharacters.length === 0 || speciesList.length === 0) return null;

    // 1️⃣ Personnage aléatoire
    const correctCharacter = pickRandom(usableCharacters);
    if (!correctCharacter) return null;

    // 2️⃣ ID de l'espèce du personnage
    if (typeof correctCharacter.species !== 'string' || correctCharacter.species.length === 0) return null;
    const speciesId = correctCharacter.species.split("/").pop();
    if (!speciesId) return null;

    // 3️⃣ Espèce correcte
    const correctSpecies = speciesList.find(
        s => s.id === speciesId
    );

    if (!correctSpecies) return null;

    // 4️⃣ Espèces incorrectes
    const wrongSpecies = shuffleArray(
        speciesList.filter(s => s.id !== correctSpecies.id)
    ).slice(0, 3);

    // 5️⃣ Mélange des réponses
    const answers = shuffleArray([...wrongSpecies, correctSpecies]);

    // 6️⃣ Image du personnage
    // NOTE: `correctCharacter.species` from Ghibli API is a URL, not a human species name.
    // Passing the URL into `characterImageByName` makes its species filter fail and returns null.
    const imageResolution = await characterImageWithMetadataByName(
        correctCharacter.name,
        correctSpecies.name
    );

    return {
        character: correctCharacter,
        image: imageResolution.imageUrl,
        imageResolution,
        correctSpecies,
        answers
    };
}
