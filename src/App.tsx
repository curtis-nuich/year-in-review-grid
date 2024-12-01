import { useState, useRef, ChangeEvent } from "react";
import { Search, Plus, X, Clipboard, Download } from "lucide-react";
import { AniListResponse, AnimeResult, Cell } from "./types";
import { Toast } from "./Toast";
import { captureGrid } from "./captureGrid";

const App = () => {
  const [username, setUsername] = useState<string>("");
  const [showUsernamePrompt, setShowUsernamePrompt] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<3 | 4>(3);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<AnimeResult[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [cells, setCells] = useState<Cell[]>(
    Array(16)
      .fill(null)
      .map(() => ({
        image: null,
        imageBase64: null,
        title: "",
        label: "",
      }))
  );
  const [activeTab, setActiveTab] = useState<"search" | "custom">("search");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const defaultLabels: string[] = [
    "Best Anime",
    "Worst Anime",
    "Best OP",
    "Best ED",
    "Most Underrated",
    "Best Animation",
    "Best Story",
    "Best Characters",
    "Most Disappointing",
    "Most Surprising",
    "Most Emotional",
    "Best Villain",
    "Best Comedy",
  ];

  const convertImageToBase64 = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const corsProxyUrl = `https://cors.bridged.cc/${url}`;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        try {
          const dataURL = canvas.toDataURL("image/jpeg");
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => {
        // If the proxy fails, try another one
        const fallbackUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        img.src = fallbackUrl;
      };
      img.src = corsProxyUrl;
    });
  };

  const handleAnimeSelect = async (anime: AnimeResult) => {
    if (selectedCell === null) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const imageBase64 = await convertImageToBase64(anime.image);
      const newCells = [...cells];
      newCells[selectedCell] = {
        ...newCells[selectedCell],
        image: anime.image,
        imageBase64,
        title: anime.title,
        label: selectedLabel || newCells[selectedCell].label,
      };
      setCells(newCells);
      setSearchTerm("");
      setSearchResults([]);
      setSelectedLabel("");
    } catch (error) {
      console.error("Error handling anime selection:", error);
    }
  };

  const handleLabelSelect = (label: string) => {
    if (selectedCell === null) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    setSelectedLabel(label);
    const newCells = [...cells];
    if (newCells[selectedCell].image) {
      newCells[selectedCell] = {
        ...newCells[selectedCell],
        label,
      };
      setCells(newCells);
      setSelectedLabel("");
    }
  };

  const handleCustomLabelSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (customLabel.trim() && selectedCell !== null) {
      handleLabelSelect(customLabel.trim());
      setCustomLabel("");
    }
  };

  const handleCellClick = (index: number) => {
    setSelectedCell(index);
    setSelectedLabel("");
  };

  const clearCell = (index: number) => {
    const newCells = [...cells];
    newCells[index] = {
      image: null,
      imageBase64: null,
      title: "",
      label: "",
    };
    setCells(newCells);
    setSelectedLabel("");
  };

  const searchAnime = async (term: string): Promise<void> => {
    if (!term) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
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
                large
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
        image: anime.coverImage.large,
      }));
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching anime:", error);
      setSearchResults([]);
    }
    setIsLoading(false);
  };

  const handleShare = async (): Promise<void> => {
    try {
      if (contentRef.current) {
        const blob = await captureGrid(contentRef, cells, gridSize, username);

        try {
          // Try to copy to clipboard
          const data = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([data]);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } catch (err) {
          // Fallback to download if clipboard fails
          console.error("Failed to copy to clipboard:", err);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "anime-grid.png";
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  if (showUsernamePrompt) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">Welcome!</h2>
          <p className="text-slate-400 mb-4 text-center">
            Enter your name (or discord username!) to show the world who's year
            in review it is!
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (username.trim()) {
                setShowUsernamePrompt(false);
              }
            }}
            className="space-y-4"
          >
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Enter username"
              required
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="space-y-4">
          {/* Control Panel */}
          <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
            {/* Grid Size Controls */}
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={() => setGridSize(3)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  gridSize === 3
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 border border-blue-600 text-white hover:bg-blue-600/20"
                }`}
              >
                3x3 Grid
              </button>
              <button
                onClick={() => setGridSize(4)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  gridSize === 4
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 border border-blue-600 text-white hover:bg-blue-600/20"
                }`}
              >
                4x4 Grid
              </button>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  activeTab === "search"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 border border-blue-600 text-white hover:bg-blue-600/20"
                }`}
              >
                Search Anime
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  activeTab === "custom"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 border border-blue-600 text-white hover:bg-blue-600/20"
                }`}
              >
                Custom Entry
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "search" ? (
              // Search Anime Content
              <>
                <div
                  className="relative mb-4"
                  style={{
                    pointerEvents: selectedCell === null ? "none" : "auto",
                    opacity: selectedCell === null ? 0.5 : 1,
                  }}
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onClick={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.select();
                        }}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          if (!e.target.value) {
                            setHasSearched(false);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            searchAnime(searchTerm);
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-900 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none text-white placeholder-slate-400"
                        placeholder={
                          selectedCell === null
                            ? "Select a grid cell first..."
                            : "Search for anime..."
                        }
                      />
                    </div>
                    <button
                      onClick={() => searchAnime(searchTerm)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Search
                    </button>
                  </div>
                  {searchTerm && hasSearched && (
                    <div className="absolute w-full mt-2 bg-slate-800 border border-slate-900 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                      {isLoading ? (
                        <div className="p-4 text-slate-400">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((anime) => (
                          <div
                            key={anime.id}
                            onClick={() => handleAnimeSelect(anime)}
                            className="p-2 hover:bg-blue-600/20 cursor-pointer flex items-center gap-2"
                          >
                            <img
                              src={anime.image}
                              alt={anime.title}
                              className="w-10 h-10 object-cover rounded"
                              referrerPolicy="no-referrer"
                            />
                            <span>{anime.title}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-slate-400">
                          No results found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Custom Entry Content
              <div
                className="space-y-4 mb-4"
                style={{
                  pointerEvents: selectedCell === null ? "none" : "auto",
                  opacity: selectedCell === null ? 0.5 : 1,
                }}
              >
                <div
                  className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-blue-600 transition-colors cursor-pointer"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer?.files[0];
                    if (file && file.type.startsWith("image/")) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setCustomImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setCustomImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  {customImage ? (
                    <img
                      src={customImage}
                      alt="Custom upload"
                      className="max-h-40 mx-auto rounded"
                    />
                  ) : (
                    <div className="text-slate-400">
                      <p>Drop image here or click to upload</p>
                      <p className="text-sm">Supports: JPG, PNG, GIF</p>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-900 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Enter title..."
                />
                <button
                  onClick={() => {
                    if (selectedCell !== null && customImage && customTitle) {
                      const newCells = [...cells];
                      newCells[selectedCell] = {
                        ...newCells[selectedCell],
                        image: customImage,
                        imageBase64: customImage,
                        title: customTitle,
                        label: selectedLabel || newCells[selectedCell].label,
                      };
                      setCells(newCells);
                      setCustomImage(null);
                      setCustomTitle("");
                      setSelectedLabel("");
                    }
                  }}
                  disabled={!customImage || !customTitle}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Grid
                </button>
              </div>
            )}

            {/* Labels */}
            <div
              className="space-y-4"
              style={{
                pointerEvents: selectedCell === null ? "none" : "auto",
                opacity: selectedCell === null ? 0.5 : 1,
              }}
            >
              <h3 className="text-lg font-semibold text-white">Choose Label</h3>
              <div className="flex flex-wrap gap-2">
                {defaultLabels
                  .slice(0, gridSize === 3 ? 9 : 16)
                  .map((label) => (
                    <button
                      key={label}
                      onClick={() => handleLabelSelect(label)}
                      className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                        selectedLabel === label
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-slate-800 border-blue-600 text-white hover:bg-blue-600/20"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
              </div>
              <form onSubmit={handleCustomLabelSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-900 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Custom label..."
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </form>
            </div>
          </div>

          {/* Grid Content */}
          <div ref={gridRef} className="w-full max-w-2xl mx-auto">
            <div ref={contentRef}>
              <h1 className="text-4xl md:text-5xl text-center font-bold text-blue-400 mb-6 tracking-wide">
                {username ? `${username}'s ` : ""}Year in Review
              </h1>

              <div
                className="grid gap-3 mx-auto mb-6"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                }}
              >
                {cells.slice(0, gridSize * gridSize).map((cell, index) => (
                  <div
                    key={index}
                    onClick={() => handleCellClick(index)}
                    className={`aspect-square bg-slate-800 rounded-lg relative overflow-hidden hover:ring-2 hover:ring-blue-600 transition-all cursor-pointer
                    ${selectedCell === index ? "ring-2 ring-blue-600" : ""}
                    ${
                      cell.label === "Best Anime"
                        ? "ring-4 ring-yellow-500"
                        : ""
                    }`}
                  >
                    {cell.image ? (
                      <>
                        <div className="absolute inset-0">
                          <img
                            src={cell.imageBase64 || cell.image}
                            alt={cell.title}
                            className="w-full h-full object-cover"
                            style={{ imageRendering: "crisp-edges" }}
                          />
                        </div>
                        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                          <div className="flex justify-end pointer-events-auto">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearCell(index);
                              }}
                              className="p-1 bg-slate-900/70 hover:bg-slate-900 rounded-full transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="pointer-events-auto">
                            <div className="grid-label bg-blue-600/80 text-sm px-2 py-1 rounded inline-flex items-center gap-1 mb-2">
                              {cell.label || "Add label"}
                            </div>
                            <div className="text-sm font-semibold line-clamp-2 bg-slate-900/70 px-2 py-1 rounded">
                              {cell.title}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Plus className="h-8 w-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Share Button */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <Clipboard className="h-5 w-5" />
                Copy to Clipboard
              </button>
              <button
                onClick={async () => {
                  try {
                    if (contentRef.current) {
                      const blob = await captureGrid(
                        contentRef,
                        cells,
                        gridSize,
                        username
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "year-in-review.png";
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  } catch (error) {
                    console.error("Error saving image:", error);
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <Download className="h-5 w-5" />
                Save as Image
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast
        message={
          selectedCell === null
            ? "Select a grid cell first!"
            : "Grid copied to clipboard!"
        }
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default App;
