// Storefront behavior, loaded on every page after the Store SDK.
// Each block looks for its own data-* hooks and does nothing when they are absent.
// Sections: cart and overlays, mobile menu, newsletter, sorting, "load more",
// product page (variants, price, stock, gallery, cart) and sharing.

const tiendu = () => window.Tiendu()

// ---------------------------------------------------------------------------
// Cart badge, checkout and search overlays

const cartCount = document.querySelector('[data-cart-count]')
const cartButton = document.querySelector('[data-open-checkout]')

async function refreshCart() {
	if (!cartCount) return
	try {
		const { quantity } = await tiendu().cart.getQuantity()
		cartCount.textContent = quantity
		cartCount.hidden = !quantity
		cartButton?.setAttribute('aria-label', quantity ? `Carrito, ${quantity} productos` : 'Carrito')
	} catch {
		cartCount.hidden = true
	}
}

refreshCart()

// Checkout and other overlays can change the cart: refresh the badge when one closes.
window.addEventListener('tiendu:overlay-close', refreshCart)

async function openCheckout() {
	cartButton?.setAttribute('aria-busy', 'true')
	try {
		await tiendu().checkout.open()
	} finally {
		cartButton?.removeAttribute('aria-busy')
	}
}

cartButton?.addEventListener('click', () => openCheckout())

// The search link goes to /busqueda without JavaScript; with it, open the overlay.
document.querySelectorAll('[data-open-search]').forEach((link) => {
	link.addEventListener('click', async (event) => {
		event.preventDefault()
		try {
			await tiendu().search.open()
		} catch {
			window.location.href = link.href
		}
	})
})

// ---------------------------------------------------------------------------
// Account and saved products. Delegation also handles cards loaded by the pager.

let wishlistProductIds = []
let shopperRequest = 0
const pendingWishlistProducts = new Set()
const shopperStatus = document.querySelector('[data-shopper-status]')

function showShopperStatus(message) {
	if (!shopperStatus) return
	shopperStatus.textContent = message
	shopperStatus.hidden = !message
}

function renderWishlist() {
	const count = wishlistProductIds.length
	document.querySelectorAll('[data-open-wishlist]').forEach((button) => {
		button.setAttribute('aria-label', count ? `Favoritos, ${count} productos` : 'Favoritos')
	})
	document.querySelectorAll('[data-wishlist-count]').forEach((badge) => {
		badge.textContent = count
		badge.hidden = !count
	})
	document.querySelectorAll('[data-wishlist-product]').forEach((button) => {
		const id = Number(button.dataset.wishlistProduct)
		const saved = wishlistProductIds.includes(id)
		button.setAttribute('aria-pressed', String(saved))
		button.setAttribute('aria-label', `${saved ? 'Quitar' : 'Guardar'} ${button.dataset.productTitle} ${saved ? 'de' : 'en'} favoritos`)
		button.disabled = pendingWishlistProducts.has(id)
		button.setAttribute('aria-busy', String(button.disabled))
		const label = button.querySelector('[data-wishlist-label]')
		if (label) label.textContent = saved ? 'Quitar de favoritos' : 'Guardar en favoritos'
	})
}

async function refreshShopper() {
	const request = ++shopperRequest
	try {
		const status = await tiendu().shopper.getStatus()
		if (request !== shopperRequest) return
		wishlistProductIds = status.wishlistProductIds
		const accountLabel = status.shopper?.name ? `Mi cuenta, ${status.shopper.name}` : 'Mi cuenta'
		document.querySelectorAll('[data-open-account]').forEach((account) => {
			account.setAttribute('aria-label', accountLabel)
			account.setAttribute('title', accountLabel)
		})
		renderWishlist()
	} catch {
		// Keep browsing available when the status cannot be loaded; actions can retry.
	}
}

refreshShopper()
window.addEventListener('tiendu:shopper-status', refreshShopper)
window.addEventListener('tiendu:overlay-close', refreshShopper)

document.addEventListener('click', async (event) => {
	const button = event.target.closest('[data-open-account], [data-open-wishlist], [data-wishlist-product]')
	if (!button || button.disabled) return
	const productId = Number(button.dataset.wishlistProduct)
	button.disabled = true
	button.setAttribute('aria-busy', 'true')
	showShopperStatus('')
	if (productId) {
		pendingWishlistProducts.add(productId)
		renderWishlist()
	}
	try {
		if (button.closest('[data-menu]')) await closeMobileMenu()
		if (button.hasAttribute('data-open-account')) await tiendu().shopper.open()
		else if (button.hasAttribute('data-open-wishlist')) await tiendu().wishlist.open()
		else {
			const { shopper } = await tiendu().shopper.getStatus()
			if (!shopper) await tiendu().shopper.open({ productId })
			else {
				const { saved, productIds } = await tiendu().wishlist.toggle(productId)
				++shopperRequest // Ignore reads started before this mutation completed.
				wishlistProductIds = productIds
				showShopperStatus(saved ? 'Producto guardado en favoritos.' : 'Producto quitado de favoritos.')
			}
		}
	} catch (error) {
		showShopperStatus(error instanceof Error ? error.message : String(error))
	} finally {
		button.disabled = false
		button.removeAttribute('aria-busy')
		pendingWishlistProducts.delete(productId)
		renderWishlist()
	}
})

