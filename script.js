/**
 * CloudBlog Platform - Main JavaScript
 * Handles global site functionality, animations, and interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initializeSlider();
    setupMobileMenu();
    setupSmoothScrolling();
    handleUserAuthentication();
    setupDarkMode();
});

/**
 * Testimonial Slider Functionality
 */
function initializeSlider() {
    const slider = document.querySelector('.testimonials-slider');
    if (!slider) return;

    const testimonials = Array.from(slider.querySelectorAll('.testimonial'));
    const prevBtn = document.querySelector('.slider-controls .prev');
    const nextBtn = document.querySelector('.slider-controls .next');
    const pagination = document.querySelector('.pagination');
    
    let currentIndex = 0;

    // Set initial position
    testimonials.forEach((testimonial, index) => {
        testimonial.style.transform = `translateX(${index * 100}%)`;
    });

    // Create pagination dots
    pagination.innerHTML = ''; // Clear existing dots
    testimonials.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        pagination.appendChild(dot);
    });

    // Move to specific slide
    function goToSlide(index) {
        currentIndex = index;
        testimonials.forEach((testimonial, i) => {
            testimonial.style.transform = `translateX(${(i - currentIndex) * 100}%)`;
        });
        updateDots();
    }

    // Update pagination dots
    function updateDots() {
        const dots = pagination.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    // Event listeners for controls
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
            goToSlide(currentIndex);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % testimonials.length;
            goToSlide(currentIndex);
        });
    }

    // Auto-slide functionality
    let slideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % testimonials.length;
        goToSlide(currentIndex);
    }, 5000);

    // Pause auto-slide on hover
    slider.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });

    slider.addEventListener('mouseleave', () => {
        slideInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % testimonials.length;
            goToSlide(currentIndex);
        }, 5000);
    });
}

/**
 * Mobile Menu Toggle
 */
function setupMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!menuToggle || !navMenu) return;

    menuToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        const isOpen = navMenu.classList.contains('active');
        menuToggle.innerHTML = isOpen ? '✕' : '☰';
        menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.mobile-menu-toggle') && 
            !event.target.closest('.nav-menu') && 
            navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            menuToggle.innerHTML = '☰';
            menuToggle.setAttribute('aria-expanded', false);
        }
    });
}

/**
 * Smooth Scrolling for Anchor Links
 */
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Adjust for header height
                    behavior: 'smooth'
                });
                
                // Update URL but don't scroll
                history.pushState(null, null, targetId);
            }
        });
    });
}

/**
 * Handle User Authentication Status
 */
function handleUserAuthentication() {
    // Check if user is logged in (via localStorage token or cookie)
    const isLoggedIn = localStorage.getItem('cloudBlogToken') || getCookie('cloudBlogSession');
    
    if (isLoggedIn) {
        // Update UI for logged-in users
        updateUIForLoggedInUser();
    }
    
    // Listen for authentication events
    window.addEventListener('authEvent', function(e) {
        if (e.detail.action === 'login') {
            updateUIForLoggedInUser();
        } else if (e.detail.action === 'logout') {
            updateUIForLoggedOutUser();
        }
    });
}

/**
 * Update UI elements for logged-in users
 */
function updateUIForLoggedInUser() {
    const authButtons = document.querySelector('.nav-buttons');
    if (!authButtons) return;
    
    // Get user data
    const userData = getUserData();
    
    // Replace login/register buttons with user menu
    authButtons.innerHTML = `
        <div class="user-menu-container">
            <button class="user-menu-trigger">
                <span class="user-name">${userData.name || 'User'}</span>
                <img src="${userData.avatar || 'assets/images/icons/user-default.svg'}" alt="Profile" class="user-avatar">
            </button>
            <div class="user-dropdown">
                <a href="blog/index.html">My Blogs</a>
                <a href="blog/create.html">Create New Post</a>
                <a href="auth/profile.html">Profile Settings</a>
                <button class="logout-btn">Log Out</button>
            </div>
        </div>
    `;
    
    // Set up dropdown toggle
    const userMenuTrigger = document.querySelector('.user-menu-trigger');
    const userDropdown = document.querySelector('.user-dropdown');
    
    if (userMenuTrigger && userDropdown) {
        userMenuTrigger.addEventListener('click', function() {
            userDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.user-menu-container')) {
                userDropdown.classList.remove('active');
            }
        });
        
        // Handle logout
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                logoutUser();
            });
        }
    }
}

/**
 * Update UI elements for logged-out users
 */
function updateUIForLoggedOutUser() {
    const authButtons = document.querySelector('.nav-buttons');
    if (!authButtons) return;
    
    authButtons.innerHTML = `
        <a href="auth/login.html" class="btn btn-secondary">Log In</a>
        <a href="auth/register.html" class="btn btn-primary">Sign Up</a>
    `;
}

/**
 * Get current user data from storage
 */
