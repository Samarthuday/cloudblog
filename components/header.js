// components/header.js

export function loadHeader() {
    const header = document.createElement("header");
    header.innerHTML = `
      <div class="header-container">
        <a href="/index.html" class="logo">CloudBlog</a>
        <nav>
          <a href="/blog/index.html">Blog</a>
          <a href="/pages/about.html">About</a>
          <a href="/pages/features.html">Features</a>
          <a href="/pages/pricing.html">Pricing</a>
          <a href="/auth/profile.html">Profile</a>
        </nav>
      </div>
    `;
    document.body.prepend(header);
  }
  // This would go in your components/header.js file

document.addEventListener('DOMContentLoaded', function() {
    const header = document.getElementById('site-header');
    
    header.innerHTML = `
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <a href="index.html">
              <img src="assets/images/logo.svg" alt="CloudBlog Logo">
              <span>CloudBlog</span>
            </a>
          </div>
          
          <nav class="main-nav">
            <ul class="nav-links">
              <li><a href="index.html">Home</a></li>
              <li><a href="pages/features.html">Features</a></li>
              <li><a href="pages/pricing.html">Pricing</a></li>
              <li><a href="pages/blog.html">Blog</a></li>
              <li><a href="pages/templates.html">Templates</a></li>
              <li><a href="pages/support.html">Support</a></li>
            </ul>
          </nav>
          
          <div class="header-actions">
            <a href="auth/login.html" class="btn btn-text">Log In</a>
            <a href="auth/register.html" class="btn btn-primary">Sign Up Free</a>
          </div>
          
          <button class="mobile-menu-toggle" aria-label="Toggle menu">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </button>
        </div>
      </div>
    `;
    
    // Mobile menu toggle functionality
    const mobileMenuToggle = header.querySelector('.mobile-menu-toggle');
    const mainNav = header.querySelector('.main-nav');
    
    mobileMenuToggle.addEventListener('click', function() {
      mainNav.classList.toggle('active');
      this.classList.toggle('active');
    });
  });