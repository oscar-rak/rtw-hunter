# RTW Hunter — TODO

## Priorytet 1 (następna sesja)

### Fix jakości filtra
- [ ] Odrzucaj posty forum zaczynające się od "Re:" i "Szukam taniego lotu"
- [ ] Dodaj kolumnę `departure_tag` do Supabase (WAW, KRK, WRO, BER, PRG, VIE, BUD, IST, DOH, SIN)
- [ ] Dedup cross-source — ten sam deal na kilku portalach = 1 alert

### Segmenty RTW
- [ ] Dodaj słowa klucze: "one way", "w jedną stronę", "jednostronne", "open jaw", "multi-city"
- [ ] Nowa kolumna kanban: `segment` — dla odcinków do sklejania trasy
- [ ] Dodaj słowa klucze stopover airlines: "Singapore Airlines", "Finnair", "Turkish Airlines", "Qatar", "Icelandair"
- [ ] Lotniska przesiadkowe jako soft keywords: IST, DOH, SIN, HKG, NRT

### Nowe źródła RSS
- [ ] theflightdeal.com — segmenty transoceaniczne
- [ ] secretflying.com/posts/category/departure/depart-usa — powroty z USA do EU

## Priorytet 2 (Phase 2)
- [ ] Cheerio scraper dla pelikan.pl
- [ ] Relevance score w UI (Lovable)
- [ ] Deduplikacja przez similarity matching (nie tylko exact URL)