function getUserData() {
    const userDataStr = localStorage.getItem('cloudBlogUserData');
    if (userDataStr) {
        try {
            return JSON.parse(userDataStr);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    return { name: 'User' };
}

/**
 * Log out current user
 */
function logoutUser() {
    // Clear auth tokens
    localStorage.removeItem('cloudBlogToken');
    document.cookie = 'cloudBlogSession=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Trigger auth event
    window.dispatchEvent(new CustomEvent('authEvent', {
        detail: { action: 'logout' }
    }));
    
    // Redirect to home page
    window.location.href = '/';
}

/**
 * Helper function to get cookie value by name
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

/**
 * Feature detection and progressive enhancement
 */
function setupFeatureDetection() {
    // Check for modern CSS features
    const supportsFlex = CSS.supports('display', 'flex');
    const supportsGrid = CSS.supports('display', 'grid');
    
    if (!supportsFlex) {
        document.body.classList.add('no-flexbox');
    }
    
    if (!supportsGrid) {
        document.body.classList.add('no-grid');
    }
    
    // Check for intersection observer support
    if ('IntersectionObserver' in window) {
        setupLazyLoading();
    } else {
        // Load all images immediately as fallback
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            img.setAttribute('loading', 'eager');
        });
    }
}

/**
 * Setup lazy loading for images
 */
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Run feature detection on load
window.addEventListener('load', setupFeatureDetection);

// Add this to your script.js file or at the end of your HTML

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuToggle && mainNav) {
      mobileMenuToggle.addEventListener('click', function() {
        mainNav.classList.toggle('active');
        this.classList.toggle('active');
        
        // Toggle aria-expanded attribute
        const expanded = this.getAttribute('aria-expanded') === 'true' || false;
        this.setAttribute('aria-expanded', !expanded);
      });
    }
    
    // Handle mobile dropdown toggles
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    // Only apply this to mobile view
    const isMobile = window.matchMedia('(max-width: 991px)');
    
    function setupMobileDropdowns(mobile) {
      if (mobile.matches) {
        // It's mobile view
        dropdownToggles.forEach(toggle => {
          toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.parentElement;
            
            // Close other open dropdowns
            document.querySelectorAll('.dropdown').forEach(dropdown => {
              if (dropdown !== parent && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
              }
            });
            
            // Toggle current dropdown
            parent.classList.toggle('active');
          });
        });
      } else {
        // It's desktop view - remove click events
        dropdownToggles.forEach(toggle => {
          toggle.parentElement.classList.remove('active');
        });
      }
    }
    
    // Initial setup
    setupMobileDropdowns(isMobile);
    
    // Re-check on window resize
    isMobile.addEventListener('change', setupMobileDropdowns);
    
    // Video fallback
    const videoElement = document.querySelector('.video-container video');
    const fallbackImage = document.querySelector('.video-fallback');
    
    if (videoElement && fallbackImage) {
      videoElement.addEventListener('error', function() {
        videoElement.style.display = 'none';
        fallbackImage.style.display = 'block';
      });
    }
  });

// Dark mode functionality
function setupDarkMode() {
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    
    if (!themeToggle || !themeIcon) return;
    
    // Check for saved theme preference or use system preference
    const currentTheme = localStorage.getItem('blog-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('blog-theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('blog-theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    // Function to update theme icon
    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.innerHTML = '<path fill-rule="evenodd" clip-rule="evenodd" d="M12.1 22c-5.5 0-10-4.5-10-10s4.5-10 10-10c1.8 0 3.5.5 5 1.3-3.2 1-5.5 4-5.5 7.5s2.3 6.5 5.5 7.5c-1.5.8-3.2 1.3-5 1.3zm-7-10c0 3.9 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7-7 3.1-7 7z"/>';
        } else {
            themeIcon.innerHTML = '<path fill-rule="evenodd" clip-rule="evenodd" d="M12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zm0 1.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm12-7a.8.8 0 0 1-.8.8h-2.4a.8.8 0 0 1 0-1.6h2.4a.8.8 0 0 1 .8.8zM4 12a.8.8 0 0 1-.8.8H.8a.8.8 0 0 1 0-1.6h2.5a.8.8 0 0 1 .8.8zm16.5-8.5a.8.8 0 0 1 0 1.1l-1.8 1.8a.8.8 0 0 1-1.1-1.1l1.8-1.8a.8.8 0 0 1 1.1 0zM6.3 17.7a.8.8 0 0 1 0 1.1l-1.8 1.8a.8.8 0 0 1-1.1-1.1l1.8-1.8a.8.8 0 0 1 1.1 0zM12 0a.8.8 0 0 1 .8.8v2.5a.8.8 0 0 1-1.6 0V.8A.8.8 0 0 1 12 0zm0 20a.8.8 0 0 1 .8.8v2.4a.8.8 0 0 1-1.6 0v-2.4a.8.8 0 0 1 .8-.8zM3.5 3.5a.8.8 0 0 1 1.1 0l1.8 1.8a.8.8 0 1 1-1.1 1.1L3.5 4.6a.8.8 0 0 1 0-1.1zm14.2 14.2a.8.8 0 0 1 1.1 0l1.8 1.8a.8.8 0 0 1-1.1 1.1l-1.8-1.8a.8.8 0 0 1 0-1.1z"/>';
        }
    }
}