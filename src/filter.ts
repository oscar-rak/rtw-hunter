export type KanbanColumn = 'gotowce_rtw' | 'pl_azja' | 'plan_b' | 'azja_usa_oceania' | 'usa_pl' | 'misc'

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

// ─── Forum noise ─────────────────────────────────────────────────────────────
const FORUM_NOISE_PREFIXES = ['Re:', 'Szukam taniego lotu', 'Szukam lotu']

function isForumNoise(title: string): boolean {
  const trimmed = title.trim()
  return FORUM_NOISE_PREFIXES.some(p => trimmed.startsWith(p))
}

// ─── Step 1 — Hard filter ────────────────────────────────────────────────────
// Gotowe RTW — najwyższy priorytet
const RTW_KEYWORDS = [
  'RTW', 'round the world', 'around the world', 'dookoła świata',
  'lot dookoła', 'world tour', 'RTW ticket', 'round-the-world',
  'world trip', 'świat w cenie',
]

// Destynacje — osobne segmenty też interesują (Azja, USA, Oceania)
const DESTINATION_KEYWORDS = [
  // Azja
  'Azja', 'Tokio', 'Tokyo', 'Singapur', 'Singapore', 'Bangkok',
  'Seul', 'Seoul', 'Bali', 'Hongkong', 'Hong Kong', 'Japonia', 'Japan',
  'Tajlandia', 'Thailand', 'Wietnam', 'Vietnam', 'Filipiny', 'Philippines',
  'Phuket', 'Kuala Lumpur', 'KL', 'Malediwy', 'Maldives',
  'Indonezja', 'Indonesia', 'Osaka', 'Kioto', 'Kyoto',
  // Oceania
  'Oceania', 'Australia', 'Nowa Zelandia', 'New Zealand', 'Sydney', 'Melbourne',
  // USA / Hawaii
  'USA', 'Hawaje', 'Hawaii', 'Los Angeles', 'San Francisco',
  'Honolulu', 'Nowy Jork', 'New York',
  // Americas
  'Meksyk', 'Mexico', 'Cancun',
  // Airlines z RTW segmentami
  'Singapore Airlines', 'Turkish Airlines', 'Finnair', 'Qatar Airways',
  // Error fares — zawsze warte uwagi
  'error fare', 'błąd cenowy', 'mistake fare',
]

const ALL_MUST_KEYWORDS = [...RTW_KEYWORDS, ...DESTINATION_KEYWORDS]

// ─── Departure tag ───────────────────────────────────────────────────────────
const DEPARTURE_PATTERNS: Array<{ tag: string; keywords: string[] }> = [
  { tag: 'WAW', keywords: ['Warszawa', 'Warsaw', 'WAW', 'Chopin', 'Modlin'] },
  { tag: 'KRK', keywords: ['Kraków', 'Krakow', 'KRK'] },
  { tag: 'WRO', keywords: ['Wrocław', 'Wroclaw', 'WRO'] },
  { tag: 'GDN', keywords: ['Gdańsk', 'Gdansk', 'GDN'] },
  { tag: 'KTW', keywords: ['Katowice', 'KTW'] },
  { tag: 'BER', keywords: ['Berlin', 'BER', 'Brandenburg'] },
  { tag: 'PRG', keywords: ['Prague', 'Praha', 'Praga', 'PRG'] },
  { tag: 'VIE', keywords: ['Vienna', 'Wien', 'Wiedeń', 'VIE'] },
  { tag: 'BUD', keywords: ['Budapest', 'Budapeszt', 'BUD'] },
  { tag: 'FRA', keywords: ['Frankfurt', 'FRA'] },
  { tag: 'AMS', keywords: ['Amsterdam', 'AMS', 'Schiphol'] },
  { tag: 'CDG', keywords: ['Paris', 'Paryż', 'CDG', 'Orly'] },
  { tag: 'FCO', keywords: ['Rome', 'Rzym', 'FCO', 'Milan', 'Mediolan', 'MXP'] },
  { tag: 'MAD', keywords: ['Madrid', 'Madryt', 'MAD', 'Barcelona', 'BCN'] },
  { tag: 'LHR', keywords: ['London', 'Londyn', 'LHR', 'Gatwick', 'LGW', 'Stansted', 'STN'] },
  { tag: 'LCA', keywords: ['Larnaka', 'Larnaca', 'Cypr', 'Cyprus'] },
]

