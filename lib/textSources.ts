import { Lang, Mode } from './constants';
import { fetchWikiPage, WikiPageData } from '@/utils/fetchWikiText';
import { QUOTES } from './quotes';
import { WORDS } from './words';

export async function getTextSource(mode: Mode, lang: Lang): Promise<WikiPageData> {
  if (mode === 'wikipedia') {
    return await fetchWikiPage(lang);
  }

  if (mode === 'quotes') {
    const list = QUOTES[lang] || QUOTES['en'];
    const text = list[Math.floor(Math.random() * list.length)];
    return {
      title: 'Famous Quote',
      extract: text,
    };
  }

  if (mode === 'words') {
    const list = WORDS[lang] || WORDS['en'];
    // Pick 30-40 random words and join them
    const count = 30 + Math.floor(Math.random() * 10);
    const selected = [];
    for (let i = 0; i < count; i++) {
      selected.push(list[Math.floor(Math.random() * list.length)]);
    }
    return {
      title: 'Random Words',
      extract: selected.join(' '),
    };
  }

  throw new Error(`Unsupported mode: ${mode}`);
}
