export type KanbanColumn = 'gotowce_rtw' | 'pl_azja' | 'plan_b' | 'azja_pl' | 'azja_usa_oceania' | 'usa_pl' | 'misc'

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
const FORUM_NOISE_PREFIXES = [
  'Re:', 'Szukam taniego lotu', 'Szukam lotu',
  'WTT:', 'Sprzedam:', 'SOLD:', 'Kupię bilet', 'Kupię lot',
]

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
  // Building blocks — składaka / open jaw
  'open jaw', 'open-jaw', 'openjaw',
  'multi-city', 'multicity',
  'składana', 'składaka',
  'one way onward', // onward ticket RTW
]

// Destynacje — osobne segmenty też interesują (Azja, USA, Oceania)
const DESTINATION_KEYWORDS = [
  // Azja — PL i EN nazwy
  'Azja', 'Asia',
  'Tokio', 'Tokyo', 'Osaka', 'Kioto', 'Kyoto',
  'Singapur', 'Singapore',
  'Bangkok', 'Phuket',
  'Seul', 'Seoul', 'Korea',
  'Bali', 'Denpasar',
  'Hongkong', 'Hong Kong',
  'Japonia', 'Japan',
  'Tajlandia', 'Thailand',
  'Wietnam', 'Vietnam',
  'Filipiny', 'Philippines',
  'Kuala Lumpur',
  'Malediwy', 'Maldives',
  'Indonezja', 'Indonesia',
  // Oceania
  'Oceania', 'Australia', 'Nowa Zelandia', 'New Zealand', 'Sydney', 'Melbourne',
  // USA / Hawaii
  'USA', 'Hawaje', 'Hawaii', 'Los Angeles', 'San Francisco',
  'Honolulu', 'Nowy Jork', 'New York',
  // Americas
  'Meksyk', 'Mexico', 'Cancun',
  // RTW hub airports — linie z dobrymi segmentami
  'Istanbul', 'Doha', 'Dubai',
  // Airlines z RTW segmentami
  'Singapore Airlines', 'Turkish Airlines', 'Finnair', 'Qatar Airways',
  'Emirates', 'Etihad', 'Cathay Pacific', 'Japan Airlines',
  // Error fares — zawsze warte uwagi
  'error fare', 'błąd cenowy', 'mistake fare',
]

const ALL_MUST_KEYWORDS = [...RTW_KEYWORDS, ...DESTINATION_KEYWORDS]

