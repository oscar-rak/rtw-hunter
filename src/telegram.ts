import type { FilteredDeal } from './filter.js'

const COLUMN_LABELS: Record<string, string> = {
  pl_azja: 'PL → AZJA',
  azja_usa_oceania: 'AZJA → USA/OCEANIA',
  usa_pl: 'USA → PL',
  gotowce: 'GOTOWCE RTW',
  misc: 'MISC',
}

function formatTimeAgo(publishedAt: string | null): string {
  if (!publishedAt) return 'brak daty'
  const diff = Date.now() - new Date(publishedAt).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'przed chwilą'
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minuta' : 'minut'} temu`
  const hours = Math.floor(minutes / 60)
  return `${hours} ${hours === 1 ? 'godzina' : 'godzin'} temu`
}

function buildMessage(deal: FilteredDeal): string {
  const label = COLUMN_LABELS[deal.kanban_column] ?? deal.kanban_column.toUpperCase()
  const timeAgo = formatTimeAgo(deal.published_at)
  const sourceName = deal.origin.replace(/-/g, ' ').toUpperCase()

  return [
    `🚨 NOWY DEAL — ${label}`,
    deal.title,
    '',
    `📡 ${sourceName}`,
    `⏱ ${timeAgo}`,
    `🔗 ${deal.source_url}`,
  ].join('\n')
}

export async function sendTelegramAlert(deal: FilteredDeal): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn('Telegram credentials not set, skipping alert')
    return
  }

  const text = buildMessage(deal)
  const url = `https://api.telegram.org/bot${token}/sendMessage`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`Telegram error ${response.status}:`, body)
  }
}
