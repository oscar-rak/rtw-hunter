export type KanbanColumn = 'pl_azja' | 'azja_usa_oceania' | 'usa_pl' | 'gotowce' | 'segment' | 'misc'

export interface RawItem {
  title: string
  link: string
  pubDate?: string
  origin: string
}

export interface FilteredDeal {
  title: string
  source_url: string
  origin: string
  published_at: string | null
  is_rtw_segment: boolean
  kanban_column: KanbanColumn
  departure_tag: string | null
}

// ─── Forum noise — odrzucaj te posty ────────────────────────────────────────
const FORUM_NOISE_PREFIXES = [
  'Re:',
  'Szukam taniego lotu',
  'Szukam lotu',
]

function isForumNoise(title: string): boolean {
  const trimmed = title.trim()
  return FORUM_NOISE_PREFIXES.some(prefix =>
    trimmed.startsWith(prefix)
  )
}

// ─── Step 1 — Hard filter keywords ──────────────────────────────────────────
const MUST_KEYWORDS = [
  // RTW / error fares
  'RTW', 'dookoła świata', 'round the world', 'error fare', 'błąd cenowy',
  // Azja
  'Azja', 'Tokio', 'Tokyo', 'Singapur', 'Singapore', 'Bangkok',
  'Seul', 'Seoul', 'Bali', 'Hongkong', 'Hong Kong',
  // Oceania
  'Oceania', 'Australia', 'Nowa Zelandia', 'New Zealand', 'Sydney', 'Melbourne',
  // USA
  'USA', 'Hawaje', 'Hawaii', 'Los Angeles', 'San Francisco',
  'Honolulu', 'Nowy Jork', 'New York',
  // One-way / open-jaw (segmenty)
  'one way', 'one-way', 'w jedną stronę', 'jednostronny', 'open jaw', 'multi-city',
  // Stopover airlines
  'Singapore Airlines', 'Finnair', 'Turkish Airlines', 'Qatar Airways',
  'Icelandair', 'Cathay Pacific',
  // Hub airports (przesiadki)
  'via Singapore', 'via Istanbul', 'via Doha', 'via Helsinki',
  'via Hong Kong', 'via Tokyo',
]

// ─── Departure airports detection ───────────────────────────────────────────
const DEPARTURE_PATTERNS: Array<{ tag: string; keywords: string[] }> = [
  { tag: 'WAW', keywords: ['Warszawa', 'Warsaw', 'WAW', 'Chopin', 'Modlin', 'WMI'] },
  { tag: 'KRK', keywords: ['Kraków', 'Krakow', 'Cracow', 'KRK'] },
  { tag: 'WRO', keywords: ['Wrocław', 'Wroclaw', 'WRO'] },
  { tag: 'GDN', keywords: ['Gdańsk', 'Gdansk', 'Trójmiasto', 'GDN'] },
  { tag: 'POZ', keywords: ['Poznań', 'Poznan', 'POZ'] },
  { tag: 'KTW', keywords: ['Katowice', 'Pyrzowice', 'KTW'] },
  { tag: 'BER', keywords: ['Berlin', 'BER', 'Brandenburg'] },
  { tag: 'PRG', keywords: ['Praga', 'Prague', 'Praha', 'PRG'] },
  { tag: 'VIE', keywords: ['Wiedeń', 'Vienna', 'Wien', 'VIE'] },
  { tag: 'BUD', keywords: ['Budapeszt', 'Budapest', 'BUD'] },
  { tag: 'FRA', keywords: ['Frankfurt', 'FRA'] },
  { tag: 'AMS', keywords: ['Amsterdam', 'AMS', 'Schiphol'] },
]

// Źródła gdzie wylot jest domyślnie z PL — nie musimy matchować explicite
const PL_ORIGIN_SOURCES = ['fly4free', 'fly4free-forum', 'travelfree']

function detectDepartureTag(title: string, origin: string): string | null {
  const text = title + ' ' + origin
  for (const { tag, keywords } of DEPARTURE_PATTERNS) {
    if (keywords.some(kw => text.includes(kw))) return tag
  }
  // Fly4free/travelfree = domyślnie Polska
  if (PL_ORIGIN_SOURCES.includes(origin)) return 'PL'
  return null
}

// ─── Kanban assignment ───────────────────────────────────────────────────────
const GOTOWCE_KEYWORDS = ['RTW', 'dookoła świata', 'round the world']

const SEGMENT_KEYWORDS = [
  'one way', 'one-way', 'w jedną stronę', 'jednostronny', 'open jaw', 'multi-city',
  'Singapore Airlines', 'Finnair', 'Turkish Airlines', 'Qatar Airways',
  'Icelandair', 'Cathay Pacific',
  'via Singapore', 'via Istanbul', 'via Doha', 'via Helsinki',
  'via Hong Kong', 'via Tokyo',
]

const PL_AZJA_KEYWORDS = [
  'Azja', 'Tokio', 'Tokyo', 'Singapur', 'Singapore',
  'Bangkok', 'Seul', 'Seoul', 'Bali', 'Hongkong', 'Hong Kong',
]

const AZJA_USA_OCEANIA_KEYWORDS = [
  'Oceania', 'Australia', 'Sydney', 'Melbourne', 'Nowa Zelandia', 'New Zealand',
  'USA', 'Hawaje', 'Hawaii', 'Honolulu',
]

const USA_PL_RETURN_KEYWORDS = ['powrót', 'return', 'z USA', 'from US', 'z Nowego Jorku', 'from New York']
const USA_PL_DEST_KEYWORDS = ['USA', 'Nowy Jork', 'New York', 'Los Angeles', 'San Francisco']

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw.toLowerCase()))
}

function assignKanban(title: string): KanbanColumn {
  if (matchesAny(title, GOTOWCE_KEYWORDS)) return 'gotowce'
  if (matchesAny(title, SEGMENT_KEYWORDS)) return 'segment'
  if (matchesAny(title, PL_AZJA_KEYWORDS)) return 'pl_azja'
  if (matchesAny(title, USA_PL_DEST_KEYWORDS) && matchesAny(title, USA_PL_RETURN_KEYWORDS)) return 'usa_pl'
  if (matchesAny(title, AZJA_USA_OCEANIA_KEYWORDS)) return 'azja_usa_oceania'
  return 'misc'
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function filterItem(item: RawItem): FilteredDeal | null {
  // Odrzuć forum noise
  if (isForumNoise(item.title)) return null

  // Hard filter — musi pasować przynajmniej 1 keyword
  if (!matchesAny(item.title, MUST_KEYWORDS)) return null

  return {
    title: item.title,
    source_url: item.link,
    origin: item.origin,
    published_at: item.pubDate ?? null,
    is_rtw_segment: matchesAny(item.title, GOTOWCE_KEYWORDS),
    kanban_column: assignKanban(item.title),
    departure_tag: detectDepartureTag(item.title, item.origin),
  }
}
