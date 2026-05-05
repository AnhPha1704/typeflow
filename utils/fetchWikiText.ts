/**
 * Utility to fetch a random meaningful page summary from Wikipedia.
 * Reverted to REST API for more coherent and concise summaries.
 */

export interface WikiPageData {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls?: {
    desktop: {
      page: string;
    };
  };
  lang: string;
}

export async function fetchWikiPage(lang: string = 'vi'): Promise<WikiPageData | null> {
  try {
    const response = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/random/summary`,
      {
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Clean text for typing area
    let cleanExtract = data.extract
      .replace(/\s*\([^)]*\)/g, '') // Remove (brackets)
      .replace(/\s*\[[^\]]*\]/g, '') // Remove [citations]
      .replace(/\u00AD/g, '')       // Remove soft hyphens
      .replace(/\s+/g, ' ')         // Normalize whitespace
      .trim()
      .normalize('NFC');            // Crucial for Vietnamese comparison

    // Ensure a reasonable length for a typing test
    // Not too short, not too long
    const MIN_LENGTH = 150;
    
    if (cleanExtract.length < MIN_LENGTH) {
      return fetchWikiPage(lang);
    }

    return {
      title: data.title,
      extract: cleanExtract,
      description: data.description,
      thumbnail: data.thumbnail,
      content_urls: data.content_urls,
      lang: lang
    };
  } catch (error) {
    console.error('Failed to fetch Wiki page:', error);
    return null;
  }
}
