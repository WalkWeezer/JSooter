export type Lang = 'ru' | 'en';

type Dict = Record<string, unknown>;

const dictionaries: Record<Lang, Dict> = {
  ru: {},
  en: {},
};

let currentLang: Lang = 'ru';
const listeners = new Set<(lang: Lang) => void>();

function flatten(obj: Dict, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value as Dict, path, out);
    } else {
      out[path] = String(value ?? '');
    }
  }
  return out;
}

let flatCache: Record<Lang, Record<string, string>> = {
  ru: {},
  en: {},
};

export async function loadI18n(langFromSdk: string): Promise<Lang> {
  const [ru, en] = await Promise.all([
    fetch('./i18n/ru.json').then((r) => r.json()),
    fetch('./i18n/en.json').then((r) => r.json()),
  ]);
  dictionaries.ru = ru;
  dictionaries.en = en;
  flatCache = {
    ru: flatten(ru),
    en: flatten(en),
  };

  let initial = normalizeLang(langFromSdk);
  try {
    const saved = localStorage.getItem('neontron.lang');
    if (saved === 'ru' || saved === 'en') initial = saved;
  } catch {
    // ignore
  }
  return setLang(initial);
}

export function normalizeLang(input: string): Lang {
  const code = (input || 'ru').toLowerCase().slice(0, 2);
  return code === 'en' ? 'en' : 'ru';
}

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): Lang {
  currentLang = lang;
  try {
    localStorage.setItem('neontron.lang', lang);
  } catch {
    // ignore
  }
  listeners.forEach((cb) => cb(lang));
  return currentLang;
}

export function onLangChange(cb: (lang: Lang) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const table = flatCache[currentLang] || {};
  const fallback = flatCache.en || {};
  let text = table[key] ?? fallback[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }
  return text;
}

export function getFlatKeys(lang: Lang): string[] {
  return Object.keys(flatCache[lang] || {}).sort();
}
