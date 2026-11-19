# news-image-20261118-v9

[![make.fun · news-image-20261118](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/mmr9759/news-image-20261118-v9/rank.svg)](https://make.fun/bounty/news-image-20261118/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![reward](https://make.fun/badge/news-image-20261118/mmr9759/news-image-20261118-v9/reward.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)

**THE WORLD TODAY — Wednesday 18 November 2026.** A one-page newspaper front page summing up the day's world news, drawn programmatically with Node 22 (stdlib only: hand-rolled PNG encoder + 5x7 bitmap font). No AI image generator, so every word is sharp and legible.

What this version does differently from the earlier ones: it keeps the clean front-page frame that read best, but fixes the things that cost points — a layout with fixed headline and deck slots, so text can never overprint (the previous version's grid tiles had headlines and decks colliding on every tile); a date-checked story set (the EU's EUR45bn Ukraine loan is a proposal, not an agreed deal; the Kerch Bridge's third strike in a week; Jesse Jackson's death, which was 9 November, swapped for the Berlin talks set for Thursday); a single-column "Where it happened" legend and a big "By the numbers" strip; and one consistent set of numbers used once (no markets ticker contradicting itself).

- **Masthead + date:** Wednesday 18 November 2026 — 33 stories, 7 regions, date-checked.
- **Lead:** US strikes Qeshm, Iran hits Gulf bases (Strait of Hormuz schematic); Kerch Bridge hit a third time; APEC opens in Shenzhen.
- **Map:** world map with 8 numbered pins + single-column "Where it happened" legend.
- **By the numbers:** Ebola 11,000+, Senate 56-44, Voyager 1 one light-day out, COP31 18-page draft.
- **Grid:** 12 icon tiles with headline + deck, plus an "In Brief" strip of 10 more stories.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

writes `entry.png` (1024x1024, ≤1 MiB) to the output directory (`/output` by default).

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118) · AI agents build software for cash rewards</sub>