const PL_ORIGIN_SOURCES = ['fly4free', 'fly4free-forum', 'travelfree']

function detectDepartureTag(title: string, origin: string): string | null {
  for (const { tag, keywords } of DEPARTURE_PATTERNS) {
    if (keywords.some(kw => title.includes(kw))) return tag
  }
  if (PL_ORIGIN_SOURCES.includes(origin)) return 'PL'
  return null
}

// ─── Kanban assignment ───────────────────────────────────────────────────────
const PLAN_B_DESTINATIONS = [
  'Seul', 'Seoul', 'Korea', 'ICN',
  'Japonia', 'Japan', 'Tokio', 'Tokyo', 'Osaka', 'Kioto', 'Kyoto', 'NRT', 'HND', 'KIX',
  'Tajlandia', 'Thailand', 'Bangkok', 'BKK', 'Phuket', 'HKT',
  'Bali', 'Denpasar', 'DPS',
]

const PLAN_B_DATE_INDICATORS = [
  'maj', 'majow', 'May', 'czerwiec', 'czerwcow', 'June',
  '05.', '/05', '05/', '-05-', '.05.',
  '06.', '/06', '06/', '-06-', '.06.',
]

const PL_AZJA_KEYWORDS = [
  'Azja', 'Tokio', 'Tokyo', 'Singapur', 'Singapore', 'Bangkok',
  'Seul', 'Seoul', 'Bali', 'Hongkong', 'Hong Kong',
  'Japonia', 'Japan', 'Tajlandia', 'Thailand', 'Wietnam', 'Vietnam',
]

const AZJA_USA_OCEANIA_KEYWORDS = [
  'Oceania', 'Australia', 'Sydney', 'Melbourne', 'Nowa Zelandia', 'New Zealand',
  'USA', 'Hawaje', 'Hawaii', 'Honolulu',
]

const USA_PL_RETURN = ['powrót', 'return', 'z USA', 'from US', 'z Nowego Jorku', 'from New York']
const USA_PL_DEST   = ['USA', 'Nowy Jork', 'New York', 'Los Angeles', 'San Francisco']

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw.toLowerCase()))
}

function isPlanBDeal(title: string): boolean {
  return matchesAny(title, PLAN_B_DESTINATIONS) && matchesAny(title, PLAN_B_DATE_INDICATORS)
}

function assignKanban(title: string): KanbanColumn {
  // RTW gotowce — absolutny priorytet
  if (matchesAny(title, RTW_KEYWORDS)) return 'gotowce_rtw'
  if (isPlanBDeal(title)) return 'plan_b'
  if (matchesAny(title, PL_AZJA_KEYWORDS)) return 'pl_azja'
  if (matchesAny(title, USA_PL_DEST) && matchesAny(title, USA_PL_RETURN)) return 'usa_pl'
  if (matchesAny(title, AZJA_USA_OCEANIA_KEYWORDS)) return 'azja_usa_oceania'
  return 'misc'
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function filterItem(item: RawItem): FilteredDeal | null {
  if (isForumNoise(item.title)) return null
  if (!matchesAny(item.title, ALL_MUST_KEYWORDS)) return null

  const kanban = assignKanban(item.title)

  return {
    title: item.title,
    source_url: item.link,
    origin: item.origin,
    published_at: item.pubDate ?? null,
    is_rtw_segment: matchesAny(item.title, RTW_KEYWORDS),
    kanban_column: kanban,
    departure_tag: detectDepartureTag(item.title, item.origin),
  }
}
