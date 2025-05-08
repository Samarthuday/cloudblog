// Create this as a new file: simplified-auth.js

document.addEventListener('DOMContentLoaded', function() {
    // Get the login form
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Simple validation
        if (email && password) {
          // Store login info in localStorage
          localStorage.setItem('userLoggedIn', 'true');
          localStorage.setItem('userEmail', email);
          
          // Show success message
          const successMsg = document.getElementById('login-success');
          if (successMsg) {
            successMsg.textContent = 'Login successful! Redirecting...';
          }
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '../dashboard/dashboard.html';
          }, 1000);
        } else {
          // Show error message
          const errorMsg = document.getElementById('login-error');
          if (errorMsg) {
            errorMsg.textContent = 'Please enter both email and password';
          }
        }
      });
    }
    
    // Check if we're on the dashboard page
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      // Check if user is logged in
      const userLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
      
      if (!userLoggedIn) {
        // Not logged in, redirect to login
        window.location.href = '../auth/login.html';
        return;
      }
      
      // User is logged in, show dashboard content
      mainContent.style.visibility = 'visible';
      
      // Update user info in dashboard
      const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
      const displayName = userEmail.split('@')[0];
      
      const userNameElement = document.querySelector('.user-profile-btn span');
      if (userNameElement) {
        userNameElement.textContent = displayName;
      }
      
      const userNameInDropdown = document.querySelector('.user-dropdown-header h3');
      if (userNameInDropdown) {
        userNameInDropdown.textContent = displayName;
      }
      
      const userEmailElement = document.querySelector('.user-dropdown-header p');
      if (userEmailElement) {
        userEmailElement.textContent = userEmail;
      }
      
      // Setup logout button
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Clear login info
          localStorage.removeItem('userLoggedIn');
          localStorage.removeItem('userEmail');
          
          // Redirect to login
          window.location.href = '../auth/login.html';
        });
      }
    }
  });