# AGENTS.md

Guide for AI agents working on this theme. Read `DESIGN.md` before changing
anything visual, and follow `CHECKLIST.md` when setting up a new store.

## What this is

A Tiendu theme for the Theme Framework (engine 2): folders of Liquid views and
GraphQL data files, served by Tiendu. There is no build step, no Tailwind and
no TypeScript: styles are plain CSS in `assets/theme.css` and `assets/css/`, and behavior is plain
JavaScript in `assets/js/`, initialized by `assets/theme.js`. Cart, checkout,
search, account and wishlist are Tiendu overlays opened through the Store SDK
(`assets/tiendu-sdk.js`).

Tiendu docs: `/llms.txt` on the docs site, then **Tiendu Theme Framework**
(routes, data files, Liquid, URLs and SEO, Git workflow, validation codes).
Store data (products, pages, menus) changes through the Merchant API or the
Tiendu MCP server, not this code.

## Your first task on a new store

Adapt the copy to the real store. It ships with copy for a fictional
home-and-objects shop. Copy lives in these files only:

| File | Copy |
| --- | --- |
| `routes/+page.liquid` | Every homepage section: each `{% render %}` call holds its texts as arguments |
| `lib/sections/benefits.liquid` | Shipping, returns and payment promises (homepage and product page) |
| `routes/+layout.liquid` | Newsletter band texts and the WhatsApp pre-filled message |
| `routes/blog/+page.liquid` | Blog page title and label |
| `routes/+error.liquid` | 404 message |

Rewrite every string in the store's voice and language (rioplatense Spanish by
default: "vos", "tenés", "elegí"), keeping lengths close to the originals so
the layout holds. Make the benefits true for the store. Then follow
`CHECKLIST.md`.

## Where things live

| Path | What |
| --- | --- |
| `config/theme.json`, `config/routes.json` | Theme name and engine; URL patterns of products, collections, pages and posts |
| `routes/+layout.liquid` + `.graphql` | Document, store theming (color, font, rounding), header, mobile menu, newsletter, footer, WhatsApp button |
| `routes/+page.liquid` + `.graphql` | Homepage: an ordered list of sections |
| `routes/**/+page.liquid` + `.graphql` | Pages. `_snippets/` holds partials for one page |
| `lib/sections/` | Homepage sections, one partial each |
| `lib/` | Shared partials: product card and grid, price, rating, date, breadcrumbs, nav link |
| `lib/icons/` | SVG icons, sized with the `px:` argument |
| `queries/` | Named queries for `{% query %}` |
| `assets/theme.css` | Design tokens in `:root`, resets, typography and base utilities |
| `assets/css/` | Controls, layout, home, catalog, product, content, pages and blog styles |
| `assets/theme.js` | Small entry point that initializes the feature modules |
| `assets/js/` | Client, cart, shopper, mobile menu, forms, catalog, product and gallery modules |
| `assets/tiendu-sdk.js` | Store SDK, as released. Don't edit it |

## Common tasks

**Change text.** See the copy table above. Product, collection, post and page
content comes from the store.

**Reorder, remove or repeat a homepage section.** Edit `routes/+page.liquid`.
Each section is one `{% render %}` block. Sections with no data render nothing.

**Add a homepage section.** Create `lib/sections/name.liquid` starting with a
one-line `{%- # … Args: … -%}` comment. Wrap it in
`<section class="wrap section">` and use `lib/section-header` for its title.
Pass its copy as arguments from `routes/+page.liquid`. Load any data it needs
in `routes/+page.graphql` with an alias (`newArrivals: products(...)`), and
pass it in: partials can't query.

**Link to all products.** Use `/categorias/todas`, the virtual collection
with every product. There is no `/productos` listing.

**Feature a collection.** Set `featured_handle` at the top of
`routes/+page.liquid`. Pick one with at least 4 products; empty shows best
sellers.

**Change the look.** Edit the tokens in `:root` in `assets/theme.css`. The
brand color, font and rounding come from Ajustes → Tienda → Personalización.

