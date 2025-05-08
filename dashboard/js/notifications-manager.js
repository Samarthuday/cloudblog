import { getFirebaseServices } from '../../config/firebase.js';
import { showSuccessToast, showErrorToast } from '../notification.js';

class NotificationsManager {
    constructor() {
        this.db = getFirebaseServices().db;
        this.auth = getFirebaseServices().auth;
        this.currentUser = null;
        this.seenNotifications = new Set(); // Track seen notifications
        this.initialize();
        this.setupNotificationToggle();
    }

    setupNotificationToggle() {
        const notificationToggle = document.getElementById('notification-toggle');
        const notificationsPanel = document.getElementById('notifications-panel');
        const markAllReadBtn = document.getElementById('mark-all-read');
        const viewAllLink = document.querySelector('.all-notifications a');

        if (notificationToggle && notificationsPanel) {
            // Toggle notifications panel
            notificationToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationsPanel.classList.toggle('show');
            });

            // Close panel when clicking outside
            document.addEventListener('click', (e) => {
                if (!notificationsPanel.contains(e.target) && !notificationToggle.contains(e.target)) {
                    notificationsPanel.classList.remove('show');
                }
            });

            // Mark all as read functionality
            if (markAllReadBtn) {
                markAllReadBtn.addEventListener('click', () => {
                    const unreadItems = notificationsPanel.querySelectorAll('.notification-item.unread');
                    const unreadCount = unreadItems.length;
                    
                    unreadItems.forEach(item => {
                        item.classList.remove('unread');
                    });
                    
                    // Reset notification count
                    this.updateNotificationCount(-unreadCount);
                    
                    // Show success message
                    showSuccessToast('All notifications marked as read');
                });
            }

            // View all notifications functionality
            if (viewAllLink) {
                viewAllLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Navigate to the notifications page
                    window.location.href = '/notifications.html';
                });
            }
        }
    }

    getUnreadCount() {
        const notificationList = document.querySelector('.notification-list');
        if (!notificationList) return 0;
        return notificationList.querySelectorAll('.notification-item.unread').length;
    }

    async initialize() {
        try {
            // Wait for auth state to be determined
            await new Promise((resolve, reject) => {
                const unsubscribe = this.auth.onAuthStateChanged(user => {
                    unsubscribe(); // Stop listening after first change
                    if (user) {
                        this.currentUser = user;
                        resolve();
                    } else {
                        reject(new Error('User not authenticated'));
                    }
                });
            });

            // Set up real-time listeners
            this.setupCommentListener();
            this.setupSubscriberListener();
        } catch (error) {
            console.error('Error initializing notifications:', error);
            showErrorToast('Failed to initialize notifications');
        }
    }

    setupCommentListener() {
        // First get all posts by the current user
        const postsQuery = this.db.collection('posts')
            .where('userId', '==', this.currentUser.uid);

        postsQuery.onSnapshot(postsSnapshot => {
            postsSnapshot.forEach(postDoc => {
                // For each post, listen to its comments subcollection
                const commentsQuery = postDoc.ref.collection('comments')
                    .orderBy('createdAt', 'desc')
                    .limit(50);

                commentsQuery.onSnapshot(commentsSnapshot => {
                    commentsSnapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const comment = change.doc.data();
                            // Add post title to the comment data
                            comment.postTitle = postDoc.data().title;
                            this.handleNewComment(comment);
                        }
                    });
                }, error => {
                    console.error('Error in comment listener:', error);
                    showErrorToast('Failed to listen for comments');
                });
            });
        }, error => {
            console.error('Error in posts listener:', error);
            showErrorToast('Failed to listen for posts');
        });
    }

    setupSubscriberListener() {
        // Listen for new subscribers in the top-level subscribers collection
        const subscribersQuery = this.db.collection('subscribers')
            .where('authorId', '==', this.currentUser.uid)
            .limit(50);

        // Set up the listener
        const unsubscribe = subscribersQuery.onSnapshot(
            snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const subscriber = change.doc.data();
                        // Add subscriber name if available
                        if (!subscriber.name) {
                            subscriber.name = 'Anonymous';
                        }
                        this.handleNewSubscriber(subscriber);
                    }
                });
            },
            error => {
                console.error('Error in subscriber listener:', error);
                if (error.code === 'permission-denied') {
                    console.error('Permission denied. Check Firestore rules.');
                } else if (error.code === 'failed-precondition') {
                    console.error('Query requires an index. Please create the index in Firebase Console.');
                }
                showErrorToast('Failed to listen for subscribers');
            }
        );

        // Store the unsubscribe function for cleanup
        this.unsubscribeSubscribers = unsubscribe;
    }

    handleNewComment(comment) {
        // Create a unique key for this notification
        const notificationKey = `comment-${comment.id || comment.createdAt}`;
        
        // Skip if we've already seen this notification
        if (this.seenNotifications.has(notificationKey)) {
            return;
        }
        
        // Mark as seen
        this.seenNotifications.add(notificationKey);
        
        // Update notification count
        this.updateNotificationCount(1);

        // Create notification message
        const message = `${comment.authorName} commented on your post "${comment.postTitle}"`;
        
        // Add to notifications panel
        this.addToNotificationsPanel({
            type: 'comment',
            message: message,
            icon: 'fa-comment',
            time: 'Just now'
        });

        // Show toast notification
        showSuccessToast(message);
    }

    handleNewSubscriber(subscriber) {
        // Create a unique key for this notification
        const notificationKey = `subscriber-${subscriber.id || subscriber.createdAt}`;
        
        // Skip if we've already seen this notification
        if (this.seenNotifications.has(notificationKey)) {
            return;
        }
        
        // Mark as seen
        this.seenNotifications.add(notificationKey);
        
        // Update notification count
        this.updateNotificationCount(1);

        // Create notification message
        const message = `You have a new subscriber: ${subscriber.name}`;
        
        // Add to notifications panel
        this.addToNotificationsPanel({
            type: 'subscriber',
            message: message,
            icon: 'fa-user-plus',
            time: 'Just now'
        });

        // Show toast notification
        showSuccessToast(message);
    }

    updateNotificationCount(increment) {
        const countElement = document.querySelector('.notification .count');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent) || 0;
            const newCount = Math.max(0, currentCount + increment);
            countElement.textContent = newCount;
            // Hide count if zero
            countElement.style.display = newCount > 0 ? 'inline' : 'none';
        }
    }

    addToNotificationsPanel(notification) {
        const notificationList = document.querySelector('.notification-list');
        if (!notificationList) return;

        const notificationItem = document.createElement('div');
        notificationItem.classList.add('notification-item', 'unread');
        
        notificationItem.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${notification.icon}"></i>
            </div>
            <div class="notification-content">
                <p class="notification-message">${notification.message}</p>
                <p class="notification-time">${notification.time}</p>
            </div>
        `;
        
        // Insert at the top of the list
        if (notificationList.firstChild) {
            notificationList.insertBefore(notificationItem, notificationList.firstChild);
        } else {
            notificationList.appendChild(notificationItem);
        }
    }

    // Cleanup method to unsubscribe from listeners
    cleanup() {
        if (this.unsubscribeSubscribers) {
            this.unsubscribeSubscribers();
        }
    }
}

// Initialize notifications manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NotificationsManager();
}); 