import { getFirebaseServices } from '../config/firebase.js';

// Get post ID from URL and validate it
const urlParams = new URLSearchParams(window.location.search);
const rawPostId = urlParams.get('id');
console.log('Raw post ID from URL:', rawPostId);

const postId = rawPostId ? decodeURIComponent(rawPostId) : null;
console.log('Decoded post ID:', postId);

// Initialize variables
let currentUser = null;
const { auth, db } = getFirebaseServices();

// Initialize auth state listener
auth.onAuthStateChanged((user) => {
    currentUser = user;
    console.log('Auth state changed. Current user:', user ? user.uid : 'none');
});

// Load post content
async function loadPost() {
    try {
        console.log("Inside loadPost. Attempting to load postId:", postId);
        
        if (!postId) {
            console.error("No post ID provided in URL");
            document.querySelector('.post-detail').innerHTML = `
                <div class="error-message">
                    <h2>Invalid Post ID</h2>
                    <p>No post ID was provided.</p>
                    <a href="/blog.html" class="back-link">Back to Blog</a>
                </div>`;
            return;
        }

        // Get the post document
        const postRef = db.collection('posts').doc(postId);
        console.log("Fetching post document with ID:", postId);
        
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            console.error('Post not found:', postId);
            document.querySelector('.post-detail').innerHTML = `
                <div class="error-message">
                    <h2>Post Not Found</h2>
                    <p>The post you're looking for doesn't exist or has been removed.</p>
                    <p>Post ID attempted: ${postId}</p>
                    <a href="/blog.html" class="back-link">Back to Blog</a>
                </div>`;
            return;
        }

        const post = postDoc.data();
        console.log("Post data retrieved:", { 
            id: postId, 
            title: post.title,
            status: post.status,
            authorId: post.userId
        });
        
        // Verify it's a published post
        if (post.status !== 'published' && (!currentUser || currentUser.uid !== post.userId)) {
            console.error('Attempt to access unpublished post:', postId);
            document.querySelector('.post-detail').innerHTML = `
                <div class="error-message">
                    <h2>Post Not Available</h2>
                    <p>This post is not currently available for viewing.</p>
                    <a href="/blog.html" class="back-link">Back to Blog</a>
                </div>`;
            return;
        }

        const postDetail = document.querySelector('.post-detail');
        
        // Format date
        const publishDate = post.createdAt ? 
            new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 
            'Unknown date';

        // Update post content
        postDetail.innerHTML = `
            <header class="post-header">
                <div class="post-header-content">
                    <h1 class="post-title">${escapeHtml(post.title)}</h1>
                    <div class="post-meta">
                        <div class="post-author">
                            <img src="${post.authorPhotoURL || '../assests/images/avatar-svgrepo-com.svg'}" 
                                 alt="${escapeHtml(post.authorName)}" 
                                 class="author-avatar">
                            <div class="author-info">
                                <span class="author-name">${escapeHtml(post.authorName)}</span>
                                <span class="post-date">${publishDate}</span>
                            </div>
                        </div>
                        <div class="post-stats">
                            <button id="subscribe-btn" class="subscribe-btn">Subscribe</button>
                            <span class="views">
                                <i class="fas fa-eye"></i>
                                ${post.views || 0} views
                            </span>
                            <span class="comments">
                                <i class="fas fa-comments"></i>
                                ${post.commentCount || 0} comments
                            </span>
                        </div>
                    </div>
                </div>
            </header>
            <div class="post-body">
                ${post.content}
            </div>
        `;

        // Set header background image if available
        if (post.headerImage) {
            const header = postDetail.querySelector('.post-header');
            header.style.setProperty('--header-image', `url(${post.headerImage})`);
        }

        // --- Debugging View Count --- 
        console.log('[View Count] Checking conditions...');
        console.log('[View Count] currentUser:', currentUser ? currentUser.uid : 'null');
        console.log('[View Count] post.userId:', post.userId);
        const isAuthor = currentUser && currentUser.uid === post.userId;
        console.log('[View Count] Is current user the author?', isAuthor);
        
        // REMOVED condition: Always attempt to increment view count
        console.log('[View Count] Attempting view count increment (now unconditional).');
        try {
            await postRef.update({
                views: firebase.firestore.FieldValue.increment(1)
            });
            console.log('[View Count] Successfully updated view count in Firestore.');
        } catch (viewUpdateError) {
            console.error('[View Count] Error updating view count in Firestore:', viewUpdateError);
        }
        // REMOVED else block
        // --- End Debugging View Count ---

        // Load comments
        await loadComments();

        setupSubscribeButton(post, db);

    } catch (error) {
        console.error('Error loading post:', error);
        document.querySelector('.post-detail').innerHTML = `
            <div class="error-message">
                <h2>Error Loading Post</h2>
                <p>Sorry, we couldn't load this post. Please try again later.</p>
                <a href="/blog.html" class="back-link">Back to Blog</a>
            </div>
        `;
    }
}

