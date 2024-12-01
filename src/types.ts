export interface Cell {
  image: string | null;
  imageBase64: string | null;
  title: string;
  label: string;
}

export interface AnimeResult {
  id: number;
  title: string;
  image: string;
}

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
