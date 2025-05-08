import { getFirebaseServices } from '../config/firebase.js';

// Initialize stats listeners
let statsUnsubscribers = [];

// Chart instances and data tracking
let engagementChart = null;
let growthChart = null;
let historicalData = {
    timestamps: [],
    posts: [],
    views: [],
    comments: [],
    subscribers: []
};

// Function to initialize charts
function initializeCharts() {
    // Engagement Chart (Doughnut)
    const engagementCtx = document.getElementById('engagementChart').getContext('2d');
    engagementChart = new Chart(engagementCtx, {
        type: 'doughnut',
        data: {
            labels: ['Views', 'Comments', 'Subscribers'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(75, 192, 192, 0.8)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '60%',
            radius: '90%',
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });

    // Growth Chart (Line)
    const growthCtx = document.getElementById('growthChart').getContext('2d');
    growthChart = new Chart(growthCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Posts',
                data: [],
                borderColor: 'rgba(54, 162, 235, 1)',
                tension: 0.1,
                fill: false
            }, {
                label: 'Views',
                data: [],
                borderColor: 'rgba(255, 99, 132, 1)',
                tension: 0.1,
                fill: false
            }, {
                label: 'Comments',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1,
                fill: false
            }, {
                label: 'Subscribers',
                data: [],
                borderColor: 'rgba(153, 102, 255, 1)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to update historical data
function updateHistoricalData(stats) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    
    // Keep only the last 10 data points
    if (historicalData.timestamps.length >= 10) {
        historicalData.timestamps.shift();
        historicalData.posts.shift();
        historicalData.views.shift();
        historicalData.comments.shift();
        historicalData.subscribers.shift();
    }

    // Add new data points
    historicalData.timestamps.push(timestamp);
    historicalData.posts.push(stats.totalPosts || 0);
    historicalData.views.push(stats.totalViews || 0);
    historicalData.comments.push(stats.totalComments || 0);
    historicalData.subscribers.push(stats.subscriberCount || 0);
}

// Function to update charts
function updateCharts(stats) {
    // Update historical data
    updateHistoricalData(stats);

    if (engagementChart) {
        engagementChart.data.datasets[0].data = [
            stats.totalViews || 0,
            stats.totalComments || 0,
            stats.subscriberCount || 0
        ];
        engagementChart.update();
    }

    if (growthChart) {
        growthChart.data.labels = historicalData.timestamps;
        growthChart.data.datasets[0].data = historicalData.posts;
        growthChart.data.datasets[1].data = historicalData.views;
        growthChart.data.datasets[2].data = historicalData.comments;
        growthChart.data.datasets[3].data = historicalData.subscribers;
        growthChart.update();
    }
}

// Function to update stats in the UI
function updateStats(stats) {
    // Update main dashboard stats
    const elements = {
        posts: document.querySelector('.stat-card.posts h3'),
        views: document.querySelector('.stat-card.views h3'),
        comments: document.querySelector('.stat-card.comments h3'),
        subscribers: document.querySelector('.stat-card.subscribers h3'),
        // Update user dropdown stats
        userPosts: document.getElementById('user-posts-count'),
        userViews: document.getElementById('user-views-count'),
        userComments: document.getElementById('user-comments-count')
    };

    // Update each stat if the element exists
    if (stats.totalPosts !== undefined && elements.posts) {
        elements.posts.textContent = formatNumber(stats.totalPosts);
        elements.userPosts && (elements.userPosts.textContent = formatNumber(stats.totalPosts));
    }
    if (stats.totalViews !== undefined && elements.views) {
        elements.views.textContent = formatNumber(stats.totalViews);
        elements.userViews && (elements.userViews.textContent = formatNumber(stats.totalViews));
    }
    if (stats.totalComments !== undefined && elements.comments) {
        elements.comments.textContent = formatNumber(stats.totalComments);
        elements.userComments && (elements.userComments.textContent = formatNumber(stats.totalComments));
    }
    if (stats.subscriberCount !== undefined && elements.subscribers) {
        elements.subscribers.textContent = formatNumber(stats.subscriberCount);
    }

    // Update charts
    updateCharts(stats);
}

// Function to format numbers (e.g., 1000 -> 1K)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Setup real-time listeners for stats
async function setupStatsListeners(user) {
    if (!user) {
        console.log('Waiting for user authentication...');
        return;
    }

    const { db } = getFirebaseServices();

    try {
        // Cleanup any existing listeners
        cleanupListeners();

        // Listen to user stats
        const userStatsUnsubscribe = db.collection('users')
            .doc(user.uid)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    if (userData.stats) {
                        updateStats({
                            totalPosts: userData.stats.totalPosts || 0,
                            totalViews: userData.stats.totalViews || 0,
                            totalComments: userData.stats.totalComments || 0
                        });
                    }
                }
            });
        statsUnsubscribers.push(userStatsUnsubscribe);

        // Listen to subscribers collection
        const subscribersUnsubscribe = db.collection('subscribers')
            .where('authorId', '==', user.uid)
            .onSnapshot((snapshot) => {
                const subscriberCount = snapshot.size;
                console.log('Subscriber count:', subscriberCount); // Debug log
                updateStats({
                    subscriberCount: subscriberCount
                });
            });
        statsUnsubscribers.push(subscribersUnsubscribe);

        // Listen to total post count and aggregate views
        const postsUnsubscribe = db.collection('posts')
            .where('userId', '==', user.uid)
            .onSnapshot(async (snapshot) => {
                let totalViews = 0;
                let totalComments = 0;

                // Get all posts in parallel
                const posts = snapshot.docs;
                const postPromises = posts.map(async (postDoc) => {
                    const postData = postDoc.data();
                    totalViews += postData.views || 0;

                    // Get comments count for this post
                    const commentsSnapshot = await db.collection('posts')
                        .doc(postDoc.id)
                        .collection('comments')
                        .get();
                    totalComments += commentsSnapshot.size;
                });

                // Wait for all promises to resolve
                await Promise.all(postPromises);

                // Update stats with aggregated values
                updateStats({
                    totalPosts: posts.length,
                    totalViews: totalViews,
                    totalComments: totalComments
                });
            });
        statsUnsubscribers.push(postsUnsubscribe);

    } catch (error) {
        console.error('Error setting up stats listeners:', error);
    }
}

// Cleanup function to remove listeners
function cleanupListeners() {
    statsUnsubscribers.forEach(unsubscribe => unsubscribe());
    statsUnsubscribers = [];
}

// Initialize stats when the page loads and handle auth state changes
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    const { auth } = getFirebaseServices();
    
    // Set up auth state listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User authenticated, setting up stats listeners...');
            setupStatsListeners(user);
        } else {
            console.log('No user authenticated, cleaning up listeners...');
            cleanupListeners();
        }
    });
});

// Cleanup listeners when the page unloads
window.addEventListener('unload', cleanupListeners); 