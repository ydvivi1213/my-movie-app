const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

export async function getPosterUrl(title, year) {
  if (!TMDB_KEY) return null;
  try {
    const url = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&year=${year}&include_adult=false`;
    const res = await fetch(url);
    const data = await res.json();
    const match = data.results?.[0];
    return match?.poster_path ? `${TMDB_IMG}${match.poster_path}` : null;
  } catch {
    return null;
  }
}

export async function enrichWithPosters(movies) {
  return Promise.all(
    movies.map(async (m) => ({
      ...m,
      posterUrl: await getPosterUrl(m.title, m.year),
    }))
  );
}
