# 💬 Localization & Translations

You can add a new language to the map by modifying the translation files located in `src/translate/`.

---

## 📝 Adding a New Language

1️⃣ **Create a new translation file** in `src/translate/`, e.g., `es.js`.

2️⃣ **Update `index.js`** in the same folder:

- Import your newly created translation file:

```js
import es from "./es";

export default { en, ru, es };
```

- Add the new language to the language list:

```js
export const languages = [
  { code: "en", title: "English" },
  { code: "ru", title: "Русский" },
  { code: "es", title: "Español" },
];
```

## 📏 Translating Measurements

Measurement values are located in `src/measurements/`.  
 To support multiple languages, update the relevant files in this folder.

### Files to Update

| Measurement Type         | File Name                                |
| ------------------------ | ---------------------------------------- |
| Carbon Monoxide          | `co.js`                                  |
| Background Radiation     | `gs.js`                                  |
| Humidity                 | `humidity.js`                            |
| Ammonia (NH₃)            | `nh3.js`                                 |
| Nitrogen Dioxide (NO₂)   | `no2.js`                                 |
| Noise Levels             | `noise.js`, `noiseavg.js`, `noisemax.js` |
| PM10 Particulate Matter  | `pm10.js`                                |
| PM2.5 Particulate Matter | `pm25.js`                                |
| Pressure                 | `pressure.js`                            |
| Temperature              | `temperature.js`                         |

### Example Translation Update (`humidity.js`)

To add support for **Spanish (es)**, update the `name`, `nameshort`, and `zones` properties:

```js

     name: {
       en: "Humidity",
       ru: "Влажность",
       es: "Humedad"
     },
     nameshort: {
       en: "Humidity",
       ru: "Влажность",
       es: "Humedad"
     },

     zones: [
       {
         value: 30,
         color: "#ff4d00",
         label: {
           en: "Very dry",
           ru: "Очень сухо",
           es: "Muy seco"
         }
       }
     ]
```

## 🌍 Auto-Translation with OpenAI

You can automatically translate interface strings using OpenAI's API. To enable this:

1. **Set up your API key**

   Add your OpenAI key to the `.env` file as:

   ```env
   VITE_OPENAI_KEY=your-openai-api-key
   ```

2. **Mark translatable strings**

   Use the `$t()` function in your code to mark strings for translation:

   ```js
   $t("Geolocation");
   ```

3. **Configure translation behavior**

   Modify the config in `src/scripts/translate.js`:

   - **Languages**: Add/remove target languages in the `LANGUAGES` array.
   - **Preserve specific keys**: Add keys to `PRESERVE_KEYS` to keep them even if not found in `$t()` calls.
   - **Allow identifiers to be translated**: If certain keys look like code (e.g., `Model`, `Yes`) but should still be translated, add them to the `SHORT_LIST`.

4. **Run the translation script**

   Use the following command to generate or update translation files:

   ```bash
   npm run autotranslate
   ```

   Once complete, your translations will be available in the appropriate language files in `src/translate`.

## 🌍 Translating Blog Posts (Markdown)

Blog posts can be translated into multiple languages using localized Markdown files.

### 📁 File Structure

- **English source**:

  ```
  src/blog/<slug>/index.md
  ```

- **Localized file**:
  ```
  src/blog/<slug>/index.<lang>.md
  ```
  Example:
  ```
  src/blog/my-post/index.ru.md
  ```

1. ⚙️ Setup

Before running translations, set your OpenAI API key:

```env
VITE_OPENAI_KEY=your-openai-api-key
```

2. 🚀 Run Translation Script

```bash
npm run autotranslate:md
```

🤖 What the Script Does

- Translates frontmatter fields:
  - `title`
  - `description`
  - `abstract`
- Translates the Markdown body:
  - Preserves formatting (headings, links, code blocks, etc.)
  - Best-effort accuracy depending on content complexity
- Uses a cache file to avoid re-translating unchanged content:
  ```
  src/scripts/openai-cache.json
  ```

🌐 How locale is chosen at runtime:

- UI locale `ru` loads `index.ru.md` when present
- Fallback order: exact locale → short locale → `en`
