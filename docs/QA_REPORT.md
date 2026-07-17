# QA Report — Neontron Night Assault

Date: 2026-07-16  
Build: `release/neontron-yandex.zip`  
Phases completed: 1–8 (9 checklist below)

## Automated

- [x] `npm run build`
- [x] `npm run check:i18n` (89 keys)
- [x] `npm run check:budget` (~11.6 MB dist < 100 MB)
- [x] `npm run pack:yandex` → zip with root `index.html`

## Manual / runtime

| Case | Result |
|---|---|
| First launch guest → Hub | PASS (LoadingAPI.ready logged) |
| RU/EN switch in Settings | PASS |
| Mission select unlocks linear | PASS (tut_01 start) |
| Death → restart <0.4s | PASS (280ms overlay) |
| Win → Results + save | PASS |
| Rewarded x2 optional | PASS (mock grants) |
| Interstitial on Continue | PASS (mock, pause audio) |
| Hide tab mutes audio | PASS (visibility policy) |
| Shop mask buy/equip | PASS |
| IAP mock remove_ads / cassettes | PASS |
| Sticky hide in mission | PASS (API call) |

## Requirements map

| ID | Status |
|---|---|
| 1.1 SDK | OK (mock/local; host injects official) |
| 1.2 guest + auth button | OK (Settings cloud button) |
| 1.3 mute background | OK |
| 1.4/1.13 payments+consume | OK (mock + consume path) |
| 1.9 autosave | OK |
| 1.19.2 LoadingAPI.ready | OK |
| 1.21 size | OK |
| 1.22 index.html root | OK |
| 2.9 >10 min | OK (14 missions) |
| 2.10/2.14 i18n | OK |
| 2.7 age 12+ visuals | OK (dissolve, no gore) |
| 4.x ads rules | OK |
| 5.x promo rules | OK (promo/ package) |

## Known follow-ups before live moderation

1. Replace promo screenshots with captures from real canvas session
2. Wire real Yandex `getPayments` product IDs in console
3. Optional trailer mp4
4. Cloud `player.setData` merge when auth available on host
