import { auth } from '../config/firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log("Login page initialized");
    
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (!loginForm || !errorMessage) {
        console.error("Required elements not found");
        return;
    }
    
    // Hide error message initially
    errorMessage.style.display = 'none';
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        if (loadingSpinner) {
            loadingSpinner.style.display = 'block';
        }
        errorMessage.style.display = 'none';
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful");
            
            // Redirect to dashboard
            window.location.replace('../dashboard/dashboard.html');
        } catch (error) {
            console.error("Login error:", error);
            
            // Show appropriate error message
            let message = "An error occurred during login. Please try again.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                message = "Invalid email or password";
            } else if (error.code === 'auth/too-many-requests') {
                message = "Too many failed attempts. Please try again later.";
            }
            
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        } finally {
            // Hide loading state
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        }
    });
}); 