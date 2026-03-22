import Parser from 'rss-parser'
import { RSS_FEEDS, FLY4FREE_FORUM_FALLBACK_IDS, type FeedConfig } from './feeds.js'
import { filterItem, type RawItem } from './filter.js'
import { upsertDeals } from './db.js'
import { sendTelegramAlert } from './telegram.js'

const parser = new Parser({
  timeout: 10_000,
  headers: {
    'User-Agent': 'RTW-Hunter/1.0 (flight deal aggregator)',
  },
})

async function fetchFeed(feed: FeedConfig): Promise<RawItem[]> {
  try {
    const result = await parser.parseURL(feed.url)
    return result.items.map(item => ({
      title: item.title ?? '',
      link: item.link ?? '',
      pubDate: item.pubDate ?? item.isoDate,
      origin: feed.origin,
    }))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (feed.optional) {
      console.log(`[${feed.name}] skipped (optional): ${msg}`)
    } else {
      console.error(`[${feed.name}] fetch error: ${msg}`)
    }
    return []
  }
}

async function fetchFly4freeForum(): Promise<RawItem[]> {
  // Try f=6 first (primary), then fallbacks
  const primaryFeed: FeedConfig = {
    name: 'Fly4free Forum',
    url: 'https://fly4free.pl/forum/feed.php?f=6',
    origin: 'fly4free-forum',
    optional: true,
  }

  const items = await fetchFeed(primaryFeed)
  if (items.length > 0) return items

  console.log('[Fly4free Forum] f=6 returned empty, trying fallback IDs...')
  for (const id of FLY4FREE_FORUM_FALLBACK_IDS) {
    const fallback: FeedConfig = {
      name: `Fly4free Forum f=${id}`,
      url: `https://fly4free.pl/forum/feed.php?f=${id}`,
      origin: 'fly4free-forum',
      optional: true,
    }
    const result = await fetchFeed(fallback)
    if (result.length > 0) {
      console.log(`[Fly4free Forum] found working ID: f=${id}`)
      return result
    }
  }

  return []
}

async function main() {
  console.log(`[${new Date().toISOString()}] RTW scan started`)

  // Fetch all feeds in parallel (forum has its own retry logic)
  const regularFeeds = RSS_FEEDS.filter(f => f.origin !== 'fly4free-forum')
  const [regularResults, forumItems] = await Promise.all([
    Promise.all(regularFeeds.map(fetchFeed)),
    fetchFly4freeForum(),
  ])

  const allItems: RawItem[] = [...regularResults.flat(), ...forumItems]
  console.log(`Fetched ${allItems.length} raw items total`)

  // Filter
  const deals = allItems
    .filter(item => item.title && item.link)
    .map(item => filterItem(item))
    .filter((d): d is NonNullable<typeof d> => d !== null)

  console.log(`Filtered to ${deals.length} matching deals`)

  if (deals.length === 0) {
    console.log('No deals matched — done')
    return
  }

  // Save to Supabase (upsert, returns only new rows)
  const newDeals = await upsertDeals(deals)
  console.log(`${newDeals.length} new deals saved to Supabase`)

  // Send Telegram alerts for new deals only
  for (const deal of newDeals) {
    await sendTelegramAlert(deal)
    console.log(`Alert sent: ${deal.title}`)
  }

  console.log(`[${new Date().toISOString()}] Scan complete`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
