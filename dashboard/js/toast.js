// Toast notification functions
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Trigger reflow to enable animation
    toast.offsetHeight;

    // Add visible class for fade in
    toast.classList.add('visible');

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300); // Wait for fade out animation
    }, 3000);
}

// Helper functions for success and error toasts
function showSuccessToast(message) {
    showToast(message, 'success');
}

function showErrorToast(message) {
    showToast(message, 'error');
} 