// Load comments
async function loadComments() {
    try {
        const commentsContainer = document.getElementById('comments-container');
        const commentsQuery = await db.collection('posts').doc(postId)
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .get();

        if (commentsQuery.empty) {
            commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }

        const commentsHTML = commentsQuery.docs.map(doc => {
            const comment = doc.data();
            const commentDate = comment.createdAt ? 
                new Date(comment.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 
                'Just now';

            return `
                <div class="comment">
                    <div class="comment-header">
                        <div class="comment-author">
                            <img src="${comment.authorPhotoURL || '../assests/images/avatar-svgrepo-com.svg'}" 
                                 alt="${escapeHtml(comment.authorName)}" 
                                 class="comment-avatar">
                            <div class="comment-author-info">
                                <span class="comment-author-name">${escapeHtml(comment.authorName)}</span>
                                <span class="comment-date">${commentDate}</span>
                            </div>
                        </div>
                    </div>
                    <div class="comment-content">
                        <p>${escapeHtml(comment.text)}</p>
                    </div>
                </div>
            `;
        }).join('');

        commentsContainer.innerHTML = commentsHTML;

    } catch (error) {
        console.error('Error loading comments:', error);
        document.getElementById('comments-container').innerHTML = `
            <div class="error-message">
                <p>Error loading comments. Please try again later.</p>
            </div>
        `;
    }
}

// Handle comment form submission
document.getElementById('comment-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const commentText = event.target.querySelector('#comment-text').value;
    const commenterName = event.target.querySelector('#commenter-name').value;
    
    if (!commentText.trim() || !commenterName.trim()) {
        alert('Please enter both your name and comment.');
        return;
    }

    try {
        const commentData = {
            text: commentText.trim(),
            authorName: commenterName.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log("Attempting to add anonymous comment:", commentData);
        await db.collection('posts').doc(postId).collection('comments').add(commentData);

        await db.collection('posts').doc(postId).update({
            commentCount: firebase.firestore.FieldValue.increment(1)
        });

        event.target.querySelector('#comment-text').value = '';
        event.target.querySelector('#commenter-name').value = '';

        loadComments();

    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Error posting comment. Please try again. Check console for details.');
    }
});

function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Post page loaded, initializing with postId:', postId);
    loadPost();
}); 

async function setupSubscribeButton(post, db) {
    const subscribeBtn = document.getElementById('subscribe-btn');
    if (!subscribeBtn) return;

    // Use a unique key per author for cooldown
    const lastSubKey = `subscribed_author_${post.userId}`;
    const now = Date.now();
    const lastSub = localStorage.getItem(lastSubKey);
    if (lastSub && now - parseInt(lastSub) < 2 * 60 * 1000) {
        subscribeBtn.disabled = true;
        setTimeout(() => subscribeBtn.disabled = false, 2 * 60 * 1000 - (now - parseInt(lastSub)));
    }

    subscribeBtn.addEventListener('click', async () => {
        const browserId = 'browser_' + Date.now(); // Generate a unique browser ID
        const now = Date.now();
        const lastSub = localStorage.getItem(lastSubKey);
        if (lastSub && now - parseInt(lastSub) < 2 * 60 * 1000) {
            alert('You can only subscribe once every 2 minutes.');
            return;
        }
        // Store the timestamp
        localStorage.setItem(lastSubKey, now);
        // Disable the button
        subscribeBtn.disabled = true;
        setTimeout(() => subscribeBtn.disabled = false, 2 * 60 * 1000);
        try {
            await db.collection('subscribers').add({
                authorId: post.userId,
                browserId,
                subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Successfully subscribed');
            subscribeBtn.textContent = 'Subscribed';
            subscribeBtn.classList.add('subscribed');
        } catch (error) {
            console.error('Error subscribing:', error);
            alert('Error subscribing. Please try again later.');
            subscribeBtn.disabled = false;
        }
    });
} 