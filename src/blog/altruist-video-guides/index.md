---
title: "Your Altruist, screen by screen: short video guides"
date: 2026-10-28
published: true
locale: "en"
cover_image: ./images/cover.webp
description: "Short video guides to the Altruist web interface: setup, readings, the map, privacy, updates, backup, and Insight features."
abstract: "Our firmware developer recorded a short video for every screen of the Altruist interface. Here they are, in the order you will need them."
tags: ["altruist", "guide", "firmware", "video"]
author: ""
---

The Altruist web interface now works like an app: **Local** for readings and device settings, **Map** for everything that goes to sensors.social, **Custom** for Home Assistant and other integrations, and **System** for updates, backup and resets. A sidebar on a computer, tabs on a phone.

Yulia, who writes the Altruist firmware, recorded a short video for each screen. No voice-over, just the clicks, so you can follow along at your own pace.

## First setup

<details class="video-guide">
<summary>Connect to your Wi-Fi</summary>

Join the `Altruist-…` network from your phone and the setup page opens by itself. Pick your home network (2.4 GHz), type the password, and wait for **Connected**. Save the IP address the page shows, then press **Finish setup**.

<div class="video-embed video-embed-portrait">
  <video src="./images/altruist-wifi-setup.mp4" controls muted playsinline preload="none" poster="./images/altruist-wifi-setup.webp"></video>
</div>

</details>

<details class="video-guide">
<summary>Put your sensor on the map</summary>

**Map → GPS & Sensors**: enter latitude and longitude and check the marker on the small map. The coordinates are public. A point a block away keeps your home private and the data just as useful.

<div class="video-embed"><video src="./images/altruist-set-geo.mp4" controls muted playsinline preload="none" poster="./images/altruist-set-geo.webp"></video></div>

</details>

## Everyday use

<details class="video-guide">
<summary>Readings and status</summary>

**Local → Readings** shows every value the sensor measures. **Status** tells you whether it is online, whether the last data reached the map, its IP and its address. **Copy all** puts the technical details on your clipboard, handy when you write to support.

<div class="video-embed"><video src="./images/altruist-basic-data-and-support-details.mp4" controls muted playsinline preload="none" poster="./images/altruist-basic-data-and-support-details.webp"></video></div>

</details>

<details class="video-guide">
<summary>Choose what goes public</summary>

**Map → Publish to map**: tick the values you want on the open map. **Encrypt map values**: the ticked values leave the sensor sealed and open only for you, after you log in on sensors.social with your key or your backup file. Untick everything to keep the sensor fully private.

<div class="video-embed"><video src="./images/altruist-not-publish-or-encrypt-values.mp4" controls muted playsinline preload="none" poster="./images/altruist-not-publish-or-encrypt-values.webp"></video></div>

</details>

<details class="video-guide">
<summary>Network settings (advanced)</summary>

**Map → Robonomics**: how often the sensor writes its signed log, which node it talks to, and the **RWS Owner Address (legacy)** field. That field holds a subscription address, not the sensor's key. Most owners never need to touch this screen.

<div class="video-embed"><video src="./images/altruist-robonomics-settings.mp4" controls muted playsinline preload="none" poster="./images/altruist-robonomics-settings.webp"></video></div>

</details>

## Updates, backup and resets

<details class="video-guide">
<summary>Check for a firmware update</summary>

**Local → Firmware Update → Check for update** compares your version with the latest one. Press **Update** and watch the progress bar. Keep the sensor powered until it restarts.

<div class="video-embed"><video src="./images/altruist-firmware-check.mp4" controls muted playsinline preload="none" poster="./images/altruist-firmware-check.webp"></video></div>

</details>

<details class="video-guide">
<summary>Download a backup</summary>

**System → Backup & restore → Download backup** saves one `backup.json` file: Wi-Fi, location, settings and the sensor's key. Keep it away from the sensor, for example in your password manager.

<div class="video-embed"><video src="./images/altruist-download-backup.mp4" controls muted playsinline preload="none" poster="./images/altruist-download-backup.webp"></video></div>

