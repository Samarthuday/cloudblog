import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, onSnapshot, query, where, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "Replace with your API Key",
  authDomain: "cloudblog-12cb8.firebaseapp.com",
  projectId: "cloudblog-12cb8",
  storageBucket: "cloudblog-12cb8.appspot.com",
  messagingSenderId: "632917907509",
  appId: "1:632917907509:web:35791d6861771bd3fc93cc",
  measurementId: "G-4DFB318NC2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, user => {
    if (user) {
      console.log('User is signed in:', user.uid);
      initializeRealTimeUpdates(user.uid);
      updateUserInterface(user);
    } else {
      console.log('User is not signed in. Redirecting to login page...');
      window.location.href = '../auth/login.html';
    }
  });
});

function initializeRealTimeUpdates(userId) {
  listenForNotifications(userId);
  listenForPostUpdates(userId);
  listenForCommentUpdates(userId);
  listenForAnalyticsUpdates(userId);
  listenForSubscriberUpdates(userId);
}

function listenForNotifications(userId) {
  const q = query(collection(db, 'notifications'), where('recipientId', '==', userId), where('read', '==', false), orderBy('createdAt', 'desc'));
  onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const notification = { ...change.doc.data(), id: change.doc.id };
        handleNewNotification(notification);
      }
    });
  });
}

function listenForPostUpdates(userId) {
  const q = query(collection(db, 'posts'), where('authorId', '==', userId));
  onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      const post = { ...change.doc.data(), id: change.doc.id };
      if (change.type === 'added') addPostToUI(post);
      if (change.type === 'modified') updatePostInUI(post);
      if (change.type === 'removed') removePostFromUI(post.id);
    });
    document.querySelector('.posts .stat-info h3').textContent = snapshot.docs.length;
  });
}

async function listenForCommentUpdates(userId) {
  const postSnap = await getDocs(query(collection(db, 'posts'), where('authorId', '==', userId)));
  const postIds = postSnap.docs.map(doc => doc.id);
  if (postIds.length === 0) return;

  const q = query(collection(db, 'comments'), where('postId', 'in', postIds), orderBy('createdAt', 'desc'));
  onSnapshot(q, snapshot => {
    let newComments = 0;
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        newComments++;
        handleNewComment({ ...change.doc.data(), id: change.doc.id });
      }
    });
    if (newComments > 0) {
      const el = document.querySelector('.comments .stat-info h3');
      el.textContent = parseInt(el.textContent) + newComments;
    }
  });
}

function listenForAnalyticsUpdates(userId) {
  const q = query(collection(db, 'analytics'), where('userId', '==', userId));
  onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'modified') {
        updateAnalytics(change.doc.data());
      }
    });
  });
}

function listenForSubscriberUpdates(userId) {
  const q = query(collection(db, 'subscribers'), where('publisherId', '==', userId));
  onSnapshot(q, snapshot => {
    document.querySelector('.subscribers .stat-info h3').textContent = snapshot.docs.length;
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const subscriber = { ...change.doc.data(), id: change.doc.id };
        handleUserAction({ type: 'new_subscriber', user: { id: subscriber.id, name: subscriber.name } });
      }
    });
  });
}

async function updateUserInterface(user) {
  const docRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const data = docSnap.data();
  document.querySelector('.user-profile-btn img').src = data.photoURL || 'https://via.placeholder.com/150';
  document.querySelector('.user-profile-btn span').textContent = data.displayName || 'User';

  document.querySelector('.user-dropdown-header img').src = data.photoURL || 'https://via.placeholder.com/150';
  document.querySelector('.user-dropdown-header h3').textContent = data.displayName || 'User';
  document.querySelector('.user-dropdown-header p').textContent = data.email || '';
}

// Add, update, delete post UI
function addPostToUI(post) {
  const list = document.querySelector('.recent-posts');
  const li = document.createElement('li');
  li.className = 'post-item';
  li.setAttribute('data-post-id', post.id);
  li.innerHTML = `
    <img src="${post.thumbnailUrl || 'https://via.placeholder.com/150'}" class="post-thumbnail">
    <div class="post-details">
      <h3 class="post-title">${post.title}</h3>
      <div class="post-meta">
        <span><i class="far fa-calendar"></i> ${formatDate(post.createdAt)}</span>
        <span><i class="far fa-eye"></i> ${post.views || 0}</span>
        <span><i class="far fa-comment"></i> ${post.commentCount || 0}</span>
      </div>
    </div>
    <div class="post-actions">
      <button onclick="editPost('${post.id}')"><i class="fas fa-pencil-alt"></i></button>
      <button class="delete" onclick="deletePost('${post.id}')"><i class="fas fa-trash"></i></button>
    </div>`;
  list.prepend(li);
  if (list.children.length > 5) list.removeChild(list.lastChild);
}

function updatePostInUI(post) {
  const li = document.querySelector(`.post-item[data-post-id="${post.id}"]`);
  if (!li) return;
  li.querySelector('.post-thumbnail').src = post.thumbnailUrl || 'https://via.placeholder.com/150';
  li.querySelector('.post-title').textContent = post.title;
  li.querySelector('.post-meta span:nth-child(2)').innerHTML = `<i class="far fa-eye"></i> ${post.views || 0}`;
  li.querySelector('.post-meta span:nth-child(3)').innerHTML = `<i class="far fa-comment"></i> ${post.commentCount || 0}`;
}

function removePostFromUI(postId) {
  const li = document.querySelector(`.post-item[data-post-id="${postId}"]`);
  if (li) li.remove();
}

function formatDate(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}, ${date.getFullYear()}`;
}

function editPost(postId) {
  window.location.href = `edit-post.html?id=${postId}`;
}

function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  deleteDoc(doc(db, 'posts', postId))
    .then(() => showToast('Post deleted successfully', 'success'))
    .catch(err => showToast('Error deleting post', 'error'));
}
