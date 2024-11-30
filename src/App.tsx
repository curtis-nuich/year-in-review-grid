import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { Search, Plus, X, Share2 } from "lucide-react";
import { debounce } from "lodash";
import html2canvas from "html2canvas";
import "./App.css";

interface Cell {
  image: string | null;
  title: string;
  label: string;
}

interface AnimeResult {
  id: number;
  title: string;
  image: string;
}

interface AniListResponse {
  data: {
    Page: {
      media: Array<{
        id: number;
        title: {
          romaji: string;
          english: string | null;
        };
        coverImage: {
          medium: string;
        };
      }>;
    };
  };
}

const App = () => {
  const [gridSize, setGridSize] = useState<3 | 4>(3);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<AnimeResult[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [cells, setCells] = useState<Cell[]>(
    Array(16)
      .fill(null)
      .map(() => ({
        image: null,
        title: "",
        label: "",
      }))
  );
  const [customLabel, setCustomLabel] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const defaultLabels: string[] = [
    "Best Anime",
    "Worst Anime",
    "Best Opening",
    "Best Ending",
    "Most Underrated",
    "Best Animation",
    "Best Story",
    "Best Characters",
    "Most Disappointing",
    "Most Surprising",
    "Best OST",
    "Best Fight Scene",
    "Most Emotional",
    "Best Villain",
    "Best Comedy",
    "Best Romance",
  ];

  const searchAnime = async (term: string): Promise<void> => {
    if (!term) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const query = `
        query ($search: String) {
          Page(page: 1, perPage: 6) {
            media(search: $search, type: ANIME) {
              id
              title {
                romaji
                english
              }
              coverImage {
                medium
              }
            }
          }
        }
      `;

      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { search: term },
        }),
      });

      const data = (await response.json()) as AniListResponse;
      const results = data.data.Page.media.map((anime) => ({
        id: anime.id,
        title: anime.title.english || anime.title.romaji,
        image: anime.coverImage.medium,
      }));
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching anime:", error);
      setSearchResults([]);
    }
    setIsLoading(false);
  };

  const debouncedSearch = debounce(searchAnime, 500);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const handleCellClick = (index: number): void => {
    setSelectedCell(index);
    setCustomLabel("");
  };

  const handleAnimeSelect = (anime: AnimeResult): void => {
    if (selectedCell !== null) {
      const newCells = [...cells];
      newCells[selectedCell] = {
        ...newCells[selectedCell],
        image: anime.image,
        title: anime.title,
      };
      setCells(newCells);
      setSearchTerm("");
      setSearchResults([]);
    }
  };

  const handleLabelSelect = (label: string): void => {
    if (selectedCell !== null) {
      const newCells = [...cells];
      newCells[selectedCell] = {
        ...newCells[selectedCell],
        label: label,
      };
      setCells(newCells);
    }
  };

  const handleCustomLabelSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (selectedCell !== null && customLabel) {
      handleLabelSelect(customLabel);
      setCustomLabel("");
    }
  };

  const clearCell = (index: number): void => {
    const newCells = [...cells];
    newCells[index] = { image: null, title: "", label: "" };
    setCells(newCells);
  };

  const handleShare = async (): Promise<void> => {
    try {
      if (gridRef.current) {
        const canvas = await html2canvas(gridRef.current, {
          backgroundColor: "#0f172a",
          scale: 2,
        });

        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const data = new ClipboardItem({ "image/png": blob });
              await navigator.clipboard.write([data]);
              alert("Grid copied to clipboard! You can now paste it.");
            } catch (err) {
              console.error("Failed to copy to clipboard:", err);
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "anime-grid.png";
              a.click();
              URL.revokeObjectURL(url);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto" ref={gridRef}>
        <h1
          className="text-5xl font-bold text-center mb-8 text-blue-400"
          style={{
            fontFamily: "'Press Start 2P', cursive",
            textShadow:
              "2px 2px 4px rgba(0,0,0,0.5), -2px -2px 4px rgba(0,128,255,0.3)",
          }}
        >
          Anime in Review 2024
        </h1>

        <div className="mb-6 space-y-4">
          <div className="flex justify-center gap-4">
            <button
              className={`px-4 py-2 rounded ${
                gridSize === 3 ? "bg-blue-600" : "bg-slate-700"
              }`}
              onClick={() => setGridSize(3)}
            >
              3x3 Grid
            </button>
            <button
              className={`px-4 py-2 rounded ${
                gridSize === 4 ? "bg-blue-600" : "bg-slate-700"
              }`}
              onClick={() => setGridSize(4)}
            >
              4x4 Grid
            </button>
          </div>

          <div className="relative max-w-xl mx-auto">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search for anime..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 rounded text-white placeholder-slate-400 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {searchTerm && (
              <div className="absolute z-10 mt-2 w-full bg-slate-800 rounded-lg shadow-lg border border-slate-700">
                {isLoading ? (
                  <div className="p-4 text-center text-slate-400">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {searchResults.map((anime) => (
                      <div
                        key={anime.id}
                        onClick={() => handleAnimeSelect(anime)}
                        className="flex items-center gap-2 p-2 hover:bg-slate-700 cursor-pointer"
                      >
                        <img
                          src={anime.image}
                          alt={anime.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <span className="text-sm">{anime.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {cells.slice(0, gridSize * gridSize).map((cell, index) => (
            <div
              key={index}
              onClick={() => handleCellClick(index)}
              className={`relative aspect-square bg-slate-800 rounded-lg overflow-hidden cursor-pointer
                ${selectedCell === index ? "ring-4 ring-blue-500" : ""}
                hover:ring-2 hover:ring-blue-400 transition-all`}
            >
              {cell.image ? (
                <>
                  <img
                    src={cell.image}
                    alt={cell.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-between p-2">
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearCell(index);
                        }}
                        className="p-1 bg-red-500 rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div>
                      <div className="text-sm font-bold bg-blue-600 inline-block px-2 py-1 rounded mb-1">
                        {cell.label || "Add label"}
                      </div>
                      <div className="text-sm font-semibold">{cell.title}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Plus size={24} className="text-slate-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedCell !== null && (
        <div className="mt-6 p-4 bg-slate-800 rounded-lg max-w-6xl mx-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Choose Label</h3>
            <div className="flex flex-wrap gap-2">
              {defaultLabels.slice(0, 8).map((label, index) => (
                <button
                  key={index}
                  onClick={() => handleLabelSelect(label)}
                  className="px-3 py-1 bg-blue-600 rounded-full text-sm hover:bg-blue-700"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCustomLabelSubmit} className="flex gap-2">
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Custom label..."
              className="flex-1 px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Add Label
            </button>
          </form>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button
          onClick={handleShare}
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-lg"
        >
          <Share2 size={24} />
          Share Grid
        </button>
      </div>
    </div>
  );
};

export default App;
