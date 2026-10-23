import { client } from '@minimal/client'
import { closeMobileMenu } from '@minimal/menu'

let wishlistProductIds = []
let shopperRequest = 0
const pendingWishlistProducts = new Set()
const shopperStatus = document.querySelector('[data-shopper-status]')

function showShopperStatus(message) {
	if (!shopperStatus) return
	shopperStatus.textContent = message
	shopperStatus.hidden = !message
}

export function renderWishlist() {
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
		const status = await client.shopper.getStatus()
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

export function initShopper() {
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
			if (button.hasAttribute('data-open-account')) await client.shopper.open()
			else if (button.hasAttribute('data-open-wishlist')) await client.wishlist.open()
			else {
				const { shopper } = await client.shopper.getStatus()
				if (!shopper) await client.shopper.open({ productId })
				else {
					const { saved, productIds } = await client.wishlist.toggle(productId)
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
}
