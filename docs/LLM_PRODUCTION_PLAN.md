# План производства для LLM: «Неонтрон: Ночной штурм»

**Цель плана:** агент (LLM) может выполнить его пошагово без креативных развилок и получить:
1. **Готовую игру** под Яндекс Игры (mobile + desktop)
2. **Полную локализацию RU + EN**
3. **Полный пакет промо** для черновика стора

**Канонические источники (не переизобретать):**
- [`GDD-NEONTRON.md`](./GDD-NEONTRON.md) — дизайн и монетизация
- [`visual-style/`](./visual-style/README.md) — арт-дирекция
- [`audio/`](./audio/README.md) — звуковые референсы
- [Требования Яндекс Игр](https://yandex.ru/dev/games/doc/ru/concepts/requirements)
- [Заполнение черновика](https://yandex.ru/dev/games/doc/ru/console/add-new-game/draft)

---

## 0. Правила работы LLM (обязательно читать перед кодом)

1. **Не менять название, сеттинг, палитру, возраст 12+, экономику** без явной команды человека.
2. **Один Phase за раз.** Не начинать Phase N+1, пока Phase N не закрыт чеклистом.
3. **Коммитить** после каждого Phase с сообщением `phase-N: ...`.
4. **Не использовать** Unity/Godot. Только веб-стек ниже.
5. **Не добавлять** TV, мультиплеер, редактор уровней, интерактивный ИИ, gore-режим.
6. **Все UI-строки** только через i18n-ключи. Запрещены хардкод-строки в компонентах.
7. **Файлы/папки:** только латиница, без пробелов (треб. 1.22).
8. **Архив unzipped < 100 МБ** (треб. 1.21). Следить за бюджетом ассетов.
9. Если решение неоднозначно — брать **более простой** вариант, совместимый с GDD.
10. Перед модерацией прогнать **Phase 9 checklist** целиком.

### Definition of Done (финал)

- [ ] Игра запускается из `dist/index.html` без ошибок
- [ ] SDK Яндекс: init + `LoadingAPI.ready` + gameplay start/stop + pause sound
- [ ] RU и EN: автоязык из SDK + ручной переключатель
- [ ] 12 миссий MVP + туториал проходимы на touch и desktop
- [ ] Ads: interstitial в паузах, RV опционален, sticky учтён
- [ ] IAP: remove ads + currency pack (или stub с consume, если нет реальных продуктов в консоли)
- [ ] Сейвы: local + cloud merge
- [ ] Промо-пакет в `promo/` готов к загрузке в консоль
- [ ] ZIP билда + `STORE_DRAFT.md` заполнены
- [ ] Самопроверка по чеклисту требований пройдена

---

## 1. Зафиксированный стек и структура репо

### Стек (не менять)

| Слой | Выбор |
|---|---|
| Runtime | TypeScript + Vite |
| Renderer | Phaser 3 (Arcade Physics) |
| UI overlay | HTML/CSS или Phaser UI — **выбрать Phaser DOM/UI единообразно** |
| Platform | `src/platform/yandex.ts` wrapper |
| i18n | JSON словари `public/i18n/ru.json`, `en.json` |
| Builds | `npm run build` → `dist/` → zip |

### Целевая структура

```
/
  docs/                    # уже есть (GDD, art, audio)
  promo/                   # стор-материалы (Phase 8)
  store/STORE_DRAFT.md     # тексты черновика RU/EN
  src/
    main.ts
    platform/yandex.ts
    i18n/index.ts
    save/SaveService.ts
    ads/AdsService.ts
    iap/PurchaseService.ts
    audio/AudioService.ts
    input/InputRouter.ts
    scenes/
      BootScene.ts
      PreloadScene.ts
      HubScene.ts
      BriefingScene.ts
      MissionScene.ts
      ResultsScene.ts
      ShopScene.ts
      SettingsScene.ts
    game/
      Player.ts
      Enemy.ts
      VisionCone.ts
      Weapons.ts
      MissionRuntime.ts
      Ranking.ts
    data/
      missions/*.json
      weapons.json
      masks.json
  public/
    i18n/ru.json
    i18n/en.json
    assets/...
  scripts/
    pack-yandex.mjs        # zip dist без мусора
    check-i18n.mjs         # ключи RU==EN
    check-budget.mjs       # размер <100MB
  package.json
  index.html
  README.md
```

---

## 2. Фазы производства

Каждая фаза = отдельный агентный прогон. В конце фазы — **Exit criteria**.

---

### Phase 1 — Skeleton + Yandex SDK shell

**Сделать:**
1. Vite + Phaser + TS проект
2. Сцены: Boot → Preload → Hub (заглушка)
3. `yandex.ts`:
   - `YaGames.init()`
   - locale from SDK (`i18n.lang`)
   - `LoadingAPI.ready()` когда Hub готов к клику
   - listeners `game_api_pause` / `game_api_resume`
   - mute on `visibilitychange` / blur
4. Dev mock SDK для локального запуска без консоли
5. Safe-area / sticky banner padding placeholder

**Exit criteria:**
- [x] `npm run dev` открывает хаб
- [x] Mock SDK логирует ready/pause/resume
- [x] Hidden tab глушит звук (даже если звук — silent beep)
- [x] Нет кириллицы в путях

**Статус Phase 1:** DONE (2026-07-16)

**Запрещено в Phase 1:** миссии, магазин, реклама боевая логика.

---

### Phase 2 — i18n RU/EN каркас

**Сделать:**
1. `ru.json` / `en.json` со всеми ключами UI скелета
2. `t(key)` + автоязык SDK
3. Кнопка смены языка в Settings (флаги/native names)
4. Скрипт `check-i18n.mjs`: множества ключей RU и EN идентичны

**Минимальные группы ключей:**
`common.*`, `hub.*`, `briefing.*`, `mission.*`, `results.*`, `shop.*`, `settings.*`, `tutorial.*`, `ads.*`, `iap.*`

**Exit criteria:**
- [x] Переключение RU↔EN меняет весь видимый текст хаба/настроек
- [x] `npm run check:i18n` = 0 missing keys
- [x] Нет захардкоженных пользовательских строк в `src/`

**Статус Phase 2:** DONE (2026-07-16)

---

### Phase 3 — Vertical Slice (1 миссия = «ещё разок»)

**Сделать ровно одну миссию `plat_03` по GDD §25:**
- top-down движение
- 1 игрок, 3–4 врага
- vision cones
- one-hit death
- restart < 0.4s (reset state, не reload страницы)
- подбор оружия
- выход = победа
- Results с рангом C–S (упрощённо)

**Input:**
- Desktop: WASD + mouse aim + LMB attack
- Mobile: twin-stick + attack button (схема A из GDD)

**Art (временно ок):**
- цветные placeholder-спрайты в палитре GDD; позже заменить атласом
- dissolve VFX как tint+particles (не кровь)

**Exit criteria:**
- [x] 5 внешних/внутренних прогонов: смерть → мгновенный рестарт работает
- [x] Победа открывает Results
- [x] Touch и desktop оба проходят миссию
- [x] Portrait playable one-hand (кнопки не перекрывают центр)

**Статус Phase 3:** DONE (2026-07-16) — миссия `plat_03`, twin-stick + WASD/mouse, ranks, dissolve VFX

---

### Phase 4 — Mission content pipeline (12 миссий + туториал)

**Сделать:**
1. JSON schema миссии:
```json
{
  "id": "plat_01",
  "chapter": 1,
  "objective": "clear|vip|extract|silent|timed",
  "playerSpawn": [x,y],
  "exit": [x,y],
  "tiles": "...",
  "enemies": [{"type":"patrol","x":0,"y":0,"route":[]}],
  "weapons": [],
  "briefingKey": "brief.plat_01",
  "sRankRules": {"maxDeaths":0,"maxTimeSec":45,"noAlarm":false}
}
```
2. Туториал 3 миссии (`tut_01..03`)
3. Глава 1: 8 миссий + 1 бонусная = **итого ≥12 playable**
4. Mission select в Hub
5. Автосейв прогресса после clear

**Exit criteria:**
- [x] Новый игрок проходит tut → mission 3 без тупика
- [x] Суммарный контент > 10 минут (треб. 2.9)
- [x] Нарастающая сложность: враги 1→4 архетипов
- [x] Все briefing/results строки в i18n

**Статус Phase 4:** DONE (2026-07-16) — 14 миссий (3 tut + 8 plat + 3 port), select, autosave

---

### Phase 5 — Meta: masks, currency, shop UI

**Сделать по GDD §4.7 / §8:**
- 3 личины с малыми перками
- soft currency **Impulses**, premium **Cassettes**
- Shop screen (UI + логика выдачи)
- Rank rewards wiring

**Exit criteria:**
- [ ] Личина выбирается до миссии и влияет слабо, но заметно
- [ ] Валюта сохраняется
- [ ] Сюжетные миссии **не** гейтятся донатом/RV

---

### Phase 6 — Ads + IAP (Yandex-compliant)

**AdsService:**
- Interstitial: только после Results → Continue / возврат в Hub
- Rewarded: кнопки с явным текстом награды (`ads.reward.x2`, etc.)
- Pause game+audio onOpen, resume onClose
- Sticky: hide in MissionScene if possible, show in Hub
- **Never** `setInterval` fullscreen ads

**PurchaseService:**
- Products: `remove_ads`, `cassettes_small` (ids совпасть с консолью позже)
- `purchase` + **consume** обязательно
- Guest progress ок; cloud after auth button

**Auth:**
- Гость играет сразу
- Кнопка «Сохранить в облаке» / “Save to cloud” с понятной причиной

**Exit criteria:**
- [ ] RV нигде не блокирует сюжет
- [ ] Interstitial только в логической паузе
- [ ] Consume вызывается
- [ ] Mock mode покрывает ads/iap локально

---

### Phase 7 — Polish, audio, accessibility, stability

**Сделать:**
1. Подключить `docs/audio/*.mp3` (hub/combat) + mute toggle
2. Death sting
3. Resize/orientation без деформаций
4. Disable browser scroll / context menu / longtap select
5. `GameplayAPI.start/stop` вокруг миссии
6. Error boundary + некрашащийся resume после ads
7. Performance: pool bullets/FX, 30–60 FPS target
8. Budget scripts

**Exit criteria:**
- [ ] Rotate mid-fight не ломает UI
- [ ] Tab hide → mute; return → resume policy корректна
- [ ] `npm run check:budget` < 100MB unzipped
- [ ] Нет console errors на happy path

---

### Phase 8 — Promo materials for Yandex Store page

Создать папку `promo/` со **всеми** файлами для черновика.

#### 8.1 Обязательные изображения

| Файл | Размер | Правила |
|---|---|---|
| `icon-512.png` | 512×512 | НЕ скриншот; бренд Неонтрон; без UI Яндекса; без рамок/скруглений |
| `cover-800x470.png` | 800×470 | НЕ скриншот; название совпадает с стором |
| `cover-wide-1560x520.png` | 1560×520 | витрина |
| `shot-desktop-01.png` … `04.png` | 1920×1080 (16:9) | реальный геймплей ≥70% кадра; ≥2 шт |
| `shot-mobile-01.png` … `04.png` | 1080×1920 (9:16) **или** 1920×1080 если mobile landscape | ≥2 шт; ориентация = заявленной |

**Как LLM делает скриншоты:**
1. Запустить билд
2. Снять кадры из реальных сцен (Hub/Mission/Results) через canvas export или headless screenshot
3. Если автосъёмка невозможна — сгенерировать **gameplay-accurate** промо-кадры строго в стиле visual-style и пометить в `promo/README.md`, что перед модерацией заменить на реальные скрины из билда
4. На скринах допустим лёгкий framing, но не фейковый геймплей другой игры

#### 8.2 Видео (сильно желательно)

| Файл | Спека |
|---|---|
| `trailer-landscape.mp4` | 16:9, height ≥400, ≤28s, ≤100MB, MP4 |
| `trailer-portrait.mp4` | 9:16, те же лимиты (если mobile portrait) |

Видео = реальный геймплей ≥70% хронометража. Без YouTube. Без внешних ссылок.

#### 8.3 GIF (опционально)

- 16:9, ≤600KB

#### 8.4 Тексты стора — файл `store/STORE_DRAFT.md`

Заполнить **и RU, и EN** строго по лимитам:

| Поле | Лимит | RU | EN |
|---|---|---|---|
| Название | ≤50, с заглавной, без FULL CAPS | `Неонтрон: Ночной штурм` | `Neontron: Night Assault` |
| Описание (short) | 50–160 | см. шаблон ниже | см. шаблон |
| Об игре | 100–1000 | шаблон | шаблон |
| Как играть | 100–1000 | шаблон | шаблон |
| Slogan | ≤70, не дублировать название | шаблон | шаблон |
| Ключевые слова | ≤100, lower-case, через запятую | шаблон | шаблон |

**Категории (макс 2):** `Боевики`, `Аркады`  
**Возраст:** `12+`  
**Платформы:** Mobile + Desktop  
**Ориентация:** Any (portrait primary mobile)  
**Языки игры:** `ru`, `en`  
**Облачные сохранения:** Да (если Player setData используется)

#### 8.5 Готовые шаблоны текстов (вставить в STORE_DRAFT.md)

**RU — Описание (short):**
```
Ночные штурмы этажей в неоне. Один удар — и путь сначала. Короткие миссии, мгновенный рестарт, охота за рангом S.
```

**RU — Об игре:**
```
Неонтрон: Ночной штурм — top-down экшен про короткие ночные рейды. Получай контракт на пейджер, заходи в здание и зачищай этаж. Враги видят конусами зрения, ошибка стоит жизни, а рестарт мгновенный. Прокладывай маршрут, подбирай оружие, открывай личины и бейся за идеальный ранг S. Стилизованный неон, быстрый ритм и миссии, которые хочется перепроходить снова и снова.
```

**RU — Как играть:**
```
На телефоне двигайся левым стиком, целись правым и атакуй кнопкой удара. Заходи врагам за спину, не попадай в конус зрения, подбирай оружие с пола. На компьютере — WASD и мышь. Умер — сразу начинай заново. Выполни цель миссии и доберись до точки выхода, чтобы получить ранг и награду.
```

**RU — Slogan:**
```
Один удар. Один этаж. Идеальный забег.
```

**RU — Keywords:**
```
экшен, аркада, шутер, неон, top-down, миссии, рестарт
```

**EN — Title:** `Neontron: Night Assault`

**EN — Short:**
```
Neon night floor assaults. One hit and you restart. Short missions, instant retries, chase the S rank.
```

**EN — About:**
```
Neontron: Night Assault is a top-down action game of short night raids. Get a pager contract, enter the building, and clear the floor. Enemies see with vision cones, one mistake ends the run, and restart is instant. Plan your route, grab weapons, unlock masks, and push for a perfect S rank. Stylized neon, fast rhythm, and missions built for one-more-try sessions.
```

**EN — How to play:**
```
On mobile, move with the left stick, aim with the right, and attack with the strike button. Flank enemies, stay out of vision cones, and pick up weapons. On desktop, use WASD and the mouse. If you die, restart instantly. Complete the objective and reach the exit to earn a rank and rewards.
```

**EN — Slogan:**
```
One hit. One floor. Perfect run.
```

**EN — Keywords:**
```
action, arcade, shooter, neon, top-down, missions, restart
```

#### 8.6 Exit criteria Phase 8

- [ ] Все обязательные файлы из таблицы 8.1 существуют
- [ ] `STORE_DRAFT.md` заполнен RU+EN с проверкой длины полей
- [ ] Название одинаково в игре, иконке/обложке и черновике
- [ ] `promo/README.md` описывает что загружать в какое поле консоли
- [ ] Нет мата, политики, чужих логотипов, рамок со скруглением на иконке/обложке

---

### Phase 9 — Pack, QA, moderation readiness

**Сделать:**
1. `npm run build && npm run pack:yandex` → `release/neontron-yandex.zip`
2. Корень zip = `index.html`
3. Прогнать QA matrix:

| Кейс | Ожидание |
|---|---|
| First launch guest | tut start < 3s after ready |
| RU SDK lang | все строки RU |
| EN SDK lang | все строки EN |
| Manual lang switch | работает без знания текущего языка |
| Death spam restart | стабильно, без утечек |
| Interstitial mock | pause/resume ok |
| Rewarded mock | reward only onRewarded |
| Hide tab | audio stop |
| Resize/rotate | no overlap/clip |
| Purchase mock + reload | state consistent |
| Offline open | no hard crash (ads may fail soft) |

4. Заполнить `docs/QA_REPORT.md` чекбоксами
5. Чеклист требований (короткая карта):

| ID | Статус |
|---|---|
| 1.1 SDK | |
| 1.2 guest + auth button | |
| 1.3 mute background | |
| 1.4/1.13 payments+consume | |
| 1.9 autosave | |
| 1.19.2 LoadingAPI.ready | |
| 1.21 size | |
| 1.22 index.html root | |
| 2.9 >10 min | |
| 2.10/2.14 i18n | |
| 2.7 age 12+ visuals | |
| 4.x ads rules | |
| 5.x promo rules | |

**Exit criteria:**
- [ ] ZIP готов
- [ ] QA_REPORT без критических fail
- [ ] Человек может залить zip + promo в консоль по инструкции `promo/README.md`

---

## 3. Порядок промптов для агента (копипаст)

Использовать **отдельный чат/прогон на фазу**:

### Prompt Phase 1
```
Реализуй Phase 1 из docs/LLM_PRODUCTION_PLAN.md для Неонтрон: Ночной штурм.
Стек только Vite+Phaser+TS. Не начинай миссии. Закрой Exit criteria Phase 1 и закоммить.
```

### Prompt Phase 2
```
Реализуй Phase 2 из docs/LLM_PRODUCTION_PLAN.md. Все строки через i18n ru/en. Добавь check-i18n скрипт. Закоммить.
```

### Prompt Phase 3
```
Реализуй Phase 3 vertical slice (миссия plat_03) строго по GDD. Touch+desktop. Instant restart. Закоммить.
```

### Prompt Phase 4
```
Реализуй Phase 4: JSON миссии, туториал + ≥12 уровней, hub select, autosave. i18n для брифингов. Закоммить.
```

### Prompt Phase 5
```
Реализуй Phase 5: личины, валюты, shop UI без paywall сюжета. Закоммить.
```

### Prompt Phase 6
```
Реализуй Phase 6: Yandex ads/iap compliant services + guest/cloud auth button. Mock SDK. Закоммить.
```

### Prompt Phase 7
```
Реализуй Phase 7 polish/audio/stability/budget checks. Закоммить.
```

### Prompt Phase 8
```
Реализуй Phase 8: сгенерируй/собери promo/ и store/STORE_DRAFT.md по спецификациям плана. RU+EN. Закоммить.
```

### Prompt Phase 9
```
Реализуй Phase 9: pack zip, QA_REPORT, requirements checklist. Исправь найденные блокеры. Закоммить.
```

---

## 4. Бюджет ассетов (чтобы LLM не раздул билд)

| Категория | Лимит |
|---|---|
| Textures atlases | ≤ 25 МБ |
| Audio | ≤ 30 МБ |
| Code+json | ≤ 5 МБ |
| Misc | ≤ 10 МБ |
| **Total unzipped** | **< 100 МБ** (цель ≤ 70 МБ) |

Правила:
- один atlas на персонажей, один на тайлы, один UI
- mp3/ogg низкий bitrate для лупов
- не класть исходники PSD/WAV-мастера в `dist/` (WAV только в `docs/audio`)

---

## 5. Контентный минимум MVP (чтобы «готовая игра» была честной)

| Система | Минимум |
|---|---|
| Туториал | 3 |
| Сюжетные миссии | 12 |
| Типы врагов | 4 |
| Оружие | 6 |
| Личины | 3 |
| Языки | RU+EN |
| Ads | interstitial+rewarded(+sticky) |
| IAP | 2 продукта |
| Промо | icon+2 covers+≥2 desktop shots+≥2 mobile shots+store texts |

Post-MVP (не блокирует первую модерацию): daily, weekly, сезон, главы 2–3, trailer если не успели.

---

## 6. Риски LLM и как их гасить

| Риск | Анти-паттерн | Правило плана |
|---|---|---|
| Бесконечная полировка арта | рисует 50 спрайтов | placeholders → atlas в Phase 7 only |
| Ломает архитектуру каждой фазой | rewrite scenes | запрет рефакторить вне текущей фазы |
| Хардкод RU | забывает EN | CI script check-i18n |
| Paywall случайно | RV to continue story | явный запрет в Phase 6 |
| Размер >100MB | кидает WAV в dist | check-budget |
| Промо = скрин как icon | бан модерации | Phase 8 таблица правил |
| Другая игра вместо апдейта | меняет жанр | запрет, треб. 1.24 |

---

## 7. Что считается успехом для человека

После Phase 9 у вас на руках:
1. `release/neontron-yandex.zip` — билд
2. `promo/` — картинки (+видео если сделано)
3. `store/STORE_DRAFT.md` — тексты RU/EN
4. `docs/QA_REPORT.md` — зелёный чеклист

Дальше человек (не LLM) делает только:
- создаёт черновик в Консоли Яндекс Игр
- загружает zip + promo
- включает РСЯ / прописывает IAP id
- отправляет на модерацию

---

## 8. Статус этого документа

- [x] План написан под LLM-исполнение
- [ ] Phase 1…9 выполнены
- [ ] Игра в модерации

**Следующий конкретный шаг:** запустить Prompt Phase 1.
