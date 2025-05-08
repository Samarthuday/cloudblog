// components/footer.js

export function loadFooter() {
    const footer = document.createElement("footer");
    footer.innerHTML = `
      <div class="footer-container">
        <p>&copy; ${new Date().getFullYear()} CloudBlog. All rights reserved.</p>
        <div class="footer-links">
          <a href="/pages/privacy-policy.html">Privacy Policy</a>
          <a href="/pages/contact.html">Contact</a>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
  }
  