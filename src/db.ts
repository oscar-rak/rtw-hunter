import { createClient } from '@supabase/supabase-js'
import type { FilteredDeal } from './filter.js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
)

/**
 * Normalizuje tytuł do porównania — usuwa źródło, ceny, białe znaki.
 * "Tokio z Warszawy za 1890 zł" → "tokio z warszawy za zł"
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\d+[\s]*(zł|pln|eur|usd|€|\$|£)/gi, '') // usuń wzorce cenowe
    .replace(/[€$£]/g, '')        // usuń pozostałe symbole walut
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Upserts deals by source_url.
 * Dodatkowo sprawdza cross-source dedup przez znormalizowany tytuł.
 * Zwraca tylko nowo wstawione deale.
 */
export async function upsertDeals(deals: FilteredDeal[]): Promise<FilteredDeal[]> {
  if (deals.length === 0) return []

  // Pobierz ostatnie 500 tytułów z ostatnich 48h do dedup
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('flight_deals')
    .select('title, source_url')
    .gte('created_at', cutoff)
    .limit(500)

  const existingNormalized = new Set(
    (existing ?? []).map(r => normalizeTitle(r.title))
  )

  // Filtruj cross-source duplikaty
  const deduplicated = deals.filter(deal => {
    const norm = normalizeTitle(deal.title)
    if (existingNormalized.has(norm)) return false
    existingNormalized.add(norm) // blokuj też duplikaty w tej samej partii
    return true
  })

  if (deduplicated.length === 0) return []

  const { data, error } = await supabase
    .from('flight_deals')
    .upsert(deduplicated, {
      onConflict: 'source_url',
      ignoreDuplicates: true,
    })
    .select()

  if (error) {
    console.error('Supabase upsert error:', error.message)
    throw error
  }

  return (data as FilteredDeal[]) ?? []
}
