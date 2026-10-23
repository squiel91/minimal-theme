import { renderWishlist } from '@minimal/shopper'

export function initCatalog() {
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
}
