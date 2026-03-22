import { createClient } from '@supabase/supabase-js'
import type { FilteredDeal } from './filter.js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
)

/**
 * Upserts deals by source_url (unique constraint).
 * Returns only the deals that were newly inserted (not already in DB).
 */
export async function upsertDeals(deals: FilteredDeal[]): Promise<FilteredDeal[]> {
  if (deals.length === 0) return []

  const { data, error } = await supabase
    .from('flight_deals')
    .upsert(deals, {
      onConflict: 'source_url',
      ignoreDuplicates: true,
    })
    .select()

  if (error) {
    console.error('Supabase upsert error:', error.message)
    throw error
  }

  // data contains only newly inserted rows (ignoreDuplicates: true)
  return (data as FilteredDeal[]) ?? []
}
