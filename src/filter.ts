export type KanbanColumn = 'pl_azja' | 'azja_usa_oceania' | 'usa_pl' | 'gotowce' | 'misc'

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
}

// Step 1 — must match at least one keyword (case-insensitive)
const MUST_KEYWORDS = [
  'RTW',
  'dookoła świata',
  'round the world',
  'error fare',
  'błąd cenowy',
  'Azja',
  'Tokio',
  'Tokyo',
  'Singapur',
  'Singapore',
  'Bangkok',
  'Seul',
  'Seoul',
  'Bali',
  'Hongkong',
  'Hong Kong',
  'Oceania',
  'Australia',
  'Nowa Zelandia',
  'New Zealand',
  'Sydney',
  'Melbourne',
  'USA',
  'Hawaje',
  'Hawaii',
  'Los Angeles',
  'San Francisco',
  'Honolulu',
  'Nowy Jork',
  'New York',
]

// Step 2 — EU departure airports (soft, raises score for non-PL sources)
const EU_AIRPORTS = ['BER', 'FRA', 'VIE', 'AMS', 'CDG', 'MUC', 'ZRH']

// Step 3 — date keywords for May-June 2026 (soft, doesn't block)
const DATE_KEYWORDS = ['Maj', 'Czerwiec', 'May', 'June', '2026']

// Kanban assignment patterns (checked in order)
const GOTOWCE_KEYWORDS = ['RTW', 'dookoła świata', 'round the world']

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
  if (matchesAny(title, PL_AZJA_KEYWORDS)) return 'pl_azja'

  // usa_pl: USA keywords + return signal
  if (
    matchesAny(title, USA_PL_DEST_KEYWORDS) &&
    matchesAny(title, USA_PL_RETURN_KEYWORDS)
  ) {
    return 'usa_pl'
  }

  if (matchesAny(title, AZJA_USA_OCEANIA_KEYWORDS)) return 'azja_usa_oceania'

  return 'misc'
}

export function filterItem(item: RawItem): FilteredDeal | null {
  const text = item.title

  // Step 1 — hard filter
  if (!matchesAny(text, MUST_KEYWORDS)) return null

  const kanban = assignKanban(text)
  const isRtw = matchesAny(text, GOTOWCE_KEYWORDS)

  return {
    title: item.title,
    source_url: item.link,
    origin: item.origin,
    published_at: item.pubDate ?? null,
    is_rtw_segment: isRtw,
    kanban_column: kanban,
  }
}
