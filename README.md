# Neontron: Night Assault

Yandex Games top-down action. Design docs and LLM production plan live in `/docs`.

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL. Phase 1 uses a **mock Yandex SDK** outside the Yandex host.

- Tap **TAP TO START HUM** to start a quiet tone
- Hide the tab → audio mutes (requirement 1.3)
- In console: `__mockSdkEmit('game_api_pause')` / `__mockSdkEmit('game_api_resume')`

## Build

```bash
npm run build
```

Output: `dist/` (root `index.html`, latin paths only).

## Docs

- [GDD](docs/GDD-NEONTRON.md)
- [LLM production plan](docs/LLM_PRODUCTION_PLAN.md)
- [Store draft RU/EN](store/STORE_DRAFT.md)
