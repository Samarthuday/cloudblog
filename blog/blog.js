// blog/blog.js

document.addEventListener("DOMContentLoaded", () => {
    const pathname = window.location.pathname;
  
    if (pathname.includes("index.html")) {
      loadBlogList();
    } else if (pathname.includes("view.html")) {
      loadSinglePost();
    } else if (pathname.includes("create.html")) {
      const form = document.getElementById("createPostForm");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        // Simulate save
        alert("Post created!");
        form.reset();
      });
    } else if (pathname.includes("edit.html")) {
      const form = document.getElementById("editPostForm");
      // Populate with dummy data for now
      document.getElementById("editTitle").value = "Sample Post Title";
      document.getElementById("editContent").value = "Edit the content here...";
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Post updated!");
      });
    }
  });
  
  function loadBlogList() {
    const list = document.getElementById("blogList");
    list.innerHTML = `
      <div class="blog-card">
        <h3><a href="view.html?id=1">First Blog Post</a></h3>
        <p>This is a short summary of the blog post...</p>
      </div>
    `;
  }
  
  function loadSinglePost() {
    const container = document.getElementById("blogPost");
    container.innerHTML = `
      <h2>First Blog Post</h2>
      <p>Written by <strong>Admin</strong> on April 10, 2025</p>
      <div class="post-content">
        <p>This is the full content of the blog post...</p>
      </div>
    `;
  }
  