import { getFirebaseServices } from '../../config/firebase.js';

// Function to handle dropdown toggle
export function setupDropdownToggle() {
    console.log('Setting up dropdown toggle...');
    const profileBtn = document.getElementById('user-profile-btn');
    const dropdown = document.getElementById('user-dropdown');
    
    if (!profileBtn || !dropdown) {
        console.error('Profile button or dropdown not found');
        console.log('Profile button:', profileBtn);
        console.log('Dropdown:', dropdown);
        return;
    }

    console.log('Found profile button and dropdown');
    
    // Toggle dropdown on button click
    profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Profile button clicked');
        dropdown.classList.toggle('show');
        
        // Rotate chevron icon
        const chevron = profileBtn.querySelector('.fa-chevron-down');
        if (chevron) {
            chevron.style.transform = dropdown.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0)';
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !dropdown.contains(e.target) && dropdown.classList.contains('show')) {
            console.log('Clicking outside, closing dropdown');
            dropdown.classList.remove('show');
            // Reset chevron icon
            const chevron = profileBtn.querySelector('.fa-chevron-down');
            if (chevron) {
                chevron.style.transform = 'rotate(0)';
            }
        }
    });

    // Handle logout button click
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Logout button clicked');
            try {
                const { auth } = getFirebaseServices();
                await auth.signOut();
                window.location.href = '../auth/login.html';
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }
}

// Function to update user profile information
async function updateUserProfile(user) {
    try {
        if (!user) {
            console.error('No user provided to updateUserProfile');
            return;
        }

        const { db } = getFirebaseServices();

        // Get user data from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data() || {};

        console.log('Updating profile for user:', user.uid);
        console.log('User data:', userData);

        // Update display name using Firestore data or fallback to Auth data
        const displayName = userData.displayName || 
                          (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : null) ||
                          user.displayName || 
                          'Anonymous';

        // Update profile elements
        const elements = {
            displayName: document.getElementById('user-display-name'),
            dropdownName: document.getElementById('dropdown-display-name'),
            dropdownEmail: document.getElementById('dropdown-email'),
            userAvatar: document.getElementById('user-avatar'),
            dropdownAvatar: document.getElementById('dropdown-avatar')
        };

        // Update text content
        if (elements.displayName) elements.displayName.textContent = displayName;
        if (elements.dropdownName) elements.dropdownName.textContent = displayName;
        if (elements.dropdownEmail) elements.dropdownEmail.textContent = user.email || 'No email';

        // Update avatar
        const avatarUrl = user.photoURL || '../../assests/images/avatar-svgrepo-com.svg';
        if (elements.userAvatar) elements.userAvatar.src = avatarUrl;
        if (elements.dropdownAvatar) elements.dropdownAvatar.src = avatarUrl;

        // Update user stats if available
        if (userData.stats) {
            const statsElements = {
                posts: document.getElementById('user-posts-count'),
                views: document.getElementById('user-views-count'),
                comments: document.getElementById('user-comments-count')
            };

            if (statsElements.posts) statsElements.posts.textContent = userData.stats.posts || 0;
            if (statsElements.views) statsElements.views.textContent = userData.stats.views || 0;
            if (statsElements.comments) statsElements.comments.textContent = userData.stats.comments || 0;
        }

        // Setup dropdown toggle after updating profile
        setupDropdownToggle();

    } catch (error) {
        console.error('Error updating user profile:', error);
        // On error, still try to update with basic user info
        const elements = {
            displayName: document.getElementById('user-display-name'),
            dropdownName: document.getElementById('dropdown-display-name'),
            dropdownEmail: document.getElementById('dropdown-email')
        };

        if (elements.displayName) elements.displayName.textContent = user.displayName || 'Anonymous';
        if (elements.dropdownName) elements.dropdownName.textContent = user.displayName || 'Anonymous';
        if (elements.dropdownEmail) elements.dropdownEmail.textContent = user.email || 'No email';
        
        // Setup dropdown toggle even if there's an error
        setupDropdownToggle();
    }
}

// Initialize user profile when Firebase is ready
function initializeUserProfile() {
    const { auth } = getFirebaseServices();
    
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User is signed in:', user.uid);
            updateUserProfile(user);
        } else {
            console.log('No user is signed in, redirecting to login...');
            window.location.href = '../auth/login.html';
        }
    });
}

// Wait for Firebase to be ready
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            const { auth } = getFirebaseServices();
            if (auth) {
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Initialize everything
async function initialize() {
    await waitForFirebase();
    initializeUserProfile();
}

// Export the functions
export { initializeUserProfile, updateUserProfile, initialize };

// Start initialization when the page loads
document.addEventListener('DOMContentLoaded', initialize);