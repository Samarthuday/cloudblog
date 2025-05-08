// Import Firebase modules
import { getFirebaseServices } from '../config/firebase.js';
import { showSuccessToast, showErrorToast } from '../notification.js';

document.addEventListener('DOMContentLoaded', function () {
    console.log("Auth.js loaded");
    initializePasswordToggle();
    setupLoginForm();
    setupRegistrationForm();
    setupPasswordReset();
    setupProfileTabs();
});

/**
 * Toggle password visibility
 */
function initializePasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const currentType = input.getAttribute('type');

            input.setAttribute('type', currentType === 'password' ? 'text' : 'password');
            this.classList.toggle('show', currentType === 'password');
        });
    });
}

/**
 * Setup registration form
 */
function setupRegistrationForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            if (typeof updatePasswordStrength === 'function') {
                updatePasswordStrength(this.value);
            }
        });
    }

    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', function () {
            const errorMsg = document.getElementById('register-error');
            errorMsg.textContent = this.value !== passwordInput.value ? 'Passwords do not match' : '';
        });
    }

    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        const errorMessage = document.getElementById('register-error');
        const successMessage = document.getElementById('register-success');
        errorMessage.textContent = '';
        successMessage.textContent = '';

        if (!name || !email || !password || !confirmPassword) {
            showError('register-error', 'All fields are required');
            return;
        }

        if (!isValidEmail(email)) {
            showError('register-error', 'Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            showError('register-error', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            showError('register-error', 'Passwords do not match');
            return;
        }

        try {
            const { auth, db } = getFirebaseServices();
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Set display name
            await userCredential.user.updateProfile({ 
                displayName: name,
                photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            });

            // Store user data in Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                uid: userCredential.user.uid,
                firstName: name,
                lastName: '',
                email: email,
                displayName: name,
                photoURL: userCredential.user.photoURL,
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                stats: {
                    totalPosts: 0,
                    totalComments: 0,
                    totalViews: 0,
                    totalLikes: 0
                },
                settings: {
                    emailNotifications: true,
                    darkMode: false
                },
                profile: {
                    bio: '',
                    location: '',
                    website: '',
                    social: {
                        twitter: '',
                        facebook: '',
                        instagram: '',
                        linkedin: ''
                    }
                }
            });

            // Create a subscribers collection for this user
            await db.collection('userSubscribers').doc(userCredential.user.uid).set({
                subscriberCount: 0,
                subscribers: []
            });

            showSuccess('register-success', 'Account created successfully!');
            
            // Check if there's a return URL in localStorage
            const returnUrl = localStorage.getItem('returnUrl');
            if (returnUrl) {
                localStorage.removeItem('returnUrl');
                window.location.href = returnUrl;
            } else {
                window.location.replace('login.html');
            }
        } catch (error) {
            console.error("Registration Error:", error.message);
            showError('register-error', `Registration failed: ${error.message}`);
        }
    });
}

/**
 * Setup login form
 */
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) {
        console.log("Login form not found - might be on a different page");
        return;
    }

    console.log("Login form found and handler attached");

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearErrors();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        console.log("Login attempt initiated");

        let isValid = true;

        if (!email) {
            showError('email-error', 'Email is required');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError('email-error', 'Please enter a valid email address');
            isValid = false;
        }

        if (!password) {
            showError('password-error', 'Password is required');
            isValid = false;
        }

        if (!isValid) return;

        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner"></span> Logging in...';

        try {
            const { auth, db } = getFirebaseServices();
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            // Update last login timestamp
            await db.collection('users').doc(userCredential.user.uid).update({
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log("Login successful");
            showSuccess('login-success', 'Login successful! Redirecting...');
            
            // Check if there's a return URL in localStorage
            const returnUrl = localStorage.getItem('returnUrl');
            if (returnUrl) {
                localStorage.removeItem('returnUrl');
                window.location.href = returnUrl;
            } else {
                // If no return URL, go to dashboard
                window.location.href = '../dashboard/dashboard.html';
            }
        } catch (error) {
            console.error("Login Error:", error);
            showError('login-error', 'Invalid email or password');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

/**
 * Setup password reset form
 */
function setupPasswordReset() {
    const resetForm = document.getElementById('reset-form');
    if (!resetForm) return;

    resetForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('reset-email').value.trim();
        const resetError = document.getElementById('reset-error');
        const resetSuccess = document.getElementById('reset-success');

        if (!email) {
            resetError.textContent = 'Please enter your email address';
            return;
        }

        try {
            const { auth } = getFirebaseServices();
            await auth.sendPasswordResetEmail(email);
            resetSuccess.textContent = 'Password reset email sent. Check your inbox.';
        } catch (error) {
            console.error('Password reset error:', error);
            resetError.textContent = error.message || 'Failed to send reset email. Please try again.';
        }
    });
}

/**
 * Setup profile tab switching
 */
function setupProfileTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const targetId = this.getAttribute('data-target');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });

            document.getElementById(targetId).style.display = 'block';
        });
    });
}

