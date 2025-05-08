import { getFirebaseServices } from '../config/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

let visitsChart = null;
let chartInitialized = false;

document.addEventListener("DOMContentLoaded", function() {
  console.log("Auth check starting...");
  
  // Main content container
  const mainContent = document.getElementById("main-content");
  if (!mainContent) {
    console.error("Main content element not found");
    return;
  }
  
  // Hide main content initially
  mainContent.style.visibility = "hidden";
  
  // Add loading indicator
  const loadingElement = document.createElement("div");
  loadingElement.id = "auth-loading";
  loadingElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;
  loadingElement.innerHTML = `
    <div style="text-align: center">
      <div class="loading-spinner"></div>
      <p style="margin-top: 15px; color: #333;">Loading dashboard...</p>
    </div>
  `;
  document.body.appendChild(loadingElement);

  // Add loading spinner CSS
  if (!document.querySelector('style#loading-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'loading-spinner-style';
    style.textContent = `
      .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Get Firebase services
  const { auth, database } = getFirebaseServices();
  if (!auth || !database) {
    console.error('Firebase services not initialized');
    return;
  }

  // Listen for auth state changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('User authenticated:', user.uid);
      await handleAuthSuccess(user);
    } else {
      console.log('No user authenticated');
      handleAuthFailure();
    }
  });
});

async function handleAuthSuccess(user) {
  const mainContent = document.getElementById("main-content");
  const loadingElement = document.getElementById("auth-loading");
  
  if (mainContent) {
      mainContent.style.visibility = "visible";
  }
  
  if (loadingElement) {
    loadingElement.remove();
  }
  
  await initializeDashboard(user);
}

function handleAuthFailure() {
  const loadingElement = document.getElementById("auth-loading");
  if (loadingElement) {
    loadingElement.remove();
  }
  
  console.log("User not authenticated, redirecting to login page");
  window.location.replace("../auth/login.html");
}

async function initializeDashboard(user) {
  console.log("Initializing dashboard for user:", user.email);
  
  // Update user profile elements
  await updateUserProfile(user);
  
  // Initialize dashboard components
  setupDashboardComponents(user);
  
  // Set up real-time listeners for all dashboard data
  setupRealtimeListeners(user);
}

async function updateUserProfile(user) {
  try {
    // Get Firestore instance
    const { db } = getFirebaseServices();
    
    // Get user document from Firestore
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    // If user document doesn't exist, create it
    if (!userDoc.exists) {
      await userRef.set({
        userId: user.uid,
        displayName: user.displayName || user.email.split("@")[0],
        email: user.email,
        photoURL: user.photoURL || null,
        createdAt: new Date(),
        totalViews: 0,
        totalComments: 0,
        stats: {
          posts: 0,
          views: 0,
          comments: 0,
          subscribers: 0
        }
      });
    }
    
    const userData = userDoc.exists ? userDoc.data() : {
      displayName: user.displayName || user.email.split("@")[0],
      email: user.email,
      photoURL: user.photoURL || null
    };

    // Update the user profile button text
    const userNameElement = document.querySelector(".user-profile-btn span");
    const userNameInDropdown = document.querySelector(".user-dropdown-header h3");
    const userEmailElement = document.querySelector(".user-dropdown-header p");
    const userAvatar = document.querySelector(".user-profile-btn img");
    const userAvatarInDropdown = document.querySelector(".user-dropdown-header img");

    // Get the display name with proper fallback order:
    // 1. Firebase Auth displayName
    // 2. Firestore displayName
    // 3. Firestore firstName + lastName
    // 4. Email username
    const displayName = user.displayName || 
                       (userData?.displayName) || 
                       (userData?.firstName && userData?.lastName ? `${userData.firstName} ${userData.lastName}` : null) || 
                       user.email.split("@")[0];

    // Update all profile elements
    if (userNameElement) userNameElement.textContent = displayName;
    if (userNameInDropdown) userNameInDropdown.textContent = displayName;
    if (userEmailElement) userEmailElement.textContent = userData?.email || user.email;

    // Update avatar if user has one
    if (user.photoURL) {
      if (userAvatar) userAvatar.src = user.photoURL;
      if (userAvatarInDropdown) userAvatarInDropdown.src = user.photoURL;
    }

    // Log the update for debugging
    console.log("Updated user profile with data:", {
      authDisplayName: user.displayName,
      firestoreDisplayName: userData?.displayName,
      firstName: userData?.firstName,
      lastName: userData?.lastName,
      email: userData?.email || user.email,
      photoURL: user.photoURL
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    // Fallback to Firebase Auth data
    const displayName = user.displayName || user.email.split("@")[0];
    
    const userNameElement = document.querySelector(".user-profile-btn span");
    const userNameInDropdown = document.querySelector(".user-dropdown-header h3");
    const userEmailElement = document.querySelector(".user-dropdown-header p");
    
    if (userNameElement) userNameElement.textContent = displayName;
    if (userNameInDropdown) userNameInDropdown.textContent = displayName;
    if (userEmailElement) userEmailElement.textContent = user.email;
  }
}

function setupDashboardComponents(user) {
  console.log("Setting up dashboard components");
  
  // Initialize chart if not already initialized
  if (document.getElementById('visitsChart') && !chartInitialized) {
    if (typeof Chart !== 'undefined') {
      initializeChart();
    } else {
      console.log("Waiting for Chart.js to load...");
      window.addEventListener('load', initializeChart);
    }
  }
}

function setupRealtimeListeners(user) {
  // Set up listeners for different dashboard sections
  setupStatsListener(user);
  setupBlogStatsListener(user);
  setupPostsListener(user);
  setupCommentsListener(user);
  setupVisitsListener(user);
  setupSubscribersListener(user);
}

function setupStatsListener(user) {
  const { database } = getFirebaseServices();
  const statsRef = database.ref(`users/${user.uid}/stats`);
  
  statsRef.on('value', (snapshot) => {
    const stats = snapshot.val() || {
      posts: 0,
      views: 0,
      comments: 0
    };
    
    updateStatsCards(stats);
  });
}

function setupVisitsListener(user) {
  const { database } = getFirebaseServices();
  const visitsRef = database.ref(`users/${user.uid}/visits`);
  
  visitsRef.on('value', (snapshot) => {
    const visitsData = snapshot.val() || {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [0, 0, 0, 0, 0, 0]
    };
    
    if (visitsChart) {
      updateChartData(visitsData);
    }
  });
}

function setupPostsListener(user) {
  const { database } = getFirebaseServices();
  const postsRef = database.ref(`users/${user.uid}/posts`);
  
  postsRef.on('value', (snapshot) => {
    const posts = snapshot.val() || {};
    updatePostsList(posts);
  });
}

function setupCommentsListener(user) {
  const { database } = getFirebaseServices();
  const commentsRef = database.ref(`users/${user.uid}/comments`);
  
  commentsRef.on('value', (snapshot) => {
    const comments = snapshot.val() || {};
    updateCommentsList(comments);
  });
}

function setupBlogStatsListener(user) {
  const { database } = getFirebaseServices();
  const blogStatsRef = database.ref(`users/${user.uid}/blogStats`);
  
  blogStatsRef.on('value', (snapshot) => {
    const stats = snapshot.val() || {
      totalPosts: 0,
      totalViews: 0,
      totalComments: 0,
      totalSubscribers: 0,
      recentActivity: []
    };
    
    updateBlogStats(stats);
    updateRecentActivity(stats.recentActivity);
  });
}

function setupSubscribersListener(user) {
  const { database } = getFirebaseServices();
  const subscribersRef = database.ref(`users/${user.uid}/subscribers`);
  
  subscribersRef.on('value', (snapshot) => {
    const subscribers = snapshot.val() || {};
    const subscriberCount = Object.keys(subscribers).length;
    
    // Update subscribers count in stats
    const subscribersCountElement = document.querySelector('.stat-card.subscribers h3');
    if (subscribersCountElement) {
      subscribersCountElement.textContent = formatNumber(subscriberCount);
    }
    
    // Update subscribers list if it exists
    updateSubscribersList(subscribers);
  });
}

function updateStatsCards(stats) {
  // Update posts count
  const postsCount = document.querySelector('.stat-card.posts h3');
  if (postsCount) postsCount.textContent = stats.posts || '0';
  
  // Update views count
  const viewsCount = document.querySelector('.user-stat:nth-child(2) .user-stat-value');
  if (viewsCount) viewsCount.textContent = formatNumber(stats.views || 0);
  
  // Update comments count
  const commentsCount = document.querySelector('.user-stat:nth-child(3) .user-stat-value');
  if (commentsCount) commentsCount.textContent = stats.comments || '0';
}

function updatePostsList(posts) {
  const postsContainer = document.querySelector('.recent-posts');
  if (!postsContainer) return;
  
  // Update recent posts list
  const postsList = Object.values(posts).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  postsContainer.innerHTML = postsList.length ? postsList.map(post => `
    <div class="post-item">
      <h4>${post.title}</h4>
      <p>${new Date(post.timestamp).toLocaleDateString()}</p>
    </div>
  `).join('') : '<p>No posts yet</p>';
}

function updateCommentsList(comments) {
  const commentsContainer = document.querySelector('.recent-comments');
  if (!commentsContainer) return;
  
  // Update recent comments list
  const commentsList = Object.values(comments).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  commentsContainer.innerHTML = commentsList.length ? commentsList.map(comment => `
    <div class="comment-item">
      <p>${comment.text}</p>
      <small>${comment.author} - ${new Date(comment.timestamp).toLocaleDateString()}</small>
    </div>
  `).join('') : '<p>No comments yet</p>';
}

function updateBlogStats(stats) {
  // Update total posts
  const totalPostsElement = document.querySelector('.stat-card.posts h3');
  if (totalPostsElement) {
    totalPostsElement.textContent = formatNumber(stats.totalPosts);
  }
  
  // Update total views
  const totalViewsElement = document.querySelector('.stat-card.views h3');
  if (totalViewsElement) {
    totalViewsElement.textContent = formatNumber(stats.totalViews);
  }
  
  // Update total comments
  const totalCommentsElement = document.querySelector('.stat-card.comments h3');
  if (totalCommentsElement) {
    totalCommentsElement.textContent = formatNumber(stats.totalComments);
  }
  
  // Update engagement rate if available
  if (stats.totalPosts > 0) {
    const engagementRate = ((stats.totalComments + stats.totalViews) / stats.totalPosts).toFixed(1);
    const engagementElement = document.querySelector('.stat-card.engagement h3');
    if (engagementElement) {
      engagementElement.textContent = engagementRate;
    }
  }
}

function updateRecentActivity(activities = []) {
  const activityContainer = document.querySelector('.recent-activity');
  if (!activityContainer) return;
  
  const recentActivities = Array.isArray(activities) ? activities : [];
  const activityHTML = recentActivities.length ? recentActivities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map(activity => `
      <div class="activity-item ${activity.type}">
        <div class="activity-icon">
          ${getActivityIcon(activity.type)}
        </div>
        <div class="activity-content">
          <p>${formatActivityMessage(activity)}</p>
          <small>${formatTimestamp(activity.timestamp)}</small>
        </div>
      </div>
    `).join('') : '<p>No recent activity</p>';
  
  activityContainer.innerHTML = activityHTML;
}

function updateSubscribersList(subscribers) {
  const subscribersContainer = document.querySelector('.recent-subscribers');
  if (!subscribersContainer) return;
  
  const recentSubscribers = Object.values(subscribers)
    .sort((a, b) => b.subscribedAt - a.subscribedAt)
    .slice(0, 5);
    
  subscribersContainer.innerHTML = recentSubscribers.length ? recentSubscribers.map(sub => `
    <div class="subscriber-item">
      <img src="${sub.photoURL || '../assests/images/avatar-svgrepo-com.svg'}" alt="Subscriber avatar">
      <div class="subscriber-info">
        <h4>${sub.displayName || 'Anonymous'}</h4>
        <p>Subscribed ${formatTimestamp(sub.subscribedAt)}</p>
      </div>
    </div>
  `).join('') : '<p>No subscribers yet</p>';
}

function getActivityIcon(type) {
  const icons = {
    'post': '<i class="fas fa-file-alt"></i>',
    'comment': '<i class="fas fa-comment"></i>',
    'view': '<i class="fas fa-eye"></i>',
    'subscribe': '<i class="fas fa-user-plus"></i>',
    'like': '<i class="fas fa-heart"></i>'
  };
  return icons[type] || '<i class="fas fa-bell"></i>';
}

function formatActivityMessage(activity) {
  switch (activity.type) {
    case 'post':
      return `New blog post published: "${activity.title}"`;
    case 'comment':
      return `New comment on "${activity.postTitle}"`;
    case 'view':
      return `Someone viewed "${activity.postTitle}"`;
    case 'subscribe':
      return `New subscriber: ${activity.userName}`;
    case 'like':
      return `Someone liked "${activity.postTitle}"`;
    default:
      return activity.message || 'New activity';
  }
}

function formatTimestamp(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) { // Less than 1 minute
    return 'Just now';
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  } else if (diff < 604800000) { // Less than 1 week
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
      } else {
    return new Date(timestamp).toLocaleDateString();
  }
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function initializeChart() {
  try {
    // Destroy existing chart if it exists
    if (visitsChart) {
      visitsChart.destroy();
      visitsChart = null;
    }

      const ctx = document.getElementById('visitsChart').getContext('2d');
    visitsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
              label: 'Visits',
          data: [0, 0, 0, 0, 0, 0],
              borderColor: '#3498db',
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
        }]
        },
        options: {
          responsive: true,
        maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            }
          },
          scales: {
            y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
          }
        }
      });
    
    chartInitialized = true;
      console.log("Chart initialized successfully");
  } catch (error) {
    console.error("Error initializing chart:", error);
    chartInitialized = false;
  }
}

function updateChartData(visitsData) {
  if (!visitsChart || !chartInitialized) return;
  
  visitsChart.data.labels = visitsData.labels;
  visitsChart.data.datasets[0].data = visitsData.data;
  visitsChart.update('none'); // Update without animation for real-time updates
}