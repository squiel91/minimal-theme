// Native mobile menu, including its animated close lifecycle.

const menu = document.querySelector('[data-menu]')
let menuClosing = null

export function closeMobileMenu() {
	if (menuClosing) return menuClosing
	if (!menu?.open) return Promise.resolve()
	menu.close()
	// Native dialog display/overlay transitions keep the panel and backdrop
	// visible until their exit finishes. Wait before opening another overlay.
	menuClosing = Promise.allSettled(menu.getAnimations().map((animation) => animation.finished))
		.finally(() => { menuClosing = null })
	return menuClosing
}

export function initMenu() {
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
}
