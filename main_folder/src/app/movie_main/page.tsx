"use client";

import React, { useEffect, useState } from "react";

// OMDb API Key
const API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY ?? "3bc93085";

type OmdbMovie = {
    Title: string;
    Year: string;
    imdbID: string;
    Poster: string;
};

type OmdbSearchResponse = {
    Search?: OmdbMovie[];
    totalResults?: string;
    Response: "True" | "False";
    Error?: string;
};

export default function MoviePage() {
    const [search, setSearch] = useState("");
    const [movies, setMovies] = useState<OmdbMovie[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<any>(null);
    const [loadingMovies, setLoadingMovies] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    // Poster helper
    const posterFor = (poster: string | undefined) =>
        poster && poster !== "N/A"
            ? poster
            : "https://via.placeholder.com/400x600?text=No+Poster";

    // Fetch movie list
    const fetchMovies = async (pageParam = 1, append = false) => {
        if (!search.trim()) return;
        setLoadingMovies(true);
        setError(null);

        try {
            const url = `https://www.omdbapi.com/?s=${encodeURIComponent(
                search
            )}&apikey=${API_KEY}&page=${pageParam}`;
            const res = await fetch(url);
            const data: OmdbSearchResponse = await res.json();

            if (data.Response === "False") {
                setError(data.Error || "No results");
                setMovies([]);
                setTotalResults(0);
            } else {
                setMovies((prev) =>
                    append ? [...prev, ...(data.Search || [])] : data.Search || []
                );
                setTotalResults(parseInt(data.totalResults || "0", 10));
                setPage(pageParam);
            }
        } catch (err) {
            setError("Failed to fetch movies. Check your network or API key.");
            console.error(err);
        } finally {
            setLoadingMovies(false);
        }
    };

    // Fetch details
    const fetchMovieDetails = async (id: string) => {
        if (!id) return;
        setLoadingDetails(true);
        setError(null);

        try {
            const res = await fetch(
                `https://www.omdbapi.com/?i=${encodeURIComponent(id)}&apikey=${API_KEY}`
            );
            const data = await res.json();

            if (data.Response === "False") {
                setError(data.Error || "Failed to load movie details.");
                setSelectedMovie(null);
            } else {
                setSelectedMovie(data);
            }
        } catch (err) {
            setError("Failed to fetch movie details.");
            console.error(err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Load more
    const loadMore = () => {
        const next = page + 1;
        if (movies.length >= totalResults) return;
        fetchMovies(next, true);
    };

    // Close modal on ESC
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedMovie(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (selectedMovie) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev;
            };
        }
    }, [selectedMovie]);

    return (
        <div className="bg-gradient-to-br from-gray-950 to-gray-800 min-h-screen text-gray-100 font-sans p-4 sm:p-8">
            {/* Header */}
            <header className="p-6 text-center bg-gray-900 rounded-3xl shadow-2xl border-b-4 border-red-600 mb-8 sm:mb-12 transition-all duration-500">
                <h1 className="text-4xl sm:text-6xl font-extrabold text-red-500 animate-fadeIn">
                    🎬 Movie Nexus
                </h1>
                <p className="text-gray-400 mt-2 sm:mt-4 text-sm sm:text-lg animate-fadeIn animation-delay-300">
                    Your cinematic journey starts here.
                </p>

                <div className="mt-6 flex justify-center max-w-xl mx-auto">
                    <input
                        type="text"
                        placeholder="Search for a movie..."
                        className="w-full p-3 sm:p-4 rounded-l-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-red-500 transition-all duration-300 transform hover:scale-105"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchMovies(1)}
                        aria-label="Search movies"
                    />
                    <button
                        onClick={() => fetchMovies(1)}
                        className="bg-red-600 px-6 sm:px-8 rounded-r-full text-white font-bold hover:bg-red-700 transition-colors duration-300 transform hover:scale-105"
                        aria-label="Search"
                    >
                        Search
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main>
                {error && (
                    <div className="max-w-4xl mx-auto mb-6 text-center text-red-400 font-semibold">
                        {error}
                    </div>
                )}

                {/* Movies Grid */}
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {loadingMovies && movies.length === 0 ? (
                        <p className="col-span-full text-center text-gray-400 text-lg sm:text-2xl py-20">
                            Loading movies...
                        </p>
                    ) : movies.length > 0 ? (
                        movies.map((movie: OmdbMovie) => (
                            <div
                                key={movie.imdbID}
                                onClick={() => fetchMovieDetails(movie.imdbID)}
                                className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 group"
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) =>
                                    (e.key === "Enter" || e.key === " ") &&
                                    fetchMovieDetails(movie.imdbID)
                                }
                            >
                                <div className="relative overflow-hidden">
                                    <img
                                        src={posterFor(movie.Poster)}
                                        alt={movie.Title}
                                        className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="p-4 text-center">
                                    <h2 className="text-lg sm:text-xl font-bold text-white truncate group-hover:text-red-400 transition-colors">
                                        {movie.Title}
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">{movie.Year}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 text-lg sm:text-2xl py-20">
                            Search for your next favorite movie! 🍿
                        </p>
                    )}
                </div>

                {/* Load more */}
                {movies.length > 0 && movies.length < totalResults && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={loadMore}
                            className="bg-gray-800 px-6 py-2 rounded-full text-white font-semibold hover:bg-gray-700 transition-colors"
                        >
                            {loadingMovies ? "Loading..." : "Load more"}
                        </button>
                    </div>
                )}
            </main>

            {/* Modal */}
            {selectedMovie && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn"
                    onClick={() => setSelectedMovie(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-4xl w-full relative shadow-2xl border-2 border-gray-700 transform scale-95 md:scale-100 transition-transform duration-300 animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedMovie(null)}
                            className="absolute top-4 right-4 text-white text-3xl bg-red-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors z-10"
                            aria-label="Close details"
                        >
                            ✕
                        </button>

                        {loadingDetails ? (
                            <div className="py-20 text-center text-gray-400">
                                Loading details...
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start">
                                <div className="flex-shrink-0">
                                    <img
                                        src={posterFor(selectedMovie?.Poster)}
                                        alt={selectedMovie?.Title}
                                        className="w-64 sm:w-80 rounded-2xl shadow-lg border-2 border-gray-700"
                                    />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h1 className="text-3xl sm:text-5xl font-extrabold text-red-500 leading-tight mb-2">
                                        {selectedMovie?.Title}
                                    </h1>
                                    <p className="text-gray-400 text-sm sm:text-lg">
                                        {selectedMovie?.Year} • {selectedMovie?.Runtime}
                                    </p>

                                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                                        {(selectedMovie?.Genre?.split(", ") ?? []).map(
                                            (genre: string, index: number) => (
                                                <span
                                                    key={index}
                                                    className="bg-gray-700 text-gray-200 text-xs px-3 py-1 rounded-full font-semibold"
                                                >
                                                    {genre}
                                                </span>
                                            )
                                        )}
                                    </div>

                                    <p className="mt-4 sm:mt-6 text-gray-300 text-sm sm:text-base leading-relaxed">
                                        {selectedMovie?.Plot && selectedMovie.Plot !== "N/A"
                                            ? selectedMovie.Plot
                                            : "Plot not available."}
                                    </p>

                                    <div className="mt-4 sm:mt-6 space-y-2 text-gray-200 text-sm">
                                        <p>
                                            <span className="font-bold text-red-400">Actors:</span>{" "}
                                            {selectedMovie?.Actors ?? "N/A"}
                                        </p>
                                        <p>
                                            <span className="font-bold text-red-400">Director:</span>{" "}
                                            {selectedMovie?.Director ?? "N/A"}
                                        </p>
                                        <p>
                                            <span className="font-bold text-red-400">
                                                IMDb Rating:
                                            </span>
                                            <span className="text-yellow-400 font-bold ml-2">
                                                ⭐ {selectedMovie?.imdbRating ?? "N/A"}
                                            </span>{" "}
                                            / 10
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
