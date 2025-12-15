import { AnimeResult, AniListResponse } from "../types";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

// Try multiple CORS proxies as fallbacks
const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
];

const ANIME_SEARCH_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 8) {
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

export async function searchAnime(term: string): Promise<AnimeResult[]> {
  if (!term.trim()) return [];

  try {
    const response = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: ANIME_SEARCH_QUERY,
        variables: { search: term },
      }),
    });

    const data = (await response.json()) as AniListResponse;
    return data.data.Page.media.map((anime) => ({
      id: anime.id,
      title: anime.title.english || anime.title.romaji,
      image: anime.coverImage.large,
    }));
  } catch (error) {
    console.error("Failed to search anime:", error);
    throw error;
  }
}

export async function convertImageToBase64(url: string): Promise<string> {
  // Try each CORS proxy in sequence
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxyUrl = CORS_PROXIES[i] + encodeURIComponent(url);
      const response = await fetch(proxyUrl);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn(`CORS proxy ${i + 1} failed:`, error);
      if (i === CORS_PROXIES.length - 1) {
        throw new Error("All CORS proxies failed");
      }
    }
  }

  throw new Error("Failed to convert image");
}

export const DEFAULT_LABELS = [
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
  "Guilty Pleasure",
  "Hidden Gem",
  "Best Action",
  "Best Movie",
  "Best Guy",
  "Best Girl",
] as const;
