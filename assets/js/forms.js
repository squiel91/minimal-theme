import { client } from '@minimal/client'

export function initForms() {
	// The search link goes to /busqueda without JavaScript; with it, open the overlay.
	document.querySelectorAll('[data-open-search]').forEach((link) => {
		link.addEventListener('click', async (event) => {
			event.preventDefault()
			try {
				await client.search.open()
			} catch {
				window.location.href = link.href
			}
		})
	})

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
				const data = await client.mutate(
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
}
