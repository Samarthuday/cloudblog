// Register service worker for offline support and push notifications
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async function() {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });
            console.log('ServiceWorker registration successful with scope:', registration.scope);
            
            // Only try to subscribe to push notifications if registration is successful
            await subscribeToPushNotifications(registration);
        } catch (error) {
            console.log('ServiceWorker registration is not critical, continuing without it:', error);
        }
    });
}

// Subscribe to push notifications
async function subscribeToPushNotifications(registration) {
    // Check if push messaging is supported
    if (!('PushManager' in window)) {
        console.log('Push messaging is not supported');
        return;
    }
    
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission not granted');
            return;
        }
        
        // Get the subscription
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            // Create new subscription
            try {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    // Remove VAPID key for now as it's not configured
                    // applicationServerKey: urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY')
                });
            } catch (error) {
                console.log('Failed to create push subscription:', error);
                return;
            }
        }
        
        // Send the subscription to the server
        await sendSubscriptionToServer(subscription);
        
    } catch (error) {
        console.log('Error setting up push notifications:', error);
    }
}

// Send the subscription to the server
async function sendSubscriptionToServer(subscription) {
    try {
        const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getUserToken()}`
            },
            body: JSON.stringify({
                subscription: subscription.toJSON()
            })
        });
        
        const data = await response.json();
        console.log('Subscription sent to server:', data);
    } catch (error) {
        console.log('Error sending subscription to server:', error);
    }
}

// Helper function to get user token
function getUserToken() {
    // Implement your token retrieval logic here
    return localStorage.getItem('userToken') || '';
}

// Helper function to convert base64 string to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
        
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
}

// Toast notification functions
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Trigger reflow to enable animation
    toast.offsetHeight;

    // Add visible class for fade in
    toast.classList.add('visible');

    // Handle close button
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        });
    }

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300); // Wait for fade out animation
    }, 3000);
}

// Helper functions for success and error toasts
export function showSuccessToast(message) {
    showToast(message, 'success');
}

export function showErrorToast(message) {
    showToast(message, 'error');
}