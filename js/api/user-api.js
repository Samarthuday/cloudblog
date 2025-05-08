// js/api/user-api.js

const USER_API = "https://your-api.cloudblog.com/users"; // replace with real URL

export async function fetchUserProfile(userId) {
  const res = await fetch(`${USER_API}/${userId}`);
  return res.json();
}

export async function updateUserProfile(userId, userData) {
  const res = await fetch(`${USER_API}/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
}

export async function deleteUser(userId) {
  const res = await fetch(`${USER_API}/${userId}`, { method: "DELETE" });
  return res.json();
}