**Change component styles.** Edit the owning file in `assets/css/`; keep its
responsive rules and interaction states there. `product.css` owns the PDP,
`pages.css` static pages, `blog.css` blog cards/list/articles, and `content.css`
shared merchant rich text. All routes load the ordered `css_modules` list in the
root layout after `theme.css`, directly through `asset_url | stylesheet_tag`.
Preserve the cascade order. Shared sections and cards occur on several routes;
do not add CSS `@import` chains, a build step or duplicate rules in a new override file.

**Link to records.** Print the `url` field (`{{ product.url }}`), never a
hand-written path. Policy pages are loaded in `routes/+layout.graphql` and
their links disappear if the page doesn't exist.

**Add behavior.** Extend the relevant module in `assets/js/`, using its own
`data-*` hooks and doing nothing when they are absent. Keep `assets/theme.js`
as initialization only. If a feature needs a new module, add its name to the
`js_modules` list in `routes/+layout.liquid`; that list generates the import map
and preloads, with `asset_url` versioning on every dependency. Import it directly
as `@minimal/<name>` and call its initializer from the entry point.

Keep the import map before `tiendu_head` and every module script. Use named
imports instead of unversioned relative paths or re-export index modules.
`client.js` imports `@tiendu/sdk` and initializes one shared client. Keep SDK
options there, preserve the released SDK and avoid circular module dependencies.

**Account and favorites.** Desktop header buttons and the mobile menu's bottom
actions open the account and wishlist overlays. The menu trigger uses an icon,
and remains available even without a main menu. Close the drawer before opening
an overlay, and update both copies of the account/favorites controls together.
The two-bar menu icon is vertically centered. The native dialog slides over
240ms while its backdrop fades, including on close; reduced motion skips both.
Import `closeMobileMenu()` from `@minimal/menu` for animated closure and wait for
it before opening an overlay. Escape and backdrop clicks follow the same path.
`data-wishlist-product` buttons save a product, or open sign-in with that product
pending. Keep them outside product links. `tiendu:shopper-status` and overlay
close refresh the header and all hearts; appended cards use the same delegated
click handler and saved state. Shopper state belongs in the browser, never Liquid.

## Rules of the framework (the push checks them)

- `{{ tiendu_head }}` and `{{ tiendu_body_end }}` appear once, in
  `routes/+layout.liquid`. Set titles with `{% metadata %}`, never `<title>`.
- A top-level data key appears once per layout + page chain: use aliases.
- `@required` only on top-level fields of route data files.
- Partials receive only their arguments (plus `store`, `request`, `params`)
  and can't run `{% query %}`.
- Inline comments: every line needs its own `{%- # … -%}`.
- Query parameters a page reads must be declared as variables in its data
  file (`$page`, `$sort`, `$q`).

## Verify every change

1. Push to a preview branch, never straight to `live`.
2. The push ends with `remote: checks: <branch>: 0 errors, N warnings`; fix
   every warning it lists. No `checks:` line means the checks didn't run.
3. Open the preview. Each page starts with an HTML comment reporting render
   warnings or errors; it must say "No rendering warnings or errors."
4. Check the changed pages at desktop width and at 390px wide. Nothing may
   scroll horizontally.
5. Publish to `live` only after the store owner approves.

## Don't

- Don't push to `live` without approval, and never force-push it.
- Don't add a build step, CSS framework or icon package.
- Don't put product or content images in `assets/`; they come from the store.
- Don't place real orders when testing: use an email ending in `.test`.

## SDK initialization

SDK 2.2.0 handles `?cupon=CODE` on the first `Tiendu()` call: it removes the parameter and opens checkout with the code prefilled for the customer to confirm. `couponLinks: { enabled: false }` disables that behavior; `session: { persist: false }` keeps the shopper token in memory without localStorage. Both default to true. Set these options in `assets/js/client.js`, on its `Tiendu()` initialization; all other modules import that client. Loading the SDK alone does not initialize it.
