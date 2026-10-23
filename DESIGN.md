# Design

The minimal theme: high contrast, oversized type, lots of room, and nothing
that does not earn its place. These are the rules that keep it looking like
itself when the copy, products and brand color change.

## Principles

1. **Hierarchy comes from size, not weight.** Headings are huge and
   `font-medium`; body text is regular. Never bold a whole sentence to make it
   stand out: make it bigger or give it more space.
2. **Space is the layout.** Sections breathe (`--space-section` on both sides).
   When something feels crowded, remove something before shrinking spacing.
3. **Black, white and one color.** Ink on paper for almost everything. The
   store's color (`--primary`) appears only on buttons, the cart badge, rating
   stars and the newsletter band.
4. **One loud thing per screen.** One filled button per view; everything else
   is a text link with an arrow.
5. **Lines, not boxes.** Group with thin rules (`--color-line`) and alignment.
   Cards have no borders; panels are reserved for images and the featured post.
6. **Photos carry the warmth.** The UI is neutral so product images, shot on a
   warm background, read as blocks of color.

## Tokens

Defined in `:root` at the top of `assets/theme.css`. Change them there, not in
components. The base stylesheet also holds resets and typography. Feature styles
are split into `assets/css/` (controls, layout, home, catalog, product, content,
pages and blog), with responsive rules alongside their components. The root
layout links them in order through `asset_url`; see README.md for the file map.

### Type

| Token | Size | Use |
| --- | --- | --- |
| `.display` (`--text-display`) | `clamp(3.25rem, 10vw, 9rem)`, line height 0.92, tracking −0.045em | One per page: hero, category name, error page, blog title |
| `.headline` (`--text-headline`) | `clamp(2.25rem, 5.5vw, 4.75rem)`, line height 1, tracking −0.035em | Section titles, post and page titles, newsletter |
| `.title` (`--text-title`) | `clamp(1.75rem, 3.2vw, 2.75rem)`, line height 1.05, tracking −0.025em | Product title, category rows, post titles in lists |
| `.eyebrow` | 0.75rem, uppercase, tracking 0.14em, muted | Small label above a heading |
| Body | 1rem / 1.125rem | Paragraphs; `.muted` for secondary text |

Headings use weight 500 and `text-wrap: balance`. The font is the store's own
(`store.personalization.font`), so the type scale must work with any family.

### Color

| Token | Value | Use |
| --- | --- | --- |
| `--color-ink` | `#0a0a0a` | Text, rules that need weight, active states |
| `--color-paper` | `#ffffff` | Page background |
| `--color-muted` | `#6b6b6b` | Secondary text, eyebrows, inactive nav |
| `--color-line` | `#e5e5e5` | Dividers and control borders |
| `--color-surface` | `#f2f1ee` | Image backgrounds, placeholders, featured post without cover |
| `--primary` / `--on-primary` | From the store | Buttons, cart badge, stars, newsletter band |

### Spacing and width

- `--space-section`: vertical room on each side of a homepage section
  (`clamp(3.5rem, 7vw, 6.5rem)`), applied by `.section`. Two adjacent sections add up.
- `.wrap`: page container, max 90rem (`--page-width`) with responsive gutters
  (`--gutter`). Every page sets its own width with it.
- Long-form text (`.rich-text`) is capped at 68 characters per line.
- Breakpoints: 640px, 768px, 1024px and 1280px, mobile first.

### Rounding

Controls and panels follow `store.personalization.rounding` (`none`, `sm`,
`md`, `lg`) through `--radius-controls` and `--radius-panels`, set in
`routes/+layout.liquid`. `none` suits this theme best: square corners match
the type and the rules.

## Components

| Piece | Where | Notes |
| --- | --- | --- |
| Button | `.btn .btn--primary` (+ `--lg`, `--xl`, `--full`) | `--xl` is 56px tall. One filled button per view. |
| Text link with arrow | `.arrow-link` + `lib/icons/arrow-right` | Underline on hover, arrow nudges right. The default secondary action. |
| Section header | `lib/section-header.liquid` | Eyebrow + headline left, optional link right. |
| Product card | `lib/product-card.liquid` | 4:5 image on `--color-surface`, title, price. No border. "Agotado" label top left. |
| Product grid | `lib/product-grid.liquid` | 2 / 3 / 4 columns, "load more" with JS, page links without it, empty state. |
| Rich text | `.rich-text` | Merchant HTML in posts and pages. |

## Pages

- **Home:** text-only hero, featured products, split image and text,
  categories as a big text list, benefits, blog (latest post featured), then
  the newsletter band and footer on every page.
- **Category and all products:** `text-display` title, product count and sort
  bar between rules, grid.
- **Product:** gallery (7/12) and details (5/12). Options as outlined chips or
  a dropdown, quantity stepper next to a full-width button, collapsible
  description and specifications, reviews with a large average, related
  products.
- **Blog:** list with date, title and excerpt between rules. **Post:** centered
  column, wide cover, `rich-text` body, more posts after it.
- **Static page:** title on the left (sticky on desktop), text on the right.
- **Error:** `text-display` message with a way back.

## Images

Products, posts and the homepage split image follow one art direction so the
store reads as one brand. Full prompts are in `seed/images.md` of the
`headless-minimal` template.

- **Background:** warm greige plaster wall (around `#CBBFAE`), never white,
  so photos stand out against the white page.
- **Surface:** pale oak for objects, warm gray microcement for furniture.
- **Light:** soft window light from the left, soft shadows to the right.
- **Camera:** eye level, about 15° down, 50 mm, subject centered with room.
- **Grading:** sand, oat, stone, clay, charcoal; low saturation, matte, light
  grain. No text, logos, people or hands.

| Use | Ratio |
| --- | --- |
| Product photos, homepage split | 4:5 |
| Blog covers | 4:3 (cropped to 16:9 on the post page; keep the subject centered) |
| Images inside posts | 3:2 |

Color variants of a product should share the exact same framing: the product
page swaps the photo when the shopper picks a color.

## Do and don't

- **Do** reuse `.display`, `.headline`, `.title` and `.eyebrow` instead of new
  sizes.
- **Do** keep one filled button per view and use arrow links for the rest.
- **Do** check every change at 390px wide: no horizontal scroll, ever.
- **Don't** add borders around cards, shadows (except the floating WhatsApp
  button and gallery arrows) or gradients.
- **Don't** use `--primary` for text or large areas other than the newsletter
  band.
- **Don't** bold body copy or use more than one weight per heading.
