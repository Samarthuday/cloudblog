// Toast notification functions
export function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    showToast(toast);
}

export function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    showToast(toast);
}

function showToast(toast) {
    // Add styles to the toast
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        background: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(-20px);
    `;

    // Add specific styles for success and error toasts
    if (toast.classList.contains('success')) {
        toast.style.borderLeft = '4px solid #2ecc71';
    } else if (toast.classList.contains('error')) {
        toast.style.borderLeft = '4px solid #e74c3c';
    }

    // Style the content
    const content = toast.querySelector('.toast-content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
    `;

    // Style the icon
    const icon = toast.querySelector('i');
    icon.style.cssText = `
        font-size: 20px;
        ${toast.classList.contains('success') ? 'color: #2ecc71;' : 'color: #e74c3c;'}
    `;

    // Style the message
    const message = toast.querySelector('span');
    message.style.cssText = `
        font-size: 14px;
        color: #2c3e50;
    `;

    // Add to document
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
} 