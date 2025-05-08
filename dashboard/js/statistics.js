import { getFirebaseServices, isFirebaseInitialized } from '../../config/firebase.js';

// Function to initialize statistics
export async function initializeStatistics() {
    try {
        // Wait for Firebase to be initialized
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { auth, db } = getFirebaseServices();
        const user = auth.currentUser;

        if (!user) {
            console.error('No user logged in');
            return;
        }

        // Set up real-time listener for user statistics
        const unsubscribe = db.collection('userStats').doc(user.uid)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const stats = doc.data();
                    updateStatisticsUI(stats);
                } else {
                    // Initialize stats if document doesn't exist
                    initializeUserStats(user.uid);
                }
            }, (error) => {
                console.error('Error in statistics snapshot:', error);
            });

        return unsubscribe;
    } catch (error) {
        console.error('Error initializing statistics:', error);
    }
}

// Function to update statistics UI
function updateStatisticsUI(stats) {
    try {
        // Update total posts
        const postsElement = document.querySelector('.stat-card.posts .stat-info h3');
        if (postsElement && stats.totalPosts !== undefined) {
            postsElement.textContent = stats.totalPosts;
        }

        // Update total views
        const viewsElement = document.querySelector('.stat-card.views .stat-info h3');
        if (viewsElement && stats.totalViews !== undefined) {
            viewsElement.textContent = formatNumber(stats.totalViews);
        }

        // Update total comments
        const commentsElement = document.querySelector('.stat-card.comments .stat-info h3');
        if (commentsElement && stats.totalComments !== undefined) {
            commentsElement.textContent = stats.totalComments;
        }

        // Update total subscribers
        const subscribersElement = document.querySelector('.stat-card.subscribers .stat-info h3');
        if (subscribersElement && stats.totalSubscribers !== undefined) {
            subscribersElement.textContent = stats.totalSubscribers;
        }
    } catch (error) {
        console.error('Error updating statistics UI:', error);
    }
}

// Function to initialize user statistics
async function initializeUserStats(userId) {
    try {
        const { db } = getFirebaseServices();
        
        // Create initial stats document
        await db.collection('userStats').doc(userId).set({
            totalPosts: 0,
            totalViews: 0,
            totalComments: 0,
            totalSubscribers: 0,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error('Error initializing user statistics:', error);
    }
}

// Helper function to format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Initialize statistics when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeStatistics();
    } catch (error) {
        console.error('Error initializing statistics:', error);
    }
}); 