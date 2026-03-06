const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

async function getTMDBData(title, year) {
  if (!TMDB_KEY) return { posterUrl: null, trailerVideoId: null };
  try {
    const searchUrl = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&year=${year}&include_adult=false`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    const match = data.results?.[0];
    if (!match) return { posterUrl: null, trailerVideoId: null };

    const posterUrl = match.poster_path ? `${TMDB_IMG}${match.poster_path}` : null;

    // Fetch trailers for this movie
    const vidRes = await fetch(`${TMDB_BASE}/movie/${match.id}/videos?api_key=${TMDB_KEY}`);
    const vidData = await vidRes.json();
    const trailer = vidData.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
      ?? vidData.results?.find(v => v.site === 'YouTube');
    const trailerVideoId = trailer?.key ?? null;

    return { posterUrl, trailerVideoId };
  } catch {
    return { posterUrl: null, trailerVideoId: null };
  }
}

export async function enrichWithPosters(movies) {
  return Promise.all(
    movies.map(async (m) => {
      const { posterUrl, trailerVideoId } = await getTMDBData(m.title, m.year);
      return { ...m, posterUrl, trailerVideoId };
    })
  );
}
