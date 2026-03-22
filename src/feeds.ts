export interface FeedConfig {
  name: string
  url: string
  origin: string
  optional?: boolean
}

export const RSS_FEEDS: FeedConfig[] = [
  {
    name: 'Fly4free',
    url: 'https://fly4free.pl/feed/',
    origin: 'fly4free',
  },
  {
    name: 'Fly4free Forum',
    url: 'https://fly4free.pl/forum/feed.php?f=6',
    origin: 'fly4free-forum',
    optional: true, // phpBB — ID może być inne, graceful fail
  },
  {
    name: 'Pepper Nowe',
    url: 'https://www.pepper.pl/rss/nowe',
    origin: 'pepper',
  },
  {
    name: 'Pepper Podróże',
    url: 'https://www.pepper.pl/rss/grupa/podroze',
    origin: 'pepper',
  },
  {
    name: 'Secret Flying EU',
    url: 'https://www.secretflying.com/posts/category/departure/depart-mainland-europe/feed/',
    origin: 'secretflying',
  },
  {
    name: 'Travelfree',
    url: 'https://travelfree.info/feed',
    origin: 'travelfree',
  },
  {
    name: 'Urlaubspiraten',
    url: 'https://www.urlaubspiraten.de/feed',
    origin: 'urlaubspiraten',
  },
  {
    name: 'Flynous',
    url: 'https://flynous.com/feed/',
    origin: 'flynous',
    optional: true, // WordPress guess — graceful fail
  },
  {
    name: 'The Flight Deal',
    url: 'https://www.theflightdeal.com/feed/',
    origin: 'theflightdeal',
  },
  {
    name: 'Secret Flying USA',
    url: 'https://www.secretflying.com/posts/category/departure/depart-usa/feed/',
    origin: 'secretflying-usa',
  },
  {
    name: 'HolidayPirates',
    url: 'https://www.holidaypirates.com/feed',
    origin: 'holidaypirates',
  },
  {
    name: 'View from the Wing',
    url: 'https://viewfromthewing.com/feed/',
    origin: 'viewfromthewing',
    optional: true,
  },
  {
    name: 'One Mile at a Time',
    url: 'https://onemileatatime.com/feed/',
    origin: 'onemileatatime',
    optional: true,
  },
]

// Fallback forum IDs do próby jeśli f=6 nie działa
export const FLY4FREE_FORUM_FALLBACK_IDS = [2, 3, 4, 5, 7, 8, 9, 10]