// ---------------------------------------------------------------------------
// Mobile menu

const menu = document.querySelector('[data-menu]')
let menuClosing = null

function closeMobileMenu() {
	if (menuClosing) return menuClosing
	if (!menu?.open) return Promise.resolve()
	menu.close()
	// Native dialog display/overlay transitions keep the panel and backdrop
	// visible until their exit finishes. Wait before opening another overlay.
	menuClosing = Promise.allSettled(menu.getAnimations().map((animation) => animation.finished))
		.finally(() => { menuClosing = null })
	return menuClosing
}

if (menu) {
	const trigger = document.querySelector('[data-menu-open]')
	trigger?.addEventListener('click', async () => {
		await menuClosing
		menu.showModal()
		trigger.setAttribute('aria-expanded', 'true')
	})
	menu.addEventListener('close', () => trigger?.setAttribute('aria-expanded', 'false'))
	menu.querySelector('[data-menu-close]')?.addEventListener('click', closeMobileMenu)
	menu.addEventListener('cancel', (event) => {
		event.preventDefault()
		void closeMobileMenu()
	})
	// A click on the backdrop lands on the dialog itself.
	menu.addEventListener('click', (event) => {
		if (event.target !== menu) return
		const bounds = menu.getBoundingClientRect()
		if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) void closeMobileMenu()
	})
}

// ---------------------------------------------------------------------------
// Newsletter

document.querySelectorAll('[data-newsletter]').forEach((form) => {
	const status = form.querySelector('[data-newsletter-status]')
	const button = form.querySelector('button[type="submit"]')
	const showStatus = (message) => {
		status.textContent = message
		status.hidden = false
	}
	form.addEventListener('submit', async (event) => {
		event.preventDefault()
		const email = form.elements.email.value.trim()
		button.disabled = true
		button.textContent = 'Enviando…'
		try {
			const data = await tiendu().mutate(
				'mutation($email: String!) { subscriberCreate(email: $email) { userErrors { message } } }',
				{ email }
			)
			const errors = data?.subscriberCreate?.userErrors ?? []
			if (errors.length) throw new Error(errors[0].message)
			showStatus(form.dataset.success)
			form.reset()
		} catch (error) {
			showStatus(error instanceof Error ? error.message : String(error))
		} finally {
			button.disabled = false
			button.textContent = 'Suscribirme'
		}
	})
})

// ---------------------------------------------------------------------------
// Sorting: submit the form as soon as the select changes.

document.querySelectorAll('[data-autosubmit]').forEach((select) => {
	select.addEventListener('change', () => select.form.requestSubmit())
})

// ---------------------------------------------------------------------------
// "Load more": the pager's next link works without JavaScript; with it,
// the next pages are fetched and appended as the shopper scrolls.

const grid = document.querySelector('[data-grid]')
const nextLink = document.querySelector('[data-load-more]')
if (grid && nextLink) {
	const pager = nextLink.closest('[data-pager]')
	const sentinel = document.createElement('p')
	sentinel.className = 'loading-note'
	sentinel.setAttribute('role', 'status')
	pager.after(sentinel)
	// Keep "Anterior" when the shopper landed on a later page; otherwise the pager goes away.
	if (pager.querySelector('a:not([data-load-more])')) nextLink.remove()
	else pager.hidden = true

	let nextUrl = nextLink.href
	let loading = false
	const observer = new IntersectionObserver(
		async (entries) => {
			if (!entries.some((entry) => entry.isIntersecting) || loading || !nextUrl) return
			loading = true
			sentinel.textContent = 'Cargando más productos…'
			try {
				const response = await fetch(nextUrl)
				if (!response.ok) throw new Error(String(response.status))
				const page = new DOMParser().parseFromString(await response.text(), 'text/html')
				page.querySelectorAll('[data-grid] > *').forEach((card) => grid.append(card))
				renderWishlist()
				nextUrl = page.querySelector('[data-load-more]')?.href ?? null
				sentinel.textContent = ''
				if (!nextUrl) observer.disconnect()
			} catch {
				sentinel.textContent = ''
				observer.disconnect()
				pager.hidden = false
			} finally {
				loading = false
			}
		},
		{ rootMargin: '400px' }
	)
	observer.observe(sentinel)
}

