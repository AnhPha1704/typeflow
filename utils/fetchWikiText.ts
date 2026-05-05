/**
 * Utility to fetch a random meaningful paragraph from Wikipedia using MediaWiki REST API.
 * Supports multiple languages by changing the subdomain (e.g., 'vi', 'en').
 */

export interface WikiSummary {
  title: string;
  extract: string;
  description?: string;
  content_urls?: {
    desktop: {
      page: string;
    };
  };
}

export async function fetchWikiText(lang: string = 'vi'): Promise<string> {
  try {
    const response = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/random/summary`,
      {
        next: { revalidate: 0 }, // Ensure we get a fresh random page
      }
    );

    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.statusText}`);
    }

    const data: WikiSummary = await response.json();
    
    // Clean the text:
    // 1. Remove parenthetical content like (IPA: /.../) or (born 19xx)
    // 2. Remove extra spaces
    let cleanText = data.extract
      .replace(/\s*\([^)]*\)/g, '') // Remove (text in parentheses)
      .replace(/\s*\[[^\]]*\]/g, '') // Remove [citations]
      .replace(/\s+/g, ' ')         // Normalize spaces
      .trim();

    // If the text is too short or failed to clean properly, try again
    if (cleanText.length < 50) {
      return fetchWikiText(lang);
    }

    return cleanText;
  } catch (error) {
    console.error('Failed to fetch Wiki text:', error);
    return "Lỗi khi tải văn bản từ Wikipedia. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.";
  }
}
