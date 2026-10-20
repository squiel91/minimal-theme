# Store customization checklist

The recommended steps to turn this theme into a real store, in order. Steps
marked **Merchant Center** happen in the store admin (or through the Tiendu
MCP server); the rest are changes in the theme files. Agents: check each item
off with the merchant and verify it on the preview.

## 1. Get a preview

- [ ] Clone the store's theme repository and create a branch
      (`git switch -c personalizar`). See `README.md`.
- [ ] Push the branch and open the preview URL the push prints. Work on this
      branch until step 10.

## 2. Store identity

- [ ] **Merchant Center:** Ajustes → Negocio → General: store name, WhatsApp
      number and main email. The WhatsApp number turns on the floating button;
      the email and WhatsApp appear in the footer.
- [ ] **Merchant Center:** set the store description. It is the homepage meta
      description: one or two sentences, under 160 characters.
- [ ] **Merchant Center:** Ajustes → Tienda → Personalización: main color,
      button text color, font and rounding. The theme uses the same values as
      the checkout. `Sin redondeo` suits this theme best.

## 3. Copy

- [ ] Rewrite every homepage text in `routes/+page.liquid`: hero, featured
      title, split section, categories heading and blog heading.
- [ ] Make the benefits in `lib/sections/benefits.liquid` true: real shipping
      times, return window and payment methods. Remove any the store cannot
      promise.
- [ ] Newsletter texts and the WhatsApp message in `routes/+layout.liquid`.
- [ ] Blog heading in `routes/blog/+page.liquid` and the 404 text in
      `routes/+error.liquid`.
- [ ] Keep each text close to its original length so the layout holds.
- [ ] Replace the split section image (`image_url` in `routes/+page.liquid`)
      with a photo of the store's own products or space, 4:5, with alt text.

## 4. Catalog

- [ ] **Merchant Center:** load the real products: title, price, stock,
      description, specifications and photos (4:5, same background and light
      for all; see `DESIGN.md`).
- [ ] Give products with color options one photo per color, assigned to the
      matching variants, so the gallery follows the shopper's choice.
- [ ] Create the real categories with a short description each.
- [ ] Delete the demo products, categories and reviews.
- [ ] Optional: set `featured_handle` in `routes/+page.liquid` to a category
      with at least 4 products; otherwise the homepage shows best sellers.

## 5. Navigation and pages

- [ ] **Merchant Center:** edit the `principal` menu (header): main
      categories, all products (`/categorias/todas`), blog. Keep it to 4–6
      links.
- [ ] **Merchant Center:** edit the `footer` menu (Información column).
- [ ] **Merchant Center:** complete the three policy pages (shipping, returns,
      privacy) with the store's real terms. Replace every placeholder such as
      `[NOMBRE_DE_TU_NEGOCIO]`.
- [ ] If a policy page gets another handle, update it in
      `routes/+layout.graphql` (`shippingPolicy`, `returnsPolicy`,
      `privacyPolicy`).

## 6. Blog

- [ ] Replace the demo posts with real ones, or delete them and remove the
      blog section from `routes/+page.liquid` if the store will not have a
      blog. Also remove Blog from the `principal` menu.
- [ ] Post covers are 4:3 with the subject centered.

## 7. Homepage layout

- [ ] Review the section order in `routes/+page.liquid` and remove anything
      the store does not need.
- [ ] Check the homepage at desktop width and at 390px wide on the preview.

## 8. Selling

- [ ] **Merchant Center:** Ajustes → Negocio → Cobros: at least one payment
      method.
- [ ] **Merchant Center:** Ajustes → Negocio → Logística: shipping rules
      and/or pickup.
- [ ] Place a test order end to end on the preview with an email ending in
      `.test` (for example `prueba@tienda.test`). Previews are real stores:
      ask for the test order to be removed afterwards.
- [ ] Try search, add to cart from a product with options, and the
      newsletter form.

## 9. SEO

- [ ] **Merchant Center:** SEO title and description for the main products,
      categories and posts.
- [ ] Every product and post image has meaningful alt text.

## 10. Publish

- [ ] The last push ended with `checks: … 0 errors, 0 warnings`, and every page of the
      preview reports "No rendering warnings or errors" in its first comment.
- [ ] The store owner approved the preview.
- [ ] Merge the branch into `live` with `--no-ff` and push `live`; then delete
      the preview branch. See the Theme Framework Git workflow.
- [ ] First time only: if the theme's history doesn't come from `live` (it
      was pushed from its own repository), `live` won't fast-forward to it.
      Publish it once with a commit on top of `live` that has exactly the
      branch's files, then branch from `live` as usual:

      ```bash
      git fetch origin
      git switch -c publish origin/live
      git merge --allow-unrelated-histories --no-commit -s ours <branch>
      git read-tree -u --reset <branch>
      git commit -m "Publish Minimal"
      git push origin publish:live
      ```
- [ ] **Merchant Center:** Ajustes → Tienda → Dominios: connect the domain.
- [ ] Visit the live store on a phone: homepage, a product, add to cart,
      checkout, the WhatsApp button and a 404 page.