// ---------------------------------------------------------------------------
// Product page

const productPage = document.querySelector('[data-product-page]')
const productJson = document.querySelector('[data-product-json]')
if (productPage && productJson) initProduct(productPage, JSON.parse(productJson.textContent))

function formatMoney(cents, currency) {
	if (cents == null) return 'A consultar'
	return new Intl.NumberFormat('es-UY', {
		style: 'currency',
		currency,
		minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
		maximumFractionDigits: 2
	}).format(cents / 100)
}

// Variants matching the selection so far, optionally ignoring one option.
function matchingVariants(variants, selected, ignoreOption) {
	return variants.filter((variant) =>
		variant.selectedOptions.every(({ name, value }) => {
			if (name === ignoreOption) return true
			const choice = selected[name]
			return choice === undefined || choice === value
		})
	)
}

function isValueAvailable(variants, selected, name, value) {
	return matchingVariants(variants, { ...selected, [name]: value }).length > 0
}

// Drop selections that no longer fit the other choices.
function pruneSelection(variants, selected, optionNames) {
	const result = { ...selected }
	for (const name of optionNames) {
		const choice = result[name]
		if (choice === undefined) continue
		if (!isValueAvailable(variants, { ...result, [name]: undefined }, name, choice)) delete result[name]
	}
	return result
}

// The value every variant shares, or undefined when they differ.
function shared(variants, pick) {
	const values = [...new Set(variants.map(pick))]
	return variants.length > 0 && values.length === 1 ? values[0] : undefined
}

function initProduct(root, product) {
	const variants = product.variants
	const optionNames = product.optionNames
	let selected = {}

	const chips = root.querySelectorAll('[data-option-name]')
	const selects = root.querySelectorAll('[data-option-select]')
	const priceEl = root.querySelector('[data-price]')
	const compareEl = root.querySelector('[data-compare-at]')
	const stockEl = root.querySelector('[data-stock]')
	const stockText = root.querySelector('[data-stock-text]')
	const qty = root.querySelector('[data-qty]')
	const qtyMinus = root.querySelector('[data-qty-minus]')
	const addButton = root.querySelector('[data-add-to-cart]')
	const status = root.querySelector('[data-product-status]')
	const errorDialog = document.querySelector('[data-cart-error]')
	const gallery = initGallery(root)

	const chosen = () => {
		const matching = matchingVariants(variants, selected)
		return matching.length === 1 ? matching[0] : undefined
	}

	function render() {
		const matching = matchingVariants(variants, selected)
		const variant = chosen()

		chips.forEach((chip) => {
			const { optionName: name, optionValue: value } = chip.dataset
			const available = isValueAvailable(variants, selected, name, value)
			chip.setAttribute('aria-pressed', String(selected[name] === value))
			chip.disabled = !available
		})
		selects.forEach((select) => {
			const name = select.dataset.optionSelect
			select.value = selected[name] ?? ''
			Array.from(select.options).forEach((option) => {
				if (option.value) option.disabled = !isValueAvailable(variants, selected, name, option.value)
			})
		})
		root.querySelectorAll('[data-option-selected]').forEach((label) => {
			label.textContent = selected[label.dataset.optionSelected] ?? ''
		})

		// Price: the chosen variant, a shared price, or "Desde" the lowest.
		const price = variant ? variant.priceInCents : shared(matching, (v) => v.priceInCents)
		if (price !== undefined) priceEl.textContent = formatMoney(price, product.currency)
		else {
			const prices = matching.map((v) => v.priceInCents).filter((p) => p != null)
			priceEl.textContent = prices.length
				? `Desde ${formatMoney(Math.min(...prices), product.currency)}`
				: 'No disponible'
		}
		const compareAt = shared(matching, (v) => v.compareAtPriceInCents)
		compareEl.hidden = compareAt == null
		compareEl.textContent = compareAt == null ? '' : formatMoney(compareAt, product.currency)

		// Stock, only when every matching variant agrees.
		const stock = shared(matching, (v) => v.stock)
		const agreed = matching.length > 0 && matching.every((v) => v.stock === matching[0].stock)
		stockEl.classList.toggle('is-out', agreed && stock != null && stock <= 0)
		if (!agreed) stockText.textContent = 'Seleccioná las opciones para ver el stock.'
		else if (stock == null) stockText.textContent = 'En stock'
		else if (stock <= 0) stockText.textContent = 'Temporalmente agotado'
		else stockText.textContent = `${stock} en stock`

		// Show the variant image as soon as the selection narrows to one image.
		const image = variant?.image ?? shared(matching, (v) => v.image?.url ?? null)
		const imageUrl = typeof image === 'string' ? image : image?.url
		if (imageUrl) gallery?.focusUrl(imageUrl)
	}

	function select(name, value) {
		selected = pruneSelection(variants, { ...selected, [name]: value || undefined }, optionNames)
		Object.keys(selected).forEach((key) => selected[key] === undefined && delete selected[key])
		render()
	}

	chips.forEach((chip) => {
		chip.addEventListener('click', () => {
			const { optionName: name, optionValue: value } = chip.dataset
			select(name, selected[name] === value ? undefined : value)
		})
	})
	selects.forEach((el) => el.addEventListener('change', () => select(el.dataset.optionSelect, el.value)))

	const setQty = (value) => {
		const next = Math.max(1, Number.parseInt(value, 10) || 1)
		qty.value = next
		qtyMinus.disabled = next <= 1
	}
	qtyMinus.addEventListener('click', () => setQty(Number(qty.value) - 1))
	root.querySelector('[data-qty-plus]').addEventListener('click', () => setQty(Number(qty.value) + 1))
	qty.addEventListener('change', () => setQty(qty.value))

	const showError = (message) => {
		errorDialog.querySelector('[data-cart-error-message]').textContent = message
		errorDialog.showModal()
	}

	addButton.addEventListener('click', async () => {
		const variant = chosen()
		if (!variant || !variant.available) {
			showError('Seleccioná todas las opciones disponibles.')
			return
		}
		addButton.disabled = true
		addButton.textContent = 'Agregando…'
		try {
			await tiendu().cart.add(
				{ id: variant.id, priceInCents: variant.priceInCents },
				Number(qty.value) || 1,
				{ title: product.title, currency: product.currency, basePriceInCents: product.priceMinInCents }
			)
			refreshCart()
			await openCheckout()
		} catch (error) {
			showError(error instanceof Error ? error.message : String(error))
		} finally {
			addButton.disabled = false
			addButton.textContent = 'Agregar al carrito'
		}
	})

	root.querySelector('[data-share]')?.addEventListener('click', async () => {
		const url = window.location.href
		try {
			if (navigator.share) await navigator.share({ title: document.title, text: product.title, url })
			else if (navigator.clipboard) {
				await navigator.clipboard.writeText(url)
				status.textContent = 'Enlace copiado al portapapeles.'
				status.hidden = false
			}
		} catch (error) {
			if (error?.name !== 'AbortError') {
				status.textContent = 'Copiá el enlace de la barra de direcciones para compartir.'
				status.hidden = false
			}
		}
	})

	// A single variant is already chosen.
	if (variants.length === 1) {
		variants[0].selectedOptions.forEach(({ name, value }) => (selected[name] = value))
	}
	render()

	tiendu()
		.track('view_item', {
			product: { title: product.title, currency: product.currency, basePriceInCents: product.priceMinInCents },
			variant: chosen() ? { id: chosen().id, priceInCents: chosen().priceInCents } : undefined
		})
		.catch(() => {})
}

