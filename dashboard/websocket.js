// WebSocket connection setup
document.addEventListener('DOMContentLoaded', function() {
    // Initialize WebSocket connection
    const socket = new WebSocket('wss://your-websocket-server-url');
    
    // Connection opened
    socket.addEventListener('open', (event) => {
        console.log('Connected to WebSocket server');
        // Authenticate the connection
        socket.send(JSON.stringify({
            type: 'auth',
            token: getUserToken() // Function to get the user's auth token
        }));
    });
    
    // Listen for messages from the server
    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        
        // Handle different types of real-time updates
        switch(data.type) {
            case 'notification':
                handleNewNotification(data.payload);
                break;
            case 'comment':
                handleNewComment(data.payload);
                break;
            case 'post_stats':
                updatePostStats(data.payload);
                break;
            case 'user_action':
                handleUserAction(data.payload);
                break;
            case 'analytics':
                updateAnalytics(data.payload);
                break;
        }
    });
    
    // Connection closed
    socket.addEventListener('close', (event) => {
        console.log('Disconnected from WebSocket server');
        // Attempt to reconnect after a delay
        setTimeout(() => {
            console.log('Attempting to reconnect...');
            // Reconnection logic
        }, 3000);
    });
    
    // Handle errors
    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
    });
    
    // Function to get user token (from localStorage, sessionStorage, etc.)
    function getUserToken() {
        return localStorage.getItem('userToken');
    }
});

// Handler functions for different types of real-time updates
function handleNewNotification(notification) {
    // Update notification count
    const countElement = document.querySelector('.notification .count');
    const currentCount = parseInt(countElement.textContent);
    countElement.textContent = currentCount + 1;
    
    // Add new notification to the panel
    const notificationList = document.querySelector('.notification-list');
    const notificationItem = document.createElement('div');
    notificationItem.classList.add('notification-item', 'unread');
    
    notificationItem.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="notification-content">
            <p class="notification-message">${notification.message}</p>
            <p class="notification-time">Just now</p>
        </div>
    `;
    
    // Insert at the top of the list
    notificationList.insertBefore(notificationItem, notificationList.firstChild);
    
    // Optional: Show a toast notification
    showToast(notification.message, 'info');
}

function handleNewComment(comment) {
    // Update comment count in the stats row
    const commentCountElement = document.querySelector('.comments .stat-info h3');
    const currentCommentCount = parseInt(commentCountElement.textContent);
    commentCountElement.textContent = currentCommentCount + 1;
    
    // If the comment is for a post currently in the recent posts list, update that post's comment count
    const postItems = document.querySelectorAll('.post-item');
    postItems.forEach(item => {
        const postId = item.getAttribute('data-post-id');
        if (postId === comment.postId) {
            const commentCountSpan = item.querySelector('.post-meta span:nth-child(3)');
            const count = parseInt(commentCountSpan.textContent.split(' ')[1]) + 1;
            commentCountSpan.innerHTML = `<i class="far fa-comment"></i> ${count}`;
        }
    });
}

function updatePostStats(stats) {
    // Update the post stats in the dashboard
    if (stats.totalPosts) {
        document.querySelector('.posts .stat-info h3').textContent = stats.totalPosts;
    }
    
    if (stats.totalViews) {
        document.querySelector('.views .stat-info h3').textContent = stats.totalViews;
    }
    
    // Update specific post views if available
    if (stats.postViews) {
        const postItems = document.querySelectorAll('.post-item');
        postItems.forEach(item => {
            const postId = item.getAttribute('data-post-id');
            if (stats.postViews[postId]) {
                const viewsSpan = item.querySelector('.post-meta span:nth-child(2)');
                viewsSpan.innerHTML = `<i class="far fa-eye"></i> ${stats.postViews[postId]}`;
            }
        });
    }
}

function handleUserAction(action) {
    // Handle user actions like new subscribers, profile updates, etc.
    if (action.type === 'new_subscriber') {
        // Update subscriber count
        const subscriberCountElement = document.querySelector('.subscribers .stat-info h3');
        const currentSubscriberCount = parseInt(subscriberCountElement.textContent);
        subscriberCountElement.textContent = currentSubscriberCount + 1;
        
        // Show a notification
        showToast(`New subscriber: ${action.user.name}`, 'success');
    }
}

function updateAnalytics(analyticsData) {
    // Update the analytics chart with new data
    if (window.visitsChart && analyticsData.visits) {
        window.visitsChart.data.datasets[0].data = analyticsData.visits;
        
        if (analyticsData.uniqueVisitors) {
            window.visitsChart.data.datasets[1].data = analyticsData.uniqueVisitors;
        }
        
        window.visitsChart.update();
    }
}

// Helper function to get appropriate icon for notification type
function getNotificationIcon(type) {
    switch(type) {
        case 'comment': return 'fa-comment';
        case 'like': return 'fa-heart';
        case 'subscriber': return 'fa-user-plus';
        case 'share': return 'fa-share-alt';
        case 'mention': return 'fa-at';
        default: return 'fa-bell';
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.classList.add('toast-container');
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getToastIcon(type)}"></i>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">×</button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add show class after a brief delay (for animation)
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300); // Wait for fade out animation
    }, 5000);
    
    // Close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
}

// Helper function to get appropriate icon for toast
function getToastIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': 
        default: return 'fa-info-circle';
    }
}