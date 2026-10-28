---
title: "Altruist экран за экраном: короткие видеоинструкции"
date: 2026-10-28
published: true
locale: "ru"
cover_image: ./images/cover.webp
description: "Короткие видеоинструкции по веб-интерфейсу Altruist: первый запуск, показания, карта, приватность, обновления, резервная копия и функции Insight."
abstract: "Разработчица прошивки Altruist записала короткое видео для каждого экрана интерфейса. Собрали их в том порядке, в каком они понадобятся."
tags: ["altruist", "guide", "firmware", "video"]
author: ""
---

Веб-интерфейс Altruist теперь устроен как приложение: **Local** — показания и настройки устройства, **Map** — всё, что уходит на sensors.social, **Custom** — Home Assistant и другие интеграции, **System** — обновления, резервная копия и сброс. На компьютере это боковое меню, на телефоне — вкладки внизу.

Юля, которая пишет прошивку Altruist, записала короткое видео для каждого экрана. Без озвучки, только действия: удобно повторять в своём темпе.

## Первый запуск

### Подключение к Wi-Fi

Подключитесь с телефона к сети `Altruist-…`, страница настройки откроется сама. Выберите домашнюю сеть (2,4 ГГц), введите пароль и дождитесь **Connected**. Сохраните IP-адрес со страницы и нажмите **Finish setup**.

<div class="video-embed video-embed-portrait">
  <video src="./images/altruist-wifi-setup.mp4" controls muted playsinline preload="metadata" poster="./images/altruist-wifi-setup.webp"></video>
</div>

### Точка на карте

**Map → GPS & Sensors**: широта и долгота, маркер на маленькой карте для проверки. Координаты видны всем. Точка в квартале от дома сохранит приватность, а данные останутся такими же полезными.

<div class="video-embed"><video src="./images/altruist-set-geo.mp4" controls muted playsinline preload="metadata" poster="./images/altruist-set-geo.webp"></video></div>

## Каждый день

### Показания и статус

**Local → Readings** — все значения, которые меряет датчик. **Status** — в сети ли он, ушли ли последние данные на карту, его IP и адрес. **Copy all** копирует технические сведения одним нажатием — удобно, когда пишете в поддержку.

<div class="video-embed"><video src="./images/altruist-basic-data-and-support-details.mp4" controls muted playsinline preload="metadata" poster="./images/altruist-basic-data-and-support-details.webp"></video></div>

### Что видно на карте

**Map → Publish to map**: отметьте значения, которые пойдут на открытую карту. **Encrypt map values**: отмеченные значения уходят с датчика зашифрованными и открываются только вам — после входа на sensors.social своим ключом или файлом резервной копии. Снимите все галочки, и датчик станет полностью приватным.

<div class="video-embed"><video src="./images/altruist-not-publish-or-encrypt-values.mp4" controls muted playsinline preload="metadata" poster="./images/altruist-not-publish-or-encrypt-values.webp"></video></div>

### Настройки сети (для продвинутых)

**Map → Robonomics**: как часто датчик пишет подписанный журнал, к какой ноде подключается, и поле **RWS Owner Address (legacy)**. В этом поле — адрес подписки, а не ключ датчика. Большинству владельцев этот экран не понадобится.

<div class="video-embed"><video src="./images/altruist-robonomics-settings.mp4" controls muted playsinline preload="metadata" poster="./images/altruist-robonomics-settings.webp"></video></div>

## Обновления, резервная копия, сброс

### Проверить обновление прошивки

**Local → Firmware Update → Check for update** сравнит вашу версию с последней. Нажмите **Update** и следите за полосой прогресса. Не отключайте питание, пока датчик не перезапустится.

<div class="video-embed"><video src="./images/altruist-firmware-check.mp4" controls muted playsinline preload="metadata" poster="./images/altruist-firmware-check.webp"></video></div>

### Скачать резервную копию

**System → Backup & restore → Download backup** сохраняет один файл `backup.json`: Wi-Fi, координаты, настройки и ключ датчика. Храните его отдельно от датчика, например в менеджере паролей.

