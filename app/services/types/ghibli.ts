export type GhibliMovie = {
  id: string;
  title: string;
  url: string;
  original_title?: string;
  original_title_romanised?: string;
  description?: string;
  image?: string;
  image_url?: string;
  movie_banner?: string;
  director?: string;
  producer?: string;
  release_date?: string;
  running_time?: string;
  rt_score?: string;
};

export type GhibliCharacter = {
  id: string;
  name: string;
  films: string[];
  url: string;
  species?: string;
};

export type GhibliSpecies = {
  id: string;
  name: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

export function isGhibliMovie(value: unknown): value is GhibliMovie {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.url)
  );
}

export function isGhibliCharacter(value: unknown): value is GhibliCharacter {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.url) &&
    isStringArray(value.films)
  );
}

export function isGhibliSpecies(value: unknown): value is GhibliSpecies {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id) && isNonEmptyString(value.name);
}