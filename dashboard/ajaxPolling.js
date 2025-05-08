// AJAX Polling setup (as fallback if WebSockets are unavailable)
document.addEventListener('DOMContentLoaded', function() {
    // Check if WebSockets are available and supported
    if (!window.WebSocket || !window.socketConnected) {
        console.log('WebSockets unavailable, using AJAX polling as fallback');
        startAjaxPolling();
    }
});

// Start AJAX polling for updates
function startAjaxPolling() {
    // Store the timestamp of the last update
    window.lastUpdateTime = new Date().toISOString();
    
    // Poll for updates every 10 seconds
    window.pollingInterval = setInterval(pollForUpdates, 10000);
}

// Function to poll for updates
function pollForUpdates() {
    // Get the user token
    const token = getUserToken();
    if (!token) {
        console.error('No user token found, cannot poll for updates');
        return;
    }
    
    // Make AJAX request for updates
    fetch('/api/updates', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            lastUpdate: window.lastUpdateTime
        })
    })
    .then(response => response.json())
    .then(data => {
        // Update the last update time
        window.lastUpdateTime = new Date().toISOString();
        
        // Process the updates
        if (data.notifications && data.notifications.length > 0) {
            data.notifications.forEach(notification => {
                handleNewNotification(notification);
            });
        }
        
        if (data.comments && data.comments.length > 0) {
            data.comments.forEach(comment => {
                handleNewComment(comment);
            });
        }
        
        if (data.postStats) {
            updatePostStats(data.postStats);
        }
        
        if (data.userActions && data.userActions.length > 0) {
            data.userActions.forEach(action => {
                handleUserAction(action);
            });
        }
        
        if (data.analytics) {
            updateAnalytics(data.analytics);
        }
    })
    .catch(error => {
        console.error('Error polling for updates:', error);
    });
}

// Stop polling when the page is hidden
document.addEventListener('visibilitychange', function() {
    if (document.hidden && window.pollingInterval) {
        clearInterval(window.pollingInterval);
    } else if (!document.hidden && !window.pollingInterval && !window.WebSocket) {
        startAjaxPolling();
    }
});

// Function to get user token
function getUserToken() {
    return localStorage.getItem('userToken');
}