</details>

<details class="video-guide">
<summary>Restore from a backup</summary>

Same screen: choose the file and confirm. The sensor restarts with its Wi-Fi, key, address on the map and all settings back.

<div class="video-embed"><video src="./images/altruist-restore-from-backup.mp4" controls muted playsinline preload="none" poster="./images/altruist-restore-from-backup.webp"></video></div>

</details>

<details class="video-guide">
<summary>Restore right after a reset</summary>

You do not have to set everything up again. While the sensor is still on its own setup network, before it joins your Wi-Fi, the setup page already has **Backup & restore**.

<div class="video-embed"><video src="./images/altruist-backup-restore-from-setup.mp4" controls muted playsinline preload="none" poster="./images/altruist-backup-restore-from-setup.webp"></video></div>

</details>

<details class="video-guide">
<summary>Reset only the Wi-Fi</summary>

New router or new password? **System → Delete configuration → Wi-Fi only** forgets the network and keeps everything else. The sensor reopens its setup page and you connect it again.

<div class="video-embed"><video src="./images/altruist-reset-wifi.mp4" controls muted playsinline preload="none" poster="./images/altruist-reset-wifi.webp"></video></div>

</details>

## Altruist Urban

<details class="video-guide">
<summary>LED strip</summary>

**Local → Settings → LEDs**: turn the strip on or off and set the brightness.

<div class="video-embed"><video src="./images/urban-leds.mp4" controls muted playsinline preload="none" poster="./images/urban-leds.webp"></video></div>

</details>

## Altruist Insight

<details class="video-guide">
<summary>First setup</summary>

The same setup page, with one more choice: run Insight on its own, or together with an Urban outside.

<div class="video-embed video-embed-portrait">
  <video src="./images/altruist-wifi-setup-insight.mp4" controls muted playsinline preload="none" poster="./images/altruist-wifi-setup-insight.webp"></video>
</div>

</details>

<details class="video-guide">
<summary>Pair with your main Urban</summary>

Insight finds the Urban on your network, or you type its IP. The main Urban shares the first page of the e-ink screen with Insight's own readings.

<div class="video-embed"><video src="./images/inisght-main-urban-pairing.mp4" controls muted playsinline preload="none" poster="./images/inisght-main-urban-pairing.webp"></video></div>

</details>

<details class="video-guide">
<summary>Add more Urbans</summary>

**Local → Other Urbans**: add a second or third sensor and give it a name for the screen, like kitchen or balcony. Each one gets its own page.

<div class="video-embed"><video src="./images/insight-add-extra-urban.mp4" controls muted playsinline preload="none" poster="./images/insight-add-extra-urban.webp"></video></div>

</details>

<details class="video-guide">
<summary>Sleep analytics</summary>

Set the hours of your night, choose whether the report opens on the screen every morning and until when, and add the outdoor dust and noise from your Urban to the score.

<div class="video-embed"><video src="./images/insight-sleep-analytics-settings.mp4" controls muted playsinline preload="none" poster="./images/insight-sleep-analytics-settings.webp"></video></div>

</details>

<details class="video-guide">
<summary>Date format</summary>

**Local → System → Date format**: MM/DD/YYYY, DD.MM.YYYY or YYYY-MM-DD. The e-ink header and the Status page follow your choice.

<div class="video-embed"><video src="./images/insight-date-format-on-screen.mp4" controls muted playsinline preload="none" poster="./images/insight-date-format-on-screen.webp"></video></div>

</details>

<details class="video-guide">
<summary>LEDs and night hours</summary>

Turn the LEDs on or off, set the brightness and the hours when they switch off and back on. They dim gradually before switching off. Set the same hour twice to keep them on all night.

<div class="video-embed"><video src="./images/insight-leds-settings.mp4" controls muted playsinline preload="none" poster="./images/insight-leds-settings.webp"></video></div>

</details>

---

Stuck on a step? Scan the QR code on your Altruist: the [AI setup assistant](/blog/altruist-ai-assistant-setup) walks you through every screen. A guide to moving from the previous firmware is coming next.
