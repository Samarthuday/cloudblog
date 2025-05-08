// components/sidebar.js

export function loadSidebar() {
    const sidebar = document.createElement("aside");
    sidebar.classList.add("sidebar");
    sidebar.innerHTML = `
      <h3>Quick Links</h3>
      <ul>
        <li><a href="/blog/create.html">New Post</a></li>
        <li><a href="/blog/index.html">All Posts</a></li>
        <li><a href="/auth/profile.html">My Profile</a></li>
        <li><a href="/admin/index.html">Admin Dashboard</a></li>
      </ul>
    `;
    const container = document.querySelector(".blog-list-container") || document.body;
    container.insertAdjacentElement("beforebegin", sidebar);
  }
  