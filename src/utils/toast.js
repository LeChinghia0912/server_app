export function showToast({ message, title = '', variant = 'success', delay = 3000 }) {
  const containerId = 'app-toast-container'
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    container.className = 'toast-container position-fixed top-0 end-0 p-3'
    document.body.appendChild(container)
  }

  const icons = {
    success: '✔️',
    danger: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  const wrapper = document.createElement('div')
  wrapper.className = `modern-toast toast-${variant}`
  wrapper.setAttribute('role', 'alert')
  wrapper.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${icons[variant] || '🔔'}</div>
      <div class="toast-text">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button type="button" class="toast-close">&times;</button>
    </div>
    <div class="toast-progress"></div>
  `

  container.appendChild(wrapper)

  // auto remove
  setTimeout(() => wrapper.classList.add('hide'), delay - 300)
  setTimeout(() => wrapper.remove(), delay)
  
  // close button
  wrapper.querySelector('.toast-close').onclick = () => {
    wrapper.classList.add('hide')
    setTimeout(() => wrapper.remove(), 300)
  }

  // start progress animation
  const progress = wrapper.querySelector('.toast-progress')
  progress.style.animationDuration = `${delay}ms`
}
