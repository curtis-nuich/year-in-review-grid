export interface AnimeResult {
  id: number;
  title: string;
  image: string;
}

export interface Cell {
  id: number;
  image: string | null;
  imageBase64: string | null;
  title: string;
  label: string;
}

export type GridSize = 3 | 4;

export interface AniListResponse {
  data: {
    Page: {
      media: Array<{
        id: number;
        title: {
          romaji: string;
          english: string | null;
        };
        coverImage: {
          large: string;
        };
      }>;
    };
  };
}