// Scroll-snap gallery with arrows and thumbnails. Returns focusUrl(url) for variant images.
function initGallery(root) {
	const track = root.querySelector('[data-gallery-track]')
	if (!track) return null
	const slides = Array.from(track.children)
	const thumbs = Array.from(root.querySelectorAll('[data-gallery-thumb]'))
	const prev = root.querySelector('[data-gallery-prev]')
	const next = root.querySelector('[data-gallery-next]')
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

	const current = () => Math.round(track.scrollLeft / track.clientWidth)
	const goTo = (index) => {
		const bounded = Math.max(0, Math.min(slides.length - 1, index))
		track.scrollTo({ left: bounded * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' })
	}
	const update = () => {
		const index = current()
		if (prev) prev.disabled = index <= 0
		if (next) next.disabled = index >= slides.length - 1
		thumbs.forEach((thumb, i) => {
			thumb.classList.toggle('is-current', i === index)
			if (i === index) thumb.setAttribute('aria-current', 'true')
			else thumb.removeAttribute('aria-current')
		})
	}

	prev?.addEventListener('click', () => goTo(current() - 1))
	next?.addEventListener('click', () => goTo(current() + 1))
	thumbs.forEach((thumb) => thumb.addEventListener('click', () => goTo(Number(thumb.dataset.galleryThumb))))
	track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true })
	track.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowLeft') goTo(current() - 1)
		if (event.key === 'ArrowRight') goTo(current() + 1)
	})
	update()

	return {
		focusUrl(url) {
			const index = slides.findIndex((slide) => slide.dataset.imageUrl === url)
			if (index >= 0 && index !== current()) goTo(index)
		}
	}
}