// ─── Departure tag ───────────────────────────────────────────────────────────
// WAŻNE: kolejność ma znaczenie — pierwszy pasujący wzorzec wygrywa.
// Lotniska PL i dozwolone sąsiednie muszą być NA GÓRZE listy,
// żeby "Warsaw to New York" dostawał tag WAW, nie JFK.
const DEPARTURE_PATTERNS: Array<{ tag: string; keywords: string[] }> = [
  // ── Polska ──────────────────────────────────────────────────────────────────
  { tag: 'WAW', keywords: ['Warszawa', 'Warsaw', 'WAW', 'Chopin', 'Modlin'] },
  { tag: 'KRK', keywords: ['Kraków', 'Krakow', 'KRK'] },
  { tag: 'WRO', keywords: ['Wrocław', 'Wroclaw', 'WRO'] },
  { tag: 'GDN', keywords: ['Gdańsk', 'Gdansk', 'GDN', 'Trójmiasto'] },
  { tag: 'KTW', keywords: ['Katowice', 'KTW'] },
  { tag: 'POZ', keywords: ['Poznań', 'Poznan', 'POZ'] },
  { tag: 'LUZ', keywords: ['Lublin', 'LUZ'] },
  // ── Dozwolone sąsiednie ─────────────────────────────────────────────────────
  { tag: 'PRG', keywords: ['Prague', 'Praha', 'Praga', 'PRG'] },
  { tag: 'VIE', keywords: ['Vienna', 'Wien', 'Wiedeń', 'VIE'] },
  { tag: 'BUD', keywords: ['Budapest', 'Budapeszt', 'BUD'] },
  { tag: 'LHR', keywords: ['London', 'Londyn', 'LHR', 'Gatwick', 'LGW', 'Stansted', 'STN', 'Heathrow'] },
  { tag: 'FRA', keywords: ['Frankfurt', 'FRA'] },
  // ── Reszta Europy (odrzucane) ────────────────────────────────────────────────
  { tag: 'BER', keywords: ['Berlin', 'BER', 'Brandenburg'] },
  { tag: 'AMS', keywords: ['Amsterdam', 'AMS', 'Schiphol'] },
  { tag: 'CDG', keywords: ['Paris', 'Paryż', 'CDG', 'Orly'] },
  { tag: 'FCO', keywords: ['Rome', 'Rzym', 'FCO', 'Milan', 'Mediolan', 'MXP'] },
  { tag: 'MAD', keywords: ['Madrid', 'Madryt', 'MAD', 'Barcelona', 'BCN'] },
  { tag: 'LCA', keywords: ['Larnaka', 'Larnaca', 'Cypr', 'Cyprus'] },
  { tag: 'IST', keywords: ['Istanbul', 'IST', 'Stambuł'] },
  { tag: 'DXB', keywords: ['Dubai', 'DXB'] },
  { tag: 'DOH', keywords: ['Doha', 'DOH'] },
  { tag: 'HEL', keywords: ['Helsinki', 'HEL'] },
  { tag: 'ARN', keywords: ['Stockholm', 'ARN'] },
  { tag: 'OSL', keywords: ['Oslo', 'OSL'] },
  { tag: 'CPH', keywords: ['Copenhagen', 'Kopenhaga', 'CPH'] },
  { tag: 'RIX', keywords: ['Riga', 'Ryga', 'RIX'] },
  { tag: 'TLL', keywords: ['Tallinn', 'Tallin', 'TLL'] },
  { tag: 'VNO', keywords: ['Vilnius', 'Wilno', 'VNO'] },
  { tag: 'MUC', keywords: ['Munich', 'Monachium', 'MUC'] },
  { tag: 'ZRH', keywords: ['Zurich', 'Zurych', 'ZRH'] },
  { tag: 'MXP', keywords: ['Milan', 'Mediolan'] },
  // ── USA ─────────────────────────────────────────────────────────────────────
  { tag: 'JFK', keywords: ['New York', 'Nowy Jork', 'JFK', 'Newark', 'EWR', 'LaGuardia', 'LGA'] },
  { tag: 'LAX', keywords: ['Los Angeles', 'LAX'] },
  { tag: 'SFO', keywords: ['San Francisco', 'SFO'] },
  { tag: 'MIA', keywords: ['Miami', 'MIA'] },
  { tag: 'ORD', keywords: ['Chicago', 'ORD'] },
  { tag: 'BOS', keywords: ['Boston', 'BOS'] },
  { tag: 'ATL', keywords: ['Atlanta', 'ATL'] },
  { tag: 'SEA', keywords: ['Seattle', 'SEA'] },
  { tag: 'DFW', keywords: ['Dallas', 'DFW'] },
  { tag: 'DEN', keywords: ['Denver', 'DEN'] },
  { tag: 'IAD', keywords: ['Washington', 'IAD', 'Dulles'] },
  { tag: 'PHX', keywords: ['Phoenix', 'PHX'] },
  { tag: 'LAS', keywords: ['Las Vegas', 'LAS'] },
  { tag: 'HNL', keywords: ['Honolulu', 'HNL'] },
]

// ─── Allowlist wylotów ────────────────────────────────────────────────────────
// Tylko te tagi (i null = nieznany wylot) przechodzą przez filtr.
const ALLOWED_DEPARTURE_TAGS = new Set([
  // Polska
  'WAW', 'KRK', 'WRO', 'GDN', 'KTW', 'POZ', 'LUZ',
  // Dozwolone sąsiednie
  'PRG', 'VIE', 'BUD', 'LHR', 'FRA',
  // Fallback dla źródeł PL (gdy tytuł nie wymienia miasta wylotu)
  'PL',
])

