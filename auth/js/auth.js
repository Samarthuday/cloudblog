import { getFirebaseServices, isFirebaseInitialized, isUserAuthenticated } from '../../config/firebase.js';

// Function to handle login
export async function handleLogin(email, password) {
    try {
        // Wait for Firebase to be initialized
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { auth } = getFirebaseServices();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('User logged in successfully:', userCredential.user.uid);
        window.location.href = '../dashboard/dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Function to handle signup
export async function handleSignup(email, password, displayName) {
    try {
        // Wait for Firebase to be initialized
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { auth, db } = getFirebaseServices();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update user profile
        await user.updateProfile({
            displayName: displayName,
            photoURL: '../assests/images/avatar-svgrepo-com.svg'
        });

        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            displayName: displayName,
            email: email,
            createdAt: new Date(),
            stats: {
                posts: 0,
                views: 0,
                comments: 0
            }
        });

        console.log('User signed up successfully:', user.uid);
        window.location.href = '../dashboard/dashboard.html';
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

// Function to handle password reset
export async function handlePasswordReset(email) {
    try {
        // Wait for Firebase to be initialized
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { auth } = getFirebaseServices();
        await auth.sendPasswordResetEmail(email);
        console.log('Password reset email sent successfully');
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
    }
}

// Function to handle logout
export async function handleLogout() {
    try {
        // Wait for Firebase to be initialized
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { auth } = getFirebaseServices();
        await auth.signOut();
        console.log('User logged out successfully');
        window.location.href = '../auth/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
}

// Function to check auth state and redirect if necessary
export async function checkAuthState() {
    try {
        // Wait for Firebase to be initialized
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { auth } = getFirebaseServices();
        const currentPath = window.location.pathname;

        auth.onAuthStateChanged((user) => {
            const isAuthPage = currentPath.includes('/auth/');
            
            if (user && isAuthPage) {
                // If user is signed in and on auth page, redirect to dashboard
                console.log('User is signed in, redirecting to dashboard');
                window.location.href = '../dashboard/dashboard.html';
            } else if (!user && !isAuthPage) {
                // If user is not signed in and not on auth page, redirect to login
                console.log('User is not signed in, redirecting to login');
                window.location.href = '../auth/login.html';
            }
        });
    } catch (error) {
        console.error('Error checking auth state:', error);
    }
}

// Initialize auth state check when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Auth.js - DOM Content Loaded');
    await checkAuthState();
}); 