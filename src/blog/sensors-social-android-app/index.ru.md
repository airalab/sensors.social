---
title: "sensors.social для Android: ваши датчики в кармане"
date: 2026-11-13
published: true
locale: "ru"
cover_image: ./images/cover.webp
description: "Приложение sensors.social для Android: добавьте датчик по QR-коду или по названию, смотрите показания одним взглядом и получайте уведомление, когда воздух становится плохим."
abstract: "У карты появился спутник на телефоне. Добавьте датчики, которые вам важны, смотрите их показания одним взглядом и получайте уведомление, когда воздух становится плохим или датчик замолкает."
tags: ["app", "android", "altruist"]
author: ""
---

На карте sensors.social видны все датчики сети. Но обычно человеку важны несколько: на своём балконе, у друзей на другом конце города, возле школы. **Приложение sensors.social для Android** держит эти несколько под рукой и сообщает, когда воздух у них портится.

Без аккаунта и регистрации. Приложение берёт открытые данные sensors.social напрямую, а список ваших датчиков хранится только на телефоне.

<p><a class="button" href="https://github.com/PinoutLimited/sensors-social-android/releases/latest">Скачать для Android</a></p>

Приложение — это APK на GitHub, для Android 7 и новее. Откройте последний релиз, скачайте файл `.apk` и откройте его: Android один раз попросит разрешить установку из браузера.

## Добавить датчик

Нажмите **Add a sensor**. Есть три способа.

**По названию.** У каждого датчика на карте есть название из двух слов, например *Auburn Horseradish*, и у каждого владельца тоже, например *Slender Scorpion*. Начните печатать, и приложение подскажет датчики и владельцев, которых найдёт на карте. Выберите владельца, и добавятся сразу все его датчики.

<div class="video-embed video-embed-app"><video src="./images/add-by-name.mp4" controls muted playsinline preload="none" poster="./images/add-by-name.webp"></video></div>

**По QR-коду.** Откройте датчик на [карте](/ru/), перейдите на вкладку **Поделиться** и наведите телефон на код. QR-код каждого датчика лежит там, рядом с короткой инструкцией.

<div class="video-embed video-embed-app"><video src="./images/add-by-qr.mp4" controls muted playsinline preload="none" poster="./images/add-by-qr.webp"></video></div>

**По адресу.** Вставьте адрес датчика или владельца — если вам его прислали.

## Ваши датчики одним взглядом

На главном экране — датчики, за которыми вы следите, и их последние показания: PM2.5 и PM10 у Altruist Urban, CO₂ у Altruist Insight, а также шум, температура и влажность. Цвета — по той же шкале качества воздуха, что и на карте: зелёный здесь значит то же, что и там.

Нажмите на датчик, чтобы открыть его экран: каждое значение со своей шкалой, пик шума и давление. Нажмите на значение, чтобы увидеть график за 24 часа, 7 или 30 дней. Датчик можно переименовать во что-то узнаваемое: «Балкон» или «У бабушки».

<div class="video-embed video-embed-app"><video src="./images/sensor-screen.mp4" controls muted playsinline preload="none" poster="./images/sensor-screen.webp"></video></div>

## Уведомления

Включите **Alerts** у датчика, и приложение будет проверять его примерно раз в 15 минут. Уведомление придёт, когда воздух станет плохим (*Poor*) по шкале карты, и когда датчик молчит два часа: значит, пора проверить питание или Wi-Fi.

Проверки идут на самом телефоне. Нет сервера, который знал бы, за какими датчиками вы следите. Кнопка **Test notification** покажет, как выглядит уведомление.

<div class="video-embed video-embed-app"><video src="./images/alerts.mp4" controls muted playsinline preload="none" poster="./images/alerts.webp"></video></div>

## Настроить новый Altruist

Только что распаковали Altruist? **Set up a new Altruist** проведёт через четыре шага: включить, подключиться к его Wi-Fi, подключить к домашней сети и поставить на карту. Приложение сдвигает точку на карте примерно на 100 метров, чтобы карта показывала ваш район, а не дверь. Новый датчик появится в списке с уже включёнными уведомлениями.

<div class="video-embed video-embed-app"><video src="./images/new-altruist.mp4" controls muted playsinline preload="none" poster="./images/new-altruist.webp"></video></div>

## Карта в одно касание

Кнопка карты открывает sensors.social поверх приложения, сразу на том датчике, который вы смотрите: с полной историей, слоями ветра, пыли и дыма и соседними датчиками.

<div class="video-embed video-embed-app"><video src="./images/map.mp4" controls muted playsinline preload="none" poster="./images/map.webp"></video></div>

---

Приложение открытое, под лицензией AGPL-3.0, как и карта: [код на GitHub](https://github.com/PinoutLimited/sensors-social-android). Светлая и тёмная тема — по настройке телефона. Нашли ошибку или чего-то не хватает? Напишите нам через [Поддержку](/ru/support/).
