import { client } from '@minimal/client'

const cartCount = document.querySelector('[data-cart-count]')
const cartButton = document.querySelector('[data-open-checkout]')

export async function refreshCart() {
	if (!cartCount) return
	try {
		const { quantity } = await client.cart.getQuantity()
		cartCount.textContent = quantity
		cartCount.hidden = !quantity
		cartButton?.setAttribute('aria-label', quantity ? `Carrito, ${quantity} productos` : 'Carrito')
	} catch {
		cartCount.hidden = true
	}
}

export async function openCheckout() {
	cartButton?.setAttribute('aria-busy', 'true')
	try {
		await client.checkout.open()
	} finally {
		cartButton?.removeAttribute('aria-busy')
	}
}

export function initCart() {
	refreshCart()
	window.addEventListener('tiendu:overlay-close', refreshCart)
	cartButton?.addEventListener('click', () => openCheckout())
}
