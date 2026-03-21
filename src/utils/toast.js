/**
 * Simple Toast Notification System
 * Lightweight toast notifications for security alerts and user feedback
 */

let toastContainer = null;

function createToastContainer() {
  if (toastContainer) return toastContainer;
  
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
  document.body.appendChild(container);
  toastContainer = container;
  return container;
}

function removeToast(toastElement) {
  toastElement.style.opacity = '0';
  toastElement.style.transform = 'translateX(100%)';
  setTimeout(() => {
    if (toastElement.parentNode) {
      toastElement.parentNode.removeChild(toastElement);
    }
  }, 300);
}

export function showToast(message, type = 'info') {
  const container = createToastContainer();
  
  const toast = document.createElement('div');
  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-cyan-500';
  
  toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px] max-w-md transition-all duration-300 transform translate-x-full opacity-0`;
  toast.innerHTML = `
    <span class="font-medium">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    removeToast(toast);
  }, 3000);
}





