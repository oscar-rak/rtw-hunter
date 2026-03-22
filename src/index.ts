import Parser from 'rss-parser'
import { RSS_FEEDS, FLY4FREE_FORUM_FALLBACK_IDS, type FeedConfig } from './feeds.js'
import { filterItem, type RawItem } from './filter.js'
import { upsertDeals } from './db.js'
import { sendTelegramAlert, sendHeartbeat } from './telegram.js'

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
  // Try all IDs in parallel, return first non-empty result
  const allIds = [6, ...FLY4FREE_FORUM_FALLBACK_IDS]
  const feeds = allIds.map(id => ({
    name: `Fly4free Forum f=${id}`,
    url: `https://fly4free.pl/forum/feed.php?f=${id}`,
    origin: 'fly4free-forum' as const,
    optional: true,
  }))

  const results = await Promise.all(feeds.map(f => fetchFeed(f)))
  for (let i = 0; i < results.length; i++) {
    if (results[i].length > 0) {
      console.log(`[Fly4free Forum] working ID: f=${allIds[i]}`)
      return results[i]
    }
  }

  console.log('[Fly4free Forum] no working feed found')
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

  const runNumber = parseInt(process.env.RUN_NUMBER ?? '0', 10)

  // Save to Supabase (upsert, returns only new rows)
  const newDeals = await upsertDeals(deals)
  console.log(`${newDeals.length} new deals saved to Supabase`)

  // Heartbeat co 4 runy (~2h) gdy brak nowych dealów
  if (newDeals.length === 0 && runNumber % 4 === 0) {
    await sendHeartbeat(allItems.length)
  }

  // Send Telegram alerts for new deals only
  for (const deal of newDeals) {
    await sendTelegramAlert(deal)
    console.log(`Alert sent: ${deal.title}`)
  }

  console.log(`[${new Date().toISOString()}] Scan complete`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