/**
 * Clear all error messages
 */
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => element.textContent = '');
}

/**
 * Show error in element
 */
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

/**
 * Show success in element
 */
function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

/**
 * Email validation helper
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to handle Firebase auth errors
function handleAuthError(error) {
    console.error('Auth error:', error);
    let errorMessage = 'An error occurred. Please try again.';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered.';
            break;
        case 'auth/invalid-email':
            errorMessage = 'Invalid email address.';
            break;
        case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled.';
            break;
        case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
        case 'auth/user-not-found':
            errorMessage = 'No account found with this email.';
            break;
        case 'auth/wrong-password':
            errorMessage = 'Incorrect password.';
            break;
    }
    
    showErrorToast(errorMessage);
}

// Register new user
export async function registerUser(email, password, displayName) {
    try {
        const { auth, db } = getFirebaseServices();
        console.log('Starting user registration...');

        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log('User account created');

        // Update profile with display name
        await userCredential.user.updateProfile({
            displayName: displayName
        });
        console.log('Profile updated with display name');

        // Create user document in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            email: email,
            displayName: displayName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'user'
        });
        console.log('User document created in Firestore');

        showSuccessToast('Registration successful! Redirecting to dashboard...');
        
        // Redirect to dashboard after successful registration
        setTimeout(() => {
            window.location.href = '/dashboard/dashboard.html';
        }, 1500);

    } catch (error) {
        handleAuthError(error);
    }
}

// Login user
export async function loginUser(email, password) {
    try {
        const { auth, db } = getFirebaseServices();
        console.log('Attempting login...');

        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // Update last login timestamp
        await db.collection('users').doc(userCredential.user.uid).update({
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('Login successful');
        showSuccessToast('Login successful! Redirecting...');
        
        // Check if there's a return URL in localStorage
        const returnUrl = localStorage.getItem('returnUrl');
        if (returnUrl) {
            localStorage.removeItem('returnUrl');
            window.location.href = returnUrl;
        } else {
            // If no return URL, go to dashboard
            window.location.href = '../dashboard/dashboard.html';
        }
    } catch (error) {
        handleAuthError(error);
    }
}

// Reset password
export async function resetPassword(email) {
    try {
        const { auth } = getFirebaseServices();
        console.log('Sending password reset email...');

        await auth.sendPasswordResetEmail(email);
        console.log('Password reset email sent');

        showSuccessToast('Password reset email sent. Please check your inbox.');

    } catch (error) {
        handleAuthError(error);
    }
}

// Logout user
export async function logoutUser() {
    try {
        const { auth } = getFirebaseServices();
        console.log('Logging out...');

        await auth.signOut();
        console.log('Logout successful');

        showSuccessToast('Logout successful! Redirecting to login page...');
        
        // Redirect to login page after successful logout
        setTimeout(() => {
            window.location.href = '/auth/login.html';
        }, 1500);

    } catch (error) {
        handleAuthError(error);
    }
}

// Get current user
export function getCurrentUser() {
    const { auth } = getFirebaseServices();
    return auth.currentUser;
}

// Check if user is logged in
export function isUserLoggedIn() {
    return getCurrentUser() !== null;
}

// Get user profile
export async function getUserProfile() {
    try {
        const { db } = getFirebaseServices();
        const user = getCurrentUser();
        
        if (!user) {
            throw new Error('No user logged in');
        }

        const userDoc = await db.collection('users').doc(user.uid).get();
        return userDoc.data();

    } catch (error) {
        handleAuthError(error);
        return null;
    }
}