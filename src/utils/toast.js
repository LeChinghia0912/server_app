export function showToast({ message, title = '', variant = 'success', delay = 3000 }) {
  const containerId = 'app-toast-container'
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    container.className = 'toast-container position-fixed top-0 end-0 p-3'
    document.body.appendChild(container)
  }

  const wrapper = document.createElement('div')
  wrapper.className = `toast align-items-center text-bg-${variant} border-0`
  wrapper.setAttribute('role', 'alert')
  wrapper.setAttribute('aria-live', 'assertive')
  wrapper.setAttribute('aria-atomic', 'true')
  wrapper.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${title ? `<strong class='me-2'>${title}</strong>` : ''}${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`

  container.appendChild(wrapper)

  const Bootstrap = window.bootstrap
  if (Bootstrap && typeof Bootstrap.Toast === 'function') {
    const toast = new Bootstrap.Toast(wrapper, { delay })
    toast.show()
    wrapper.addEventListener('hidden.bs.toast', () => {
      wrapper.remove()
    })
  } else {
    // Fallback: show and auto-remove without Bootstrap JS
    wrapper.classList.add('show')
    setTimeout(() => {
      try { wrapper.classList.remove('show') } catch (_) {}
      try { wrapper.remove() } catch (_) {}
    }, delay + 300)
  }
}


