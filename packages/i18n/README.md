# `@40labs/i18n` — Core Internationalization Package

Offline-first internationalization infrastructure for 40Labs Core (Tauri v2 + React + TS strict).
- Default Locale: **Swahili (`sw`)** (Tanzanian Swahili, per PRD P0-12).
- Fallback: `sw` → `en`.
- First launch defaults to Swahili without OS auto-detection.

---

## 1. How to Add a New Translation Key

1. Identify the appropriate namespace JSON file under `src/locales/sw/` and `src/locales/en/` (e.g., `dashboard.json`, `sales.json`, `settings.json`, `common.json`).
2. Add your key in **both** Swahili (`sw`) and English (`en`) JSON files using semantic, namespaced naming:
   ```json
   "settings": {
     "appearance": {
       "theme": {
         "light": "Nuru"
       }
     }
   }
   ```
3. Run the parity check script to validate your keys:
   ```bash
   pnpm i18n:check
   ```

---

## 2. Naming Conventions

- **Namespaced & Semantic**: Keys must be structured hierarchically by domain (e.g., `settings.appearance.title`, `sales.checkout`), never literal or flat (avoid `lightTheme`).
- **Shared Words**: General UI actions (Save, Cancel, Delete, Search) live in `common.json`.
- **Interpolation**: Use `{{var}}` for dynamic values. Never use string concatenation. Keep full sentences as single keys to respect Swahili word order.

---

## 3. The "Never Translate DB Values" Rule

- **Dynamic domain values** from the database (such as category names, unit types, status codes like `pending` or `completed`) **must never** be translated directly by modifying stored strings.
- Stored database values remain language-neutral entity codes/IDs and must be mapped through translation keys in code (e.g., `t(`status.${status}`)`).

---

## 4. Glossary Reference

Please adhere to the official Tanzanian pharmacy and clinical Swahili terminology defined in [GLOSSARY.md](./GLOSSARY.md).
