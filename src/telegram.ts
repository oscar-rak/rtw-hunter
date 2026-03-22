import type { FilteredDeal } from './filter.js'

const COLUMN_LABELS: Record<string, string> = {
  gotowce_rtw: 'GOTOWCE RTW',
  plan_b: '🎯 PLAN B — MAJ/CZE',
  pl_azja: 'PL → AZJA',
  azja_usa_oceania: 'AZJA → USA/OCEANIA',
  usa_pl: 'USA → PL',
  misc: 'MISC',
}

function extractPrice(title: string): string | null {
  const m = title.match(/(\d[\d\s]{1,6})\s*(zł|PLN|EUR|USD|€)/i)
  return m ? `${m[1].trim()} ${m[2]}` : null
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
  const price = extractPrice(deal.title)
  const depTag = deal.departure_tag

  const meta = [
    price ? `💰 ${price}` : null,
    depTag ? `✈️ ${depTag}` : null,
  ].filter(Boolean).join('  |  ')

  return [
    `🚨 NOWY DEAL — ${label}`,
    deal.title,
    '',
    meta || null,
    `📡 ${sourceName}`,
    `⏱ ${timeAgo}`,
    `🔗 ${deal.source_url}`,
  ].filter(line => line !== null).join('\n')
}

async function sendMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  })
  if (!response.ok) {
    console.error(`Telegram error ${response.status}:`, await response.text())
  }
}

export async function sendHeartbeat(itemsScanned: number): Promise<void> {
  const now = new Date().toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' })
  await sendMessage(`🟢 RTW Hunter działa — ${now}\nPrzeskanowano ${itemsScanned} ofert, brak nowych dealów.`)
}

export async function sendTelegramAlert(deal: FilteredDeal): Promise<void> {
  await sendMessage(buildMessage(deal))
}
