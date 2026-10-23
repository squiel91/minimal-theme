// Product gallery with arrow, thumbnail and keyboard navigation.

// Scroll-snap gallery with arrows and thumbnails. Returns focusUrl(url) for variant images.
export function initGallery(root) {
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
