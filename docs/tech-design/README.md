# Neontron — Technical Design package (LLM)

Этот пакет — **второй, технический диздок** поверх продуктового GDD.

## Читать в таком порядке

1. [`TDD-NEONTRON-LLM.md`](./TDD-NEONTRON-LLM.md) — полный bible  
2. [`../GDD-NEONTRON.md`](../GDD-NEONTRON.md) — продукт / монетизация / Яндекс  
3. [`../visual-style/README.md`](../visual-style/README.md) — mood frames (не финальный пайплайн)

## Папки

| Папка | Содержимое |
|---|---|
| [`wireframes/`](./wireframes/) | UI wireframes пейджера |
| [`refs/`](./refs/) | Level / sprite / architecture refs |
| [`prompts/`](./prompts/) | Готовые промпты для image/sprite LLM |

## Как ставить задачу агенту

Скопируй **AGENT CARD** из TDD §8 целиком.  
Не давай агенту «сделай красивее» без Card — иначе разъедется палитра и пути.

## Ключевой сдвиг

| Было | Стало |
|---|---|
| 4 mood-картинки на всё | биомы + поуровневые concept + sprite contracts |
| Уровни «коробки» | библия §5 с планом/динамикой/видом |
| UI «на глаз» | wireframes + component IDs U-01…U-12 |
| Размытые задачи LLM | Agent Cards A1–A10 |
