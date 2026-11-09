# Публикация выбранных SKU ACANA и Orijen - 9 ноября 2026

## Область

К обновлённой оплачиваемой корзине и бонусному списку Адриана от 8 ноября добавлены 11 ранее отсутствовавших фасовок. Код, EAN, вес и тариф сверены с `ACANA-ORIJEN-B2B-CATALOG-2026-10-31.md`. Закупочный тариф указан без IVA. Розница указана с IVA. Скидка 20% на первую закупку и стоимость доставки в цены ниже не включены, поскольку счёт на финальную корзину не подтверждён.

| Список | Код DV | Товар | B2B без IVA | Розница с IVA | Основание розницы |
| --- | --- | --- | ---: | ---: | --- |
| Оплата | `064992525118` | ACANA Adult Dog 11,4 кг | 63,46 € | 75,99 € | [Kiwoko](https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/acana-adult-pienso-para-perros/ACAACB02_M.html) |
| Оплата | `ACH106` | ACANA Puppy 11,4 кг | 63,49 € | 92,19 € | [Kiwoko](https://www.kiwoko.com/perros/especial-cachorro/pienso-para-cachorros/acana-puppy_junior-pienso-para-perros/ACAAPJ00_M.html) |
| Оплата | `064992730918` | ACANA Dog Red Meat 11,4 кг | 61,49 € | 76,99 € | [Kiwoko](https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-sin-cereales/acana-red-meat-pienso-para-perros/ACA1121K020N_M.html) |
| Оплата | `ACH124` | ACANA Light & Fit 6 кг | 38,11 € | 42,99 € | [Kiwoko](https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-light/acana-light_fit-pienso-para-perros/ACAALF13_M.html) |
| Оплата | `ORD110` | Orijen Original Dog 11,4 кг | 81,14 € | 90,49 € | Закупочная себестоимость с IVA и recargo - 90,39 €; [Kiwoko](https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/orijen-original-pienso-para-perros/ORJOA02_M.html) показывает 88,39 € |
| Бонус | `CAR10` | ACANA Classics Red Meat 9,7 кг | 52,02 € | 63,89 € | [Kiwoko](https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/acana-classics-red-meat-pienso-para-perros/ACACAR11_M.html) |
| Бонус | `CAW10` | ACANA Classics Wild Coast 9,7 кг | 53,35 € | 63,39 € | [Kiwoko](https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-de-pescado/acana-classics-wild-coast-pescado-pienso-para-perros/ACACAW11_M.html) |
| Бонус | `ACH102` | ACANA Puppy Small Breed 6 кг | 38,11 € | 42,99 € | [Kiwoko](https://www.kiwoko.com/perros/especial-cachorro/pienso-para-cachorros/acana-puppy-small-breed-pienso-para-perros/ACAAPS00_M.html) |
| Бонус | `ACR202` | ACANA Highest Protein Wild Prairie 6 кг | 44,72 € | 53,29 € | [Kiwoko](https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/acana-hp-wild-prairie-pienso-para-perros/ACAAW00_M.html) |
| Бонус | `ORD117` | Orijen Regional Red 6 кг | 65,14 € | 74,99 € | Закупочная себестоимость с IVA и recargo - 72,57 €; [Miscota](https://www.miscota.es/perros/orijen/dry-regional-red-dog-134811) показывает 69,84 € |
| Бонус | `ACH128` | ACANA Senior 6 кг | 38,11 € | 46,49 € | [Kiwoko](https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-perros-seniores/acana-senior-pienso-para-perros/ACAAS00_M.html) |

Отдельные студийные изображения каждой фасовки лежат в `media/acana-orijen-selected-2026-11-09/`. Данные товаров и источники розничных цен находятся в `acana-orijen-selected-formats.js`. Миграция в `server/catalog.js` добавляет изображения, цену и точное сопоставление с B2B артикулом, сохраняя цену продажи отдельно от закупочного тарифа.

Для Orijen Original 11,4 кг и Regional Red 6 кг стандартная розница конкурента ниже закупочной себестоимости без скидки. Установлены цены выше этой себестоимости, но запас до затрат на доставку мал. Их следует пересчитать после подтверждения скидки и счёта Адриана. Наличие в прайсе не является физическим остатком и не подтверждает отправку поставщиком.

## Уже существовавшие позиции с проблемой заказа

- ACANA Grass-Fed Lamb 11,4 кг `ACS203`: в тарифе 81,22 € без IVA. Старый ориентир 89,49 € был ниже 90,48 € с IVA и recargo. Новая розница 92,99 €, статус - доступно под заказ, без заявления о складском остатке. [Ориентир Kiwoko](https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-sin-cereales/acana-grass-fed-lamb-pienso-para-perros/ACAAGF00_M.html) остаётся внутренним сравнением. Доставка и прочие расходы в 92,99 € не заложены.
- Royal Canin Gastrointestinal Kitten сухой 2 кг: точной закупочной строки в обычном тарифе TIENDA нет. [Kiwoko](https://www.kiwoko.com/gatos/comida-para-gatos/dietas-veterinarias/alimentacion-seca/royal-canin-veterinary-gastrointestinal-pienso-para-gatitos/ROY1228000_M.html) показывает фасовку 2 кг за 33,59 € с IVA и доставку или самовывоз. Для клиентского заказа используется розничный резервный источник Kiwoko, продажная цена 36,69 €. Это не подтверждённая закупка у Royal Canin. Перед исполнением проверять фактический остаток, цену и стоимость получения.

HeyboPet, сезонные аксессуары и подарочная упаковка в эту ревизию не входят.

## Проверка публикации

После отправки изменений в `main` проверены публичный `/api/catalog` и админка `/api/admin/variants`: все 11 новых фасовок, ACANA Grass-Fed Lamb 11,4 кг и Royal Canin Gastrointestinal Kitten 2 кг доступны для добавления в корзину. Розничные цены в публичном каталоге совпадают с таблицей выше, а для двух ранее существовавших позиций составляют 92,99 € и 36,69 € соответственно. Все 13 студийных изображений открываются с сайта в размере 1254 × 1254.

Для 11 новых фасовок и корма с ягнёнком старые автоматически рассчитанные цены оставались в админке как подтверждённые переопределения. Их исправили через раздел «Цены и остатки» по точным SKU; закупочные тарифы при этом не меняли. Миграция `selected_retail_reconcile_2026_11_09` дополнительно устраняет эти старые переопределения при следующем запуске сервера, если они ещё остались, и сохраняет другие ручные правки.

Royal Canin Gastrointestinal Kitten 2 кг остаётся без подтверждённой закупочной цены Royal Canin: для него предусмотрен резервный розничный источник. Статус «доступно под заказ» не означает наличие на нашем складе или согласованный заказ у Royal Canin.
