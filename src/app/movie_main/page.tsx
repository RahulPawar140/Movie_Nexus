"use client";

import React, { useEffect, useState } from "react";

/* ================= API KEYS ================= */
const OMDB_API_KEY = "3bc93085";
const TMDB_API_KEY = "6cdc5a55e0c61a2387d19db8bbb70304";

/* ================= GENRES ================= */
const GENRES: Record<string, number | null> = {
    All: null,
    Action: 28,
    Comedy: 35,
    Horror: 27,
    "Sci-Fi": 878,
    Romance: 10749,
    Thriller: 53,
    Anime: 16,
};

/* ================= TYPES ================= */
type Movie = {
    Title: string;
    Year: string;
    imdbID: string;
    Poster: string;
};

export default function MoviePage() {
    const [search, setSearch] = useState("");
    const [movies, setMovies] = useState<Movie[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<any>(null);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);

    const [watchlist, setWatchlist] = useState<Movie[]>([]);
    const [viewWatchlist, setViewWatchlist] = useState(false);

    const [activeGenre, setActiveGenre] = useState("All");

    const [loadingMovies, setLoadingMovies] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [trailerLoading, setTrailerLoading] = useState(false);

    const [suggestions, setSuggestions] = useState<Movie[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [hoverTrailer, setHoverTrailer] = useState<string | null>(null);
    const [hoverTimer, setHoverTimer] = useState<any>(null);

    const list = viewWatchlist ? watchlist : movies;

    /* ================= WATCHLIST ================= */
    useEffect(() => {
        const saved = localStorage.getItem("watchlist");
        if (saved) setWatchlist(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem("watchlist", JSON.stringify(watchlist));
    }, [watchlist]);

    /* ================= INITIAL LOAD ================= */
    useEffect(() => {
        fetchPopular();
    }, []);

    /* ================= POPULAR ================= */
    const fetchPopular = async () => {
        setLoadingMovies(true);
        setActiveGenre("All");

        try {
            const res = await fetch(
                `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`
            );
            const data = await res.json();

            setMovies(
                data?.results?.map((m: any) => ({
                    Title: m.title,
                    Year: m.release_date?.split("-")[0] || "N/A",
                    imdbID: m.id.toString(),
                    Poster: m.poster_path
                        ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                        : "N/A",
                })) || []
            );
        } finally {
            setLoadingMovies(false);
        }
    };

    /* ================= SEARCH ================= */
    const fetchMovies = async () => {
        if (!search.trim()) return;

        setLoadingMovies(true);
        setViewWatchlist(false);
        setActiveGenre("All");

        try {
            const res = await fetch(
                `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${search}`
            );
            const data = await res.json();
            setMovies(data?.Search || []);
        } finally {
            setLoadingMovies(false);
            setShowSuggestions(false);
        }
    };

    /* ================= GENRE ================= */
    const fetchByGenre = async (genre: string) => {
        setActiveGenre(genre);
        setViewWatchlist(false);

        if (genre === "All") return fetchPopular();

        setLoadingMovies(true);

        try {
            const res = await fetch(
                `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${GENRES[genre]}&sort_by=popularity.desc`
            );
            const data = await res.json();

            setMovies(
                data?.results?.map((m: any) => ({
                    Title: m.title,
                    Year: m.release_date?.split("-")[0] || "N/A",
                    imdbID: m.id.toString(),
                    Poster: m.poster_path
                        ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                        : "N/A",
                })) || []
            );
        } finally {
            setLoadingMovies(false);
        }
    };

    /* ================= TMDB DETAILS ================= */
    const fetchTMDBDetails = async (id: string) => {
        const res = await fetch(
            `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`
        );
        const data = await res.json();

        return {
            Title: data.title,
            Year: data.release_date?.split("-")[0] || "N/A",
            Runtime: data.runtime ? `${data.runtime} min` : "N/A",
            Plot: data.overview || "No description available.",
        };
    };

    /* ================= OPEN MOVIE ================= */
    const openMovie = async (movie: Movie) => {
        setSelectedMovie(movie);
        setDetailsLoading(true);
        setTrailerLoading(true);
        setTrailerKey(null);

        try {
            if (movie.imdbID.startsWith("tt")) {
                const res = await fetch(
                    `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movie.imdbID}`
                );
                const data = await res.json();
                setSelectedMovie(data);
            } else {
                const details = await fetchTMDBDetails(movie.imdbID);
                setSelectedMovie((prev: any) => ({
                    ...prev,
                    ...details,
                }));
            }

            await fetchTrailer(movie.imdbID);
        } finally {
            setDetailsLoading(false);
        }
    };

    /* ================= TRAILER ================= */
    const fetchTrailer = async (id: string) => {
        try {
            const res = await fetch(
                `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_API_KEY}`
            );
            const data = await res.json();

            const trailer = data?.results?.find(
                (v: any) => v.site === "YouTube" && v.type === "Trailer"
            );

            setTrailerKey(trailer?.key || null);
        } finally {
            setTrailerLoading(false);
        }
    };

    /* ================= HOVER TRAILER ================= */
    const handleHover = (movie: Movie) => {
        if (hoverTimer) clearTimeout(hoverTimer);

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://api.themoviedb.org/3/movie/${movie.imdbID}/videos?api_key=${TMDB_API_KEY}`
                );
                const data = await res.json();

                const trailer = data?.results?.find(
                    (v: any) => v.site === "YouTube" && v.type === "Trailer"
                );

                if (trailer) setHoverTrailer(movie.imdbID);
            } catch { }
        }, 600);

        setHoverTimer(timer);
    };

    /* ================= SUGGESTIONS ================= */
    useEffect(() => {
        if (!search.trim()) {
            setSuggestions([]);
            return;
        }

        const delay = setTimeout(async () => {
            const res = await fetch(
                `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${search}`
            );
            const data = await res.json();

            setSuggestions(data?.Search?.slice(0, 5) || []);
            setShowSuggestions(true);
        }, 400);

        return () => clearTimeout(delay);
    }, [search]);

    /* ================= WATCHLIST ================= */
    const toggleFavorite = (movie: Movie) => {
        setWatchlist((prev) =>
            prev.some((m) => m.imdbID === movie.imdbID)
                ? prev.filter((m) => m.imdbID !== movie.imdbID)
                : [...prev, movie]
        );
    };

    const isFavorite = (id: string) =>
        watchlist.some((m) => m.imdbID === id);

    const posterFor = (p?: string) =>
        p && p !== "N/A"
            ? p
            : "https://via.placeholder.com/400x600?text=No+Poster";

    /* ================= UI ================= */
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 sm:p-8">

            {/* HEADER */}
            <header className="text-center mb-10">
                <h1 className="text-5xl font-extrabold text-red-500">
                    🎬 Movie Nexus
                </h1>

                {/* SEARCH */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center relative">
                    <div className="relative">
                        <input
                            className="px-5 py-3 rounded-full bg-gray-800 w-full sm:w-96 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="Search movies..."
                        />

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 bg-gray-900 w-full mt-2 rounded-lg border border-gray-700">
                                {suggestions.map((s) => (
                                    <div
                                        key={s.imdbID}
                                        className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                                        onClick={() => {
                                            setSearch(s.Title);
                                            setShowSuggestions(false);
                                        }}
                                    >
                                        {s.Title}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={fetchMovies}
                        className="px-6 py-3 rounded-full font-bold bg-red-600"
                    >
                        Search
                    </button>

                    <button
                        onClick={() => setViewWatchlist(!viewWatchlist)}
                        className="px-6 py-3 rounded-full bg-gray-800"
                    >
                        ⭐ Watchlist ({watchlist.length})
                    </button>
                </div>

                {/* GENRES */}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {Object.keys(GENRES).map((g) => (
                        <button
                            key={g}
                            onClick={() => fetchByGenre(g)}
                            className={`px-5 py-2 rounded-full ${activeGenre === g
                                    ? "bg-red-600"
                                    : "bg-gray-800"
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </header>

            {/* GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {loadingMovies
                    ? null
                    : list.map((movie) => (
                        <div
                            key={movie.imdbID}
                            className="group bg-gray-800/60 rounded-xl overflow-hidden relative"
                            onMouseEnter={() => handleHover(movie)}
                            onMouseLeave={() => setHoverTrailer(null)}
                        >
                            <div className="relative">
                                <img
                                    src={posterFor(movie.Poster)}
                                    className="h-72 w-full object-cover"
                                    onClick={() => openMovie(movie)}
                                />

                                <button
                                    onClick={() => toggleFavorite(movie)}
                                    className="absolute top-2 right-2 text-xl"
                                >
                                    {isFavorite(movie.imdbID) ? "❤️" : "🤍"}
                                </button>
                            </div>

                            <div className="p-3 text-center">
                                <h2 className="font-bold truncate">
                                    {movie.Title}
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    {movie.Year}
                                </p>
                            </div>
                        </div>
                    ))}
            </div>

            {/* MODAL */}
            {selectedMovie && (
                <div
                    className="fixed inset-0 bg-black/80 flex justify-center items-center p-4"
                    onClick={() => setSelectedMovie(null)}
                >
                    <div
                        className="bg-gray-900 w-full max-w-3xl p-6 rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-3xl text-red-500">
                            {selectedMovie.Title}
                        </h2>

                        <p className="text-gray-400 mt-2">
                            {selectedMovie.Year} • {selectedMovie.Runtime}
                        </p>

                        <p className="mt-3 text-gray-300">
                            {selectedMovie.Plot}
                        </p>

                        {trailerKey && (
                            <iframe
                                className="w-full h-64 mt-4"
                                src={`https://www.youtube.com/embed/${trailerKey}`}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}