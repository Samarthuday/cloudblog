import { getFirebaseServices, isFirebaseInitialized, isUserAuthenticated } from '../../config/firebase.js';

let isInitialCheck = true;

// Function to update user profile display
export async function updateUserProfileDisplay() {
    try {
        // Wait for Firebase to be initialized
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { auth, db } = getFirebaseServices();
        const user = auth.currentUser;

        if (!user) {
            console.log('No user is currently signed in');
            if (isInitialCheck) {
                isInitialCheck = false;
                window.location.href = '../auth/login.html';
            }
            return;
        }

        isInitialCheck = false;
        console.log('Updating profile for user:', user.uid);

        // Get additional user data from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data() || {};

        // Update all profile elements
        updateProfileElements(user, userData);
        
        // Update stats if they exist
        if (userData.stats) {
            updateUserStats(userData.stats);
        }

        console.log('User profile display updated successfully');
    } catch (error) {
        console.error('Error updating user profile display:', error);
    }
}

// Function to update all profile elements
function updateProfileElements(user, userData) {
    try {
        // Update user name elements
        const userNameElements = document.querySelectorAll('.user-profile-btn span, .user-dropdown-header h3');
        userNameElements.forEach(element => {
            element.textContent = user.displayName || 'Anonymous User';
        });

        // Update user email elements
        const userEmailElements = document.querySelectorAll('.user-dropdown-header p');
        userEmailElements.forEach(element => {
            element.textContent = user.email || '';
        });

        // Update user avatar elements
        const userAvatarElements = document.querySelectorAll('.user-profile-btn img, .user-dropdown-header img, .profile-avatar');
        userAvatarElements.forEach(element => {
            element.src = user.photoURL || '../assests/images/avatar-svgrepo-com.svg';
            element.alt = `${user.displayName || 'User'}'s Avatar`;
        });

        // Update profile info if it exists
        const profileInfo = document.querySelector('.profile-info');
        if (profileInfo) {
            const profileName = profileInfo.querySelector('h2');
            const profileEmail = profileInfo.querySelector('p');
            if (profileName) profileName.textContent = user.displayName || 'Anonymous User';
            if (profileEmail) profileEmail.textContent = user.email || '';
        }

        console.log('Profile elements updated successfully');
    } catch (error) {
        console.error('Error updating profile elements:', error);
    }
}

// Function to update user stats
function updateUserStats(stats) {
    try {
        const statsElements = {
            posts: document.querySelector('.user-stat:nth-child(1) .user-stat-value'),
            views: document.querySelector('.user-stat:nth-child(2) .user-stat-value'),
            comments: document.querySelector('.user-stat:nth-child(3) .user-stat-value')
        };

        if (stats.posts && statsElements.posts) {
            statsElements.posts.textContent = stats.posts;
        }
        if (stats.views && statsElements.views) {
            statsElements.views.textContent = formatNumber(stats.views);
        }
        if (stats.comments && statsElements.comments) {
            statsElements.comments.textContent = stats.comments;
        }

        console.log('User stats updated successfully');
    } catch (error) {
        console.error('Error updating user stats:', error);
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

// Set up real-time listeners for profile updates
export async function setupProfileListeners() {
    try {
        // Wait for Firebase to be initialized
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { auth, db } = getFirebaseServices();
        let unsubscribe = null;

        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('Auth state changed - user signed in:', user.uid);
                
                // Clean up previous listener if it exists
                if (unsubscribe) {
                    unsubscribe();
                }

                // Set up real-time listener for user document
                unsubscribe = db.collection('users').doc(user.uid)
                    .onSnapshot((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            updateProfileElements(user, userData);
                            if (userData.stats) {
                                updateUserStats(userData.stats);
                            }
                        }
                    }, error => {
                        console.error('Error in user document snapshot:', error);
                    });
            } else {
                console.log('Auth state changed - no user signed in');
                if (isInitialCheck) {
                    isInitialCheck = false;
                    window.location.href = '../auth/login.html';
                }
            }
        });

        console.log('Profile listeners set up successfully');
    } catch (error) {
        console.error('Error setting up profile listeners:', error);
    }
}

// Initialize profile updates when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Profile.js - DOM Content Loaded');
    try {
        // Check if we're on the login page
        if (window.location.pathname.includes('login.html')) {
            console.log('On login page, skipping profile initialization');
            return;
        }

        // Only proceed if Firebase is initialized and user is authenticated
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!isUserAuthenticated()) {
            console.log('User not authenticated, redirecting to login');
            window.location.href = '../auth/login.html';
            return;
        }

        await updateUserProfileDisplay();
        await setupProfileListeners();
        console.log('Profile initialization complete');
    } catch (error) {
        console.error('Error initializing profile:', error);
    }
}); 