<div class="video-embed"><video src="./images/altruist-download-backup.mp4" controls muted playsinline preload="metadata" poster="./images/altruist-download-backup.webp"></video></div>

### Восстановить из копии

Тот же экран: выберите файл и подтвердите. Датчик перезапустится, и вернутся Wi-Fi, ключ, адрес на карте и все настройки.

<div class="video-embed"><video src="./images/altruist-restore-from-backup.mp4" controls muted playsinline preload="metadata" poster="./images/altruist-restore-from-backup.webp"></video></div>

### Восстановить сразу после сброса

Настраивать всё заново не нужно. Пока датчик ещё в своей сети настройки и не подключён к вашему Wi-Fi, на странице настройки уже есть **Backup & restore**.

<div class="video-embed"><video src="./images/altruist-backup-restore-from-setup.mp4" controls muted playsinline preload="metadata" poster="./images/altruist-backup-restore-from-setup.webp"></video></div>

### Сбросить только Wi-Fi

Новый роутер или пароль? **System → Delete configuration → Wi-Fi only** забывает сеть, всё остальное остаётся. Датчик снова открывает страницу настройки, и вы подключаете его заново.

<div class="video-embed"><video src="./images/altruist-reset-wifi.mp4" controls muted playsinline preload="metadata" poster="./images/altruist-reset-wifi.webp"></video></div>

## Altruist Urban

### Светодиодная лента

**Local → Settings → LEDs**: включить или выключить ленту и задать яркость.

<div class="video-embed"><video src="./images/urban-leds.mp4" controls muted playsinline preload="metadata" poster="./images/urban-leds.webp"></video></div>

## Altruist Insight

### Первый запуск

Та же страница настройки и ещё один выбор: Insight сам по себе или вместе с Urban на улице.

<div class="video-embed video-embed-portrait">
  <video src="./images/altruist-wifi-setup-insight.mp4" controls muted playsinline preload="metadata" poster="./images/altruist-wifi-setup-insight.webp"></video>
</div>

### Пара с основным Urban

Insight находит Urban в сети, или вы вводите его IP. Основной Urban делит первую страницу экрана с показаниями самого Insight.

<div class="video-embed"><video src="./images/inisght-main-urban-pairing.mp4" controls muted playsinline preload="metadata" poster="./images/inisght-main-urban-pairing.webp"></video></div>

### Ещё Urban

**Local → Other Urbans**: добавьте второй или третий датчик и подпишите его для экрана — кухня, балкон. У каждого своя страница.

<div class="video-embed"><video src="./images/insight-add-extra-urban.mp4" controls muted playsinline preload="metadata" poster="./images/insight-add-extra-urban.webp"></video></div>

### Аналитика сна

Задайте часы своей ночи, решите, открывать ли отчёт на экране каждое утро и до какого часа, и добавьте в оценку уличную пыль и шум с вашего Urban.

<div class="video-embed"><video src="./images/insight-sleep-analytics-settings.mp4" controls muted playsinline preload="metadata" poster="./images/insight-sleep-analytics-settings.webp"></video></div>

### Формат даты

**Local → System → Date format**: MM/DD/YYYY, DD.MM.YYYY или YYYY-MM-DD. Шапка e-ink экрана и страница Status следуют выбору.

<div class="video-embed"><video src="./images/insight-date-format-on-screen.mp4" controls muted playsinline preload="metadata" poster="./images/insight-date-format-on-screen.webp"></video></div>

### Подсветка и ночные часы

Включить или выключить подсветку, яркость, часы выключения и включения. Перед выключением она плавно гаснет. Одинаковый час в обоих полях — подсветка горит всю ночь.

<div class="video-embed"><video src="./images/insight-leds-settings.mp4" controls muted playsinline preload="metadata" poster="./images/insight-leds-settings.webp"></video></div>

---

Застряли на каком-то шаге? Отсканируйте QR-код на Altruist: [AI-ассистент настройки](/blog/altruist-ai-assistant-setup) проведёт по каждому экрану. Следующим будет гайд по переходу с прежней прошивки.
