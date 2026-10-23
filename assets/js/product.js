import { client } from '@minimal/client'
import { refreshCart, openCheckout } from '@minimal/cart'
import { initGallery } from '@minimal/gallery'

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
			await client.cart.add(
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

	client
		.track('view_item', {
			product: { title: product.title, currency: product.currency, basePriceInCents: product.priceMinInCents },
			variant: chosen() ? { id: chosen().id, priceInCents: chosen().priceInCents } : undefined
		})
		.catch(() => {})
}

export function initProductPage() {
	const root = document.querySelector('[data-product-page]')
	const json = document.querySelector('[data-product-json]')
	if (root && json) initProduct(root, JSON.parse(json.textContent))
}
