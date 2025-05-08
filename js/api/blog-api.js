// js/api/blog-api.js

const API_URL = "https://your-api.cloudblog.com/blogs"; // replace with real URL

export async function fetchAllBlogs() {
  const res = await fetch(`${API_URL}`);
  return res.json();
}

export async function fetchBlogById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  return res.json();
}

export async function createBlog(blogData) {
  const res = await fetch(`${API_URL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(blogData),
  });
  return res.json();
}

export async function updateBlog(id, blogData) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(blogData),
  });
  return res.json();
}

export async function deleteBlog(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  return res.json();
}
