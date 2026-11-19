# Decorin

A minimal Shopify Online Store 2.0 theme, meant as a starting point.

## Structure

| Folder       | Purpose |
|--------------|---------|
| `layout/`    | Page wrappers. `theme.liquid` wraps every page (must contain `content_for_header` and `content_for_layout`); `password.liquid` is for the password page. |
| `templates/` | One JSON file per page type (home, product, collection, cart, …) listing which sections appear on it. |
| `sections/`  | Reusable, editor-configurable blocks of Liquid. Each has a `{% schema %}` defining its settings. `header-group.json` / `footer-group.json` are section groups loaded by the layout. |
| `snippets/`  | Small partials included with `{% render 'name' %}`. |
| `assets/`    | CSS, JS, images. Referenced with `{{ 'base.css' \| asset_url }}`. |
| `config/`    | Theme-wide settings (`settings_schema.json`) and their saved values (`settings_data.json`). |
| `locales/`   | Translation strings used via `{{ 'key' \| t }}`. |

## Connect to Shopify

1. Shopify admin → **Online Store → Themes → Add theme → Connect from GitHub**.
2. Pick the `dibtracog/Decorin` repo and the `main` branch.
3. Commits to `main` sync to the theme automatically (and edits in the theme editor commit back).

## Local development (optional)

```bash
npm install -g @shopify/cli
shopify theme dev --store your-store.myshopify.com
shopify theme check
```
