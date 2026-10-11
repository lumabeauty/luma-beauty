# Luma Beauty — сайт для GitHub Pages

Магазин косметики: каталог, 5 языков, корзина, промокод LUMA25 (−20%), доставка / самовывоз, оплата Payme / Click, админ-панель.

## Что внутри
- `index.html` — магазин (полная версия, работает вместе с Supabase). Пока Supabase не настроен, сам открывает `demo.html`.
- `demo.html` — готовая версия без настройки: заказы приходят в Telegram.
- `admin.html` — админ-панель (товары, цены, заказы, клиенты, промокоды). Нужен Supabase.
- `config.js` — настройки (ключи Supabase, Telegram, Payme, Click).
- `img/` — фото товаров, `sql/` — файлы для базы данных.

## Шаг 1. Выложить сайт на GitHub (бесплатно)
1. Зарегистрируйтесь на github.com.
2. Нажмите **+ → New repository**. Имя: `luma-beauty`, доступ **Public**, нажмите **Create repository**.
3. На странице репозитория нажмите **uploading an existing file**.
4. Распакуйте архив и перетащите в окно ВСЁ содержимое: `index.html`, `demo.html`, `admin.html`, `config.js`, `README.md`, папки `img` и `sql`.
5. Внизу нажмите **Commit changes**.

## Шаг 2. Включить сайт
1. В репозитории откройте **Settings → Pages**.
2. В разделе **Build and deployment** выберите **Deploy from a branch**, ветка **main**, папка **/ (root)**, нажмите **Save**.
3. Через 1–2 минуты вверху появится адрес: `https://ВАШ-ЛОГИН.github.io/luma-beauty/`. Это ваш сайт, его можно отправлять клиентам.

Сразу после этого работает версия `demo.html`: каталог, языки, корзина, промокод, доставка, заказы в Telegram (@Hak1mjon).

## Шаг 3. Админ-панель и база клиентов (Supabase)
1. На supabase.com создайте проект (бесплатно).
2. **SQL Editor → New query**: вставьте текст из `sql/1_schema.sql` → Run. Затем так же `sql/2_products.sql`.
3. **Authentication → Providers → Email**: выключите **Confirm email**.
4. **Project Settings → API**: скопируйте **Project URL** и ключ **anon public**.
5. На GitHub откройте файл `config.js`, нажмите значок карандаша, впишите `SUPABASE_URL` и `SUPABASE_KEY`, нажмите **Commit changes**. Через минуту `index.html` перейдёт на полную версию.
6. **Authentication → URL Configuration**: в поле **Site URL** вставьте адрес вашего сайта на GitHub Pages.
7. Зарегистрируйтесь на своём сайте как клиент, затем в SQL Editor выполните (со своим e-mail):
   `update profiles set is_admin=true where email='ваш@email.com';`
8. Админка: `https://ВАШ-ЛОГИН.github.io/luma-beauty/admin.html`.

## Обновление сайта
Откройте файл на GitHub → значок карандаша → внесите изменения → **Commit changes**. Через минуту сайт обновится. Новые версии файлов от Claude можно загрузить через **Add file → Upload files**.

## Свой домен
**Settings → Pages → Custom domain**, впишите домен (например, lumabeauty.uz) и настройте DNS по подсказке GitHub.

## То же через командную строку
```
git init
git add .
git commit -m "Luma Beauty"
git branch -M main
git remote add origin https://github.com/ВАШ-ЛОГИН/luma-beauty.git
git push -u origin main
```

## Важно
- Ключ **anon public** можно держать в публичном репозитории: данные защищены правилами базы. Ключ **service_role** нигде не публикуйте.
- Статус оплаты Payme / Click пока меняется вручную в админке. Для приёма платежей впишите ID мерчанта в `config.js`.
- Клиентская база содержит персональные данные. Уточните требования закона Узбекистана о персональных данных.