// ─── Content blocklist ───────────────────────────────────────────────────────
// Tytuły zawierające te frazy są zawsze odrzucane (false positives z ogólnych keywordów)
const CONTENT_BLOCKLIST = [
  'North Korea', 'North Korean',
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

// Plan B — konkretne destynacje, maj/czerwiec, oba kierunki + składaka
const PLAN_B_DESTINATIONS = [
  'Seul', 'Seoul', 'Korea', 'ICN',
  'Japonia', 'Japan', 'Tokio', 'Tokyo', 'Osaka', 'Kioto', 'Kyoto', 'NRT', 'HND', 'KIX',
  'Tajlandia', 'Thailand', 'Bangkok', 'BKK', 'Phuket', 'HKT',
  'Bali', 'Denpasar', 'DPS',
  'Azja', 'Azji', 'Asia', // ogólne — dla "składaka przez Azję"
]

const PLAN_B_DATE_INDICATORS = [
  'maj', 'majow', 'May', 'czerwiec', 'czerwcow', 'June',
  '05.', '/05', '05/', '-05-', '.05.',
  '06.', '/06', '06/', '-06-', '.06.',
]

// Azja → PL — powroty z Azji, niezależnie od terminu
const AZJA_PL_KEYWORDS = [
  // PL dopełniacz — "z Bangkoku", "z Tokio" itd.
  'z Bangkoku', 'z Tokio', 'z Seulu', 'z Bali', 'z Singapuru', 'z Osaki',
  'z Japonii', 'z Tajlandii', 'z Korei', 'z Azji', 'z Indonezji', 'z Phuket',
  // EN directional
  'from Bangkok', 'from Tokyo', 'from Seoul', 'from Bali', 'from Singapore',
  'from Osaka', 'from Japan', 'from Asia', 'from Thailand',
  // Zwroty powrotne
  'powrót z Azji', 'powrót z Japonii', 'powrót z Tajlandii',
  'return from Asia', 'return from Bangkok', 'return from Tokyo',
  // IATA arrow notation (jak w tytułach sekretflying)
  'BKK-WAW', 'NRT-WAW', 'HND-WAW', 'ICN-WAW', 'SIN-WAW',
]

const PL_AZJA_KEYWORDS = [
  'Azja', 'Asia', 'Tokio', 'Tokyo', 'Singapur', 'Singapore', 'Bangkok',
  'Seul', 'Seoul', 'Bali', 'Hongkong', 'Hong Kong',
  'Japonia', 'Japan', 'Tajlandia', 'Thailand', 'Wietnam', 'Vietnam',
  'Osaka', 'Kioto', 'Kyoto', 'Phuket', 'Kuala Lumpur',
]

const AZJA_USA_OCEANIA_KEYWORDS = [
  'Oceania', 'Australia', 'Sydney', 'Melbourne', 'Nowa Zelandia', 'New Zealand',
  'USA', 'Hawaje', 'Hawaii', 'Honolulu',
]

const USA_PL_RETURN = ['powrót', 'return', 'z USA', 'from US', 'z Nowego Jorku', 'from New York']
const USA_PL_DEST   = ['USA', 'Nowy Jork', 'New York', 'Los Angeles', 'San Francisco']

function matchesKeyword(text: string, keyword: string): boolean {
  const kw = keyword.toLowerCase()
  // Krótkie słowa (≤5 znaków) wymagają word-boundary, żeby uniknąć false positives:
  // "Bali" nie powinno matchować "globalist", "KL" nie powinno matchować "weekly"
  if (kw.length <= 5) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text)
  }
  return text.toLowerCase().includes(kw)
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some(kw => matchesKeyword(text, kw))
}

function isPlanBDeal(title: string): boolean {
  return matchesAny(title, PLAN_B_DESTINATIONS) && matchesAny(title, PLAN_B_DATE_INDICATORS)
}

function assignKanban(title: string): KanbanColumn {
  if (matchesAny(title, RTW_KEYWORDS)) return 'gotowce_rtw'
  if (isPlanBDeal(title)) return 'plan_b'          // maj/czerwiec, oba kierunki
  if (matchesAny(title, AZJA_PL_KEYWORDS)) return 'azja_pl'  // powrót z Azji (rok cały)
  if (matchesAny(title, PL_AZJA_KEYWORDS)) return 'pl_azja'
  if (matchesAny(title, USA_PL_DEST) && matchesAny(title, USA_PL_RETURN)) return 'usa_pl'
  if (matchesAny(title, AZJA_USA_OCEANIA_KEYWORDS)) return 'azja_usa_oceania'
  return 'misc'
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function filterItem(item: RawItem): FilteredDeal | null {
  if (isForumNoise(item.title)) return null
  if (CONTENT_BLOCKLIST.some(b => item.title.toLowerCase().includes(b.toLowerCase()))) return null
  if (!matchesAny(item.title, ALL_MUST_KEYWORDS)) return null

  const departure = detectDepartureTag(item.title, item.origin)

  // Odrzuć deal jeśli wykryliśmy konkretny wylot spoza allowlisty.
  // null = nie udało się wykryć wylotu → przepuszczamy (ostrożne podejście).
  if (departure !== null && !ALLOWED_DEPARTURE_TAGS.has(departure)) return null

  const kanban = assignKanban(item.title)

  return {
    title: item.title,
    source_url: item.link,
    origin: item.origin,
    published_at: item.pubDate ?? null,
    is_rtw_segment: matchesAny(item.title, RTW_KEYWORDS),
    kanban_column: kanban,
    departure_tag: departure,
  }
}
