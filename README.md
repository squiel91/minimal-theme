# Minimal (Tiendu theme)

A minimal, high-contrast storefront theme for the Tiendu Theme Framework
(engine 2): oversized type, lots of room, black and white plus the store's
color. Plain Liquid, GraphQL data files, CSS and JavaScript. No build step.

It is the Theme Framework version of the `headless-minimal` SvelteKit template
and looks and behaves the same.

- `CHECKLIST.md`: steps to turn the theme into a real store.
- `DESIGN.md`: design rules, tokens and image art direction.
- `AGENTS.md`: guide for AI agents working on the theme.

## Work on it

A store's theme is a Git repository hosted by Tiendu. Every branch is a
preview; pushing to `live` publishes.

```bash
git clone http://localhost:4500/<storeHandle>.git
cd <storeHandle>
git switch -c my-change
# edit, commit
git push -u origin my-change   # prints the preview URL
```

The password is a store API key (Merchant Center → Ajustes → Tienda →
Desarrollo y API → Claves de API). Keep it in a Git credential helper, never
in the remote URL. See the Theme Framework docs for publishing and undoing a
release.

## Routes

- `/` home (sections listed in `routes/+page.liquid`)
- `/productos` all products
- `/productos/[handle]` product with variant picker and add to cart
- `/categorias/[handle]` collection with subcategories, sort and "load more"
- `/busqueda?q=…` search results (the header search opens Tiendu's search overlay)
- `/blog`, `/blog/[handle]` blog list and post
- `/paginas/[handle]` static pages (policies)
- 404: `routes/+error.liquid`. Tiendu serves `/sitemap.xml` and `/robots.txt`.

## License

MIT. See `LICENSE`.
