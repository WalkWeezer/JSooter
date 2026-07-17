# Черновик стора Яндекс Игр — Неонтрон: Ночной штурм

Заполнять поля консоли по этому файлу. Лимиты — из [документации черновика](https://yandex.ru/dev/games/doc/ru/console/add-new-game/draft).

Промо-файлы: [`../promo/`](../promo/) (создаётся в Phase 8 плана).

---

## Общие параметры

| Поле | Значение |
|---|---|
| Версия | `0.1.0.0` |
| Платформы | Mobile, Desktop |
| Ориентация | Any (mobile portrait primary) |
| Возраст | 12+ |
| Категории | Боевики, Аркады |
| Игра переведена на | `ru`, `en` |
| Облачные сохранения | Да (после Phase 6) |
| TV | Нет |

---

## RU

### Название (≤50)
```
Неонтрон: Ночной штурм
```
Длина: 24

### Описание short (50–160)
```
Ночные штурмы этажей в неоне. Один удар — и путь сначала. Короткие миссии, мгновенный рестарт, охота за рангом S.
```

### Slogan (≤70)
```
Один удар. Один этаж. Идеальный забег.
```

### Об игре (100–1000)
```
Неонтрон: Ночной штурм — top-down экшен про короткие ночные рейды. Получай контракт на пейджер, заходи в здание и зачищай этаж. Враги видят конусами зрения, ошибка стоит жизни, а рестарт мгновенный. Прокладывай маршрут, подбирай оружие, открывай личины и бейся за идеальный ранг S. Стилизованный неон, быстрый ритм и миссии, которые хочется перепроходить снова и снова.
```

### Как играть (100–1000)
```
На телефоне двигайся левым стиком, целись правым и атакуй кнопкой удара. Заходи врагам за спину, не попадай в конус зрения, подбирай оружие с пола. На компьютере — WASD и мышь. Умер — сразу начинай заново. Выполни цель миссии и доберись до точки выхода, чтобы получить ранг и награду.
```

### Ключевые слова (≤100, lower-case)
```
экшен, аркада, шутер, неон, top-down, миссии, рестарт
```

### Теги (до 20)
`шутер`, `пиксель`, `одиночная`, `неон`, `аркада`, `экшен`

---

## EN

### Title (≤50)
```
Neontron: Night Assault
```

### Short (50–160)
```
Neon night floor assaults. One hit and you restart. Short missions, instant retries, chase the S rank.
```

### Slogan (≤70)
```
One hit. One floor. Perfect run.
```

### About (100–1000)
```
Neontron: Night Assault is a top-down action game of short night raids. Get a pager contract, enter the building, and clear the floor. Enemies see with vision cones, one mistake ends the run, and restart is instant. Plan your route, grab weapons, unlock masks, and push for a perfect S rank. Stylized neon, fast rhythm, and missions built for one-more-try sessions.
```

### How to play (100–1000)
```
On mobile, move with the left stick, aim with the right, and attack with the strike button. Flank enemies, stay out of vision cones, and pick up weapons. On desktop, use WASD and the mouse. If you die, restart instantly. Complete the objective and reach the exit to earn a rank and rewards.
```

### Keywords (≤100)
```
action, arcade, shooter, neon, top-down, missions, restart
```

### Tags
`shooter`, `pixel`, `singleplayer`, `neon`, `arcade`, `action`

---

## Промо — что загрузить

| Поле консоли | Файл |
|---|---|
| Иконка | `promo/icon-512.png` |
| Обложка | `promo/cover-800x470.png` |
| Обложка витрины | `promo/cover-wide-1560x520.png` |
| Скриншоты Desktop | `promo/shot-desktop-*.png` (≥2) |
| Скриншоты Mobile | `promo/shot-mobile-*.png` (≥2) |
| Видео (если есть) | `promo/trailer-*.mp4` |

---

## Комментарий разработчику модерации (опционально)

```
Top-down action, stylized 12+ combat (neon dissolve, no realistic gore).
Ads: interstitial after mission results only; rewarded optional bonuses.
IAP: remove ads + soft currency pack; consume enabled; no story paywall.
Languages: RU/EN via SDK i18n.lang + manual switch.
```
