import { getFirebaseServices, isFirebaseInitialized } from '../config/firebase.js';

// Function to load all published posts
async function loadPublishedPosts() {
    try {
        console.log('Starting to load published posts...');
        
        // Wait for Firebase to be initialized
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { db } = getFirebaseServices();
        const postsRef = db.collection('posts');
        const postsContainer = document.getElementById('posts-container');

        // Initial loading state
        postsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Loading posts...</p></div>';

        // Get all published posts
        const querySnapshot = await postsRef
            .where('status', '==', 'published')
            .orderBy('createdAt', 'desc')
            .get();

        if (!postsContainer) {
            console.error('Posts container not found');
            return;
        }

        postsContainer.innerHTML = ''; // Clear loading state

        if (querySnapshot.empty) {
            postsContainer.innerHTML = '<p class="no-posts">No posts available yet.</p>';
            return;
        }

        // Create and append post cards
        querySnapshot.docs.forEach((doc) => {
            try {
                const post = doc.data();
                const postId = doc.id;
                const card = createPostCard(postId, post);
                if (card instanceof Element) {
                    postsContainer.appendChild(card);
                } else {
                    console.error('Invalid card created for post:', postId);
                }
            } catch (error) {
                console.error('Error processing post:', doc.id, error);
            }
        });

        // === Event Delegation: Add ONE listener to the container ===
        // Remove previous listeners if any (safer during debugging)
        postsContainer.replaceWith(postsContainer.cloneNode(true));
        const newPostsContainer = document.getElementById('posts-container'); 
        
        newPostsContainer.addEventListener('click', function(e) {
            try {
                console.log("--- Container Listener Fired ---");
                console.log("e.target (Directly clicked element):", e.target);

                const clickedCard = e.target.closest('.post-card');
                if (!clickedCard) {
                    console.log("[Container Click] Click ignored - No .post-card found.");
                    return;
                }
                console.log("Identified Card Element:", clickedCard);

                // Get the post ID from the identified card's dataset
                const postId = clickedCard.dataset.postId;

                // !!! CRITICAL LOG !!!
                console.log(`>>>>>> Post ID read from dataset: [${postId}] <<<<<<`); 

                if (postId) {
                    console.log(`Card click identified. Navigating...`);
                    // No timeout needed now, navigate directly
                    window.location.href = `/post.html?id=${encodeURIComponent(postId)}`;
                } else {
                    console.error("CRITICAL: data-post-id was missing or empty on the identified card element:", clickedCard);
                    alert("Could not find the Post ID for this card. Cannot navigate.");
                }
            } catch (handlerError) {
                console.error("!!!!!!!!!!!!!! ERROR INSIDE CONTAINER CLICK HANDLER !!!!!!!!!!!!!!", handlerError);
                alert("An error occurred while processing the click. See console.");
            }
        });
        // === End Event Delegation ===

    } catch (error) {
        console.error('Error loading posts:', error);
        const postsContainer = document.getElementById('posts-container');
        if (postsContainer) {
            postsContainer.innerHTML = '<p class="error">Error loading posts. Please try again later.</p>';
        }
    }
}

// Function to create a post card element
function createPostCard(postId, post) {
    // Explicitly log the incoming data for debugging
    console.log(`[createPostCard] Processing ID: ${postId}`, post);
    try {
        if (!postId) {
            console.error('[createPostCard] FATAL: No postId provided.');
            // Return an error card immediately if no ID
            const noIdCard = document.createElement('article');
            noIdCard.className = 'post-card error-card';
            noIdCard.innerHTML = '<p>Error: Missing Post ID.</p>';
            return noIdCard;
        }

        const card = document.createElement('article');
        card.className = 'post-card';
        card.dataset.postId = postId; 

        // Format date safely
        let publishDate = 'Unknown date';
        try {
            if (post.createdAt?.seconds) {
                publishDate = new Date(post.createdAt.seconds * 1000).toLocaleDateString();
            } else if (post.createdAt instanceof Date) {
                 publishDate = post.createdAt.toLocaleDateString();
            } else if (post.publishedAt) { // Fallback to publishedAt
                 console.warn(`[createPostCard ID: ${postId}] Using fallback publishedAt for date.`);
                 publishDate = new Date(post.publishedAt).toLocaleDateString();
            } else {
                 console.warn(`[createPostCard ID: ${postId}] No valid date field found (createdAt or publishedAt).`);
            }
        } catch (dateError) {
            // Log specific error for date formatting
            console.error(`[createPostCard ID: ${postId}] Error formatting date:`, dateError, "Raw date data:", post.createdAt || post.publishedAt);
            publishDate = 'Invalid date'; // Indicate error
        }

        // Create excerpt safely
        let excerpt = '';
        try {
             if (typeof post.content !== 'string') {
                 console.warn(`[createPostCard ID: ${postId}] Post content is not a string:`, typeof post.content);
                 excerpt = 'Invalid content type.';
             } else {
                 excerpt = post.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
             }
        } catch (excerptError) {
             // Log specific error for excerpt creation
             console.error(`[createPostCard ID: ${postId}] Error creating excerpt:`, excerptError, "Raw content:", post.content);
            excerpt = 'Excerpt error.'; // Indicate error
        }

        // Build the card HTML
        card.innerHTML = `
            <div class="post-content">
                <h2 class="post-title">${post.title || 'Untitled Post'}</h2>
                <p class="post-excerpt">${excerpt}</p>
            </div>
            <div class="post-footer">
                <img src="${post.authorPhotoURL || '../assests/images/avatar-svgrepo-com.svg'}" 
                     alt="${post.authorName || 'Anonymous'}" 
                     class="author-avatar">
                <div class="author-info">
                    <span class="post-author-name">${post.authorName || 'Anonymous'}</span>
                    <span class="post-date">${publishDate}</span>
                </div>
            </div>
        `;

        return card;
    } catch (error) {
        // Log the main error with Post ID
        console.error(`!!!!!!!! [createPostCard] MAIN CATCH BLOCK ERROR for Post ID: ${postId} !!!!!!!!!`, error);
        // Return a placeholder card
        const errorCard = document.createElement('article');
        errorCard.className = 'post-card error-card';
        errorCard.innerHTML = `<p>Error loading card for Post ID: ${postId || 'Unknown'}</p>`;
        return errorCard; 
    }
}

// Function to check if user is logged in
function isUserLoggedIn() {
    const { auth } = getFirebaseServices();
    return auth.currentUser !== null;
}

// Update redirectToLogin function
window.redirectToLogin = function(postId) {
    // Store the post ID and return URL in localStorage
    localStorage.setItem('pendingComment', postId);
    localStorage.setItem('returnUrl', window.location.href);
    // Redirect to login page
    window.location.href = '/auth/login.html';
};

// Function to create comment form HTML
function createCommentFormHTML(postId) {
    return `
        <form id="comment-form" class="comment-form">
            <div class="comment-form-name">
                <input type="text" id="commenter-name" placeholder="Your Name" required>
            </div>
            <textarea id="comment-text" placeholder="Write your comment..." required></textarea>
            <button type="submit" class="btn btn-primary">Post Comment</button>
        </form>
    `;
}

// Function to update view count
async function updateViewCount(postId, userId) {
    const { db } = getFirebaseServices();
    try {
        // First get the current post to check if views field exists
        const postRef = db.collection('posts').doc(postId);
        const postDoc = await postRef.get();
        
        if (!postDoc.exists) {
            console.error('Post not found:', postId);
            return false;
        }

        const postData = postDoc.data();
        const currentViews = postData.views || 0;

        // Create a batch to update post views
        const batch = db.batch();
        
        // Update post views
        batch.update(postRef, {
            views: firebase.firestore.FieldValue.increment(1)
        });

        // Commit the batch
        await batch.commit();
        console.log('View count updated successfully for post:', postId);
        return true;
    } catch (error) {
        console.error('Error updating view count:', error);
        return false;
    }
}

// Update loadFullPost function to handle login/register links
async function loadFullPost(postId) {
    try {
        const { db, auth } = getFirebaseServices();
        const postDoc = await db.collection('posts').doc(postId).get();
        
        if (!postDoc.exists) {
            throw new Error('Post not found');
        }

        const post = postDoc.data();
        
        // Only increment view count if user is not the author
        if (!auth.currentUser || auth.currentUser.uid !== post.userId) {
            await updateViewCount(postId, post.userId);
        }
        
        // Get author information
        const authorDoc = await db.collection('users').doc(post.userId).get();
        const author = authorDoc.exists ? authorDoc.data() : { 
            displayName: post.authorName || 'Anonymous',
            photoURL: '../assests/images/avatar-svgrepo-com.svg'
        };

        // Format date
        let publishDate = 'Unknown date';
        try {
            if (post.createdAt) {
                publishDate = new Date(post.createdAt.seconds * 1000).toLocaleDateString();
            }
        } catch (dateError) {
            console.error('Error formatting date:', dateError);
        }

        // Get comments count
        const commentsSnapshot = await db.collection('posts').doc(postId).collection('comments').get();
        const commentsCount = commentsSnapshot.size;

        // Create post content HTML
        const postContent = `
            ${post.coverImage ? `<img src="${post.coverImage}" alt="${post.title}" class="post-image">` : ''}
            <h2 class="post-title">${post.title}</h2>
            <div class="post-meta">
                <div class="post-author">
                    <img src="${author.photoURL || '../assests/images/avatar-svgrepo-com.svg'}" 
                         alt="${author.displayName}" 
                         class="author-avatar">
                    <span>${author.displayName}</span>
                    <button class="subscribe-btn" data-author-id="${post.userId}">
                        <i class="fas fa-bell"></i> Subscribe
                    </button>
                </div>
                <span class="post-date">${publishDate}</span>
                <div class="post-stats">
                    <span class="views-count"><i class="fas fa-eye"></i> ${post.views || 0} views</span>
                    <span class="comments-count"><i class="fas fa-comments"></i> ${commentsCount} comments</span>
                </div>
            </div>
            <div class="post-content">
                ${post.content || ''}
            </div>
            <div class="comments-section">
                <h3>Comments</h3>
                <div id="comments-container">
                    <!-- Comments will be loaded here -->
                </div>
                ${createCommentFormHTML(postId)}
            </div>
        `;

        // Update modal content
        const modalContent = document.getElementById('modal-post-content');
        modalContent.innerHTML = postContent;

        // Add event listener for login link
        const loginLink = modalContent.querySelector('.login-link');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = e.target.dataset.postid;
                redirectToLogin(postId);
            });
        }

        // Add event listener for register link
        const registerLink = modalContent.querySelector('.register-link');
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem('pendingComment', postId);
                localStorage.setItem('returnUrl', window.location.href);
                window.location.href = '/auth/register.html';
            });
        }

        // Load comments
        await loadComments(postId);

        // Handle comment submission if user is logged in
        if (isUserLoggedIn()) {
            const commentForm = document.getElementById('comment-form');
            if (commentForm) {
                commentForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const submitButton = commentForm.querySelector('button[type="submit"]');
                    submitButton.disabled = true;
                    submitButton.textContent = 'Posting...';
                    
                    try {
                        await submitComment(postId);
                        submitButton.textContent = 'Post Comment';
                    } catch (error) {
                        console.error('Error posting comment:', error);
                        submitButton.textContent = 'Post Comment';
                    } finally {
                        submitButton.disabled = false;
                    }
                });
            }
        }

        // Add event listener for subscribe button
        const subscribeBtn = modalContent.querySelector('.subscribe-btn');
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', async () => {
                const authorId = subscribeBtn.dataset.authorId;
                await subscribeToAuthor(authorId);
            });
        }

        // Show modal and setup close handlers
        const modal = document.getElementById('post-modal');
        modal.style.display = 'block';
        setupModalCloseHandlers();
    } catch (error) {
        console.error('Error loading post:', error);
        const modalContent = document.getElementById('modal-post-content');
        modalContent.innerHTML = '<p class="error">Error loading post. Please try again later.</p>';
    }
}

// Function to load comments
async function loadComments(postId) {
    try {
        const { db } = getFirebaseServices();
        const commentsContainer = document.getElementById('comments-container');
        commentsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';

        // Get initial comments
        const initialComments = await db.collection('posts').doc(postId)
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .get();

        // Process initial comments
        if (initialComments.empty) {
            commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        } else {
            const commentsHTML = initialComments.docs.map(doc => {
                const comment = doc.data();
                const commentDate = comment.createdAt ? formatDate(comment.createdAt) : 'Just now';
                const avatarPath = comment.userPhotoURL && comment.userPhotoURL.startsWith('/') 
                    ? comment.userPhotoURL.substring(1) 
                    : comment.userPhotoURL || 'assests/images/avatar-svgrepo-com.svg';
                return `
                    <div class="comment" id="comment-${doc.id}">
                        <div class="comment-author">
                            <img src="${avatarPath}" alt="${comment.userDisplayName}" class="author-avatar">
                            <div class="author-info">
                                <span class="author-name">${comment.userDisplayName}</span>
                                <span class="comment-date">${commentDate}</span>
                            </div>
                        </div>
                        <p class="comment-text">${comment.text}</p>
                    </div>
                `;
            });
            commentsContainer.innerHTML = commentsHTML.join('');
        }

        // Set up real-time listener for new comments
        const unsubscribe = db.collection('posts').doc(postId)
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' && 
                        (!initialComments.docs[0] || 
                         change.doc.data().createdAt > initialComments.docs[0].data().createdAt)) {
                        // Only handle comments newer than our initial set
                        const comment = change.doc.data();
                        const commentDate = comment.createdAt ? formatDate(comment.createdAt) : 'Just now';
                        const avatarPath = comment.userPhotoURL && comment.userPhotoURL.startsWith('/') 
                            ? comment.userPhotoURL.substring(1) 
                            : comment.userPhotoURL || 'assests/images/avatar-svgrepo-com.svg';
                        const commentHTML = `
                            <div class="comment" id="comment-${change.doc.id}">
                                <div class="comment-author">
                                    <img src="${avatarPath}" alt="${comment.userDisplayName}" class="author-avatar">
                                    <div class="author-info">
                                        <span class="author-name">${comment.userDisplayName}</span>
                                        <span class="comment-date">${commentDate}</span>
                                    </div>
                                </div>
                                <p class="comment-text">${comment.text}</p>
                            </div>
                        `;
                        
                        // Remove no-comments message if it exists
                        const noCommentsMessage = commentsContainer.querySelector('.no-comments');
                        if (noCommentsMessage) {
                            noCommentsMessage.remove();
                        }

                        // Add new comment at the top
                        if (commentsContainer.firstChild) {
                            commentsContainer.insertAdjacentHTML('afterbegin', commentHTML);
                        } else {
                            commentsContainer.innerHTML = commentHTML;
                        }
                    }
                });
            }, (error) => {
                console.error('Error loading comments:', error);
                commentsContainer.innerHTML = '<p class="error">Error loading comments. Please try again later.</p>';
            });

        // Store unsubscribe function to clean up when modal is closed
        const modal = document.getElementById('post-modal');
        modal.dataset.unsubscribe = unsubscribe;
    } catch (error) {
        console.error('Error setting up comments listener:', error);
        const commentsContainer = document.getElementById('comments-container');
        commentsContainer.innerHTML = '<p class="error">Error loading comments. Please try again later.</p>';
    }
}

// Function to submit a comment
async function submitComment(postId) {
    const { db } = getFirebaseServices();
    
    const commenterName = document.getElementById('commenter-name').value.trim();
    const commentText = document.getElementById('comment-text').value.trim();
    
    if (!commenterName) {
        alert('Please enter your name');
        return;
    }
    
    if (!commentText) {
        alert('Please enter a comment');
        return;
    }

    const submitButton = document.querySelector('.comment-form button');
    submitButton.disabled = true;
    submitButton.textContent = 'Posting...';

    try {
        // Create a new comment document with current timestamp
        const timestamp = firebase.firestore.Timestamp.now();
        const commentData = {
            text: commentText,
            userDisplayName: commenterName,
            userPhotoURL: '../assests/images/avatar-svgrepo-com.svg',
            createdAt: timestamp
        };

        // Add the comment to Firestore
        await db.collection('posts').doc(postId).collection('comments').add(commentData);

        // Update post's comment count
        await db.collection('posts').doc(postId).update({
            commentCount: firebase.firestore.FieldValue.increment(1)
        });

        // Clear comment input
        document.getElementById('commenter-name').value = '';
        document.getElementById('comment-text').value = '';

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Comment posted successfully!';
        document.querySelector('.comment-form').appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);

    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Error posting comment. Please try again.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Post Comment';
    }
}

// Function to format date
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    try {
        const date = timestamp.toDate();
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            // Today - show time
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown date';
    }
}

// Update modal close handlers to properly handle the unsubscribe function
function setupModalCloseHandlers() {
    const modal = document.getElementById('post-modal');
    const closeModal = document.querySelector('.close-modal');

    const cleanup = () => {
        // Unsubscribe from real-time updates
        if (modal.dataset.unsubscribe && typeof modal.dataset.unsubscribe === 'function') {
            modal.dataset.unsubscribe();
            delete modal.dataset.unsubscribe;
        }
        modal.style.display = 'none';
    };

    closeModal.onclick = cleanup;
    window.onclick = (event) => {
        if (event.target === modal) {
            cleanup();
        }
    };
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('Blog page loaded, initializing...');
    loadPublishedPosts();
});

// Add toast notification functions
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Update subscribeToAuthor function to prevent multiple subscriptions
async function subscribeToAuthor(authorId, buttonElement) {
    const { db, auth } = getFirebaseServices();
    
    try {
        // Check if user is logged in
        if (!auth.currentUser) {
            showErrorToast('Please log in to subscribe');
            // Store the author ID to subscribe after login
            localStorage.setItem('pendingSubscription', authorId);
            window.location.href = '/auth/login.html';
            return;
        }

        // Disable the button immediately to prevent multiple clicks
        if (buttonElement) {
            buttonElement.disabled = true;
        }

        // Check if already subscribed using Firestore
        const subscribersRef = db.collection('subscribers');
        const existingSubscription = await subscribersRef
            .where('userId', '==', auth.currentUser.uid)
            .where('authorId', '==', authorId)
            .get();

        if (!existingSubscription.empty) {
            showErrorToast('You are already subscribed to this author');
            if (buttonElement) {
                buttonElement.disabled = false;
            }
            return;
        }

        // Add subscription to Firestore with unique composite key
        const subscriptionId = `${auth.currentUser.uid}_${authorId}`;
        await subscribersRef.doc(subscriptionId).set({
            userId: auth.currentUser.uid,
            authorId: authorId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update all buttons for this author
        document.querySelectorAll(`.subscribe-btn[data-author-id="${authorId}"]`).forEach(btn => {
            btn.classList.add('subscribed');
            btn.innerHTML = '<i class="fas fa-bell"></i> Subscribed';
            btn.disabled = true; // Disable the button after successful subscription
        });

        showSuccessToast('Successfully subscribed to author!');
    } catch (error) {
        console.error('Error subscribing:', error);
        showErrorToast('Failed to subscribe. Please try again.');
        if (buttonElement) {
            buttonElement.disabled = false;
        }
    }
}

// Add function to check subscription status
async function checkSubscriptionStatus(authorId) {
    const { db, auth } = getFirebaseServices();
    
    if (!auth.currentUser) {
        return false;
    }

    try {
        const subscribersRef = db.collection('subscribers');
        const subscription = await subscribersRef
            .where('userId', '==', auth.currentUser.uid)
            .where('authorId', '==', authorId)
            .get();

        return !subscription.empty;
    } catch (error) {
        console.error('Error checking subscription status:', error);
        return false;
    }
}

// Add function to handle post-login subscription
async function handlePendingSubscription() {
    const pendingSubscription = localStorage.getItem('pendingSubscription');
    if (pendingSubscription) {
        await subscribeToAuthor(pendingSubscription);
        localStorage.removeItem('pendingSubscription');
    }
}

/* REMOVED MOUSE HOVER EFFECT
document.addEventListener('mousemove', (e) => {
    // Select ALL elements with the post-card class
    const cards = document.querySelectorAll('.post-card'); 
    cards.forEach(card => {
        // Basic check if it's an element we can work with
        if (typeof card.getBoundingClientRect !== 'function') return;
        
        try {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / card.clientWidth) * 100;
            const y = ((e.clientY - rect.top) / card.clientHeight) * 100;
            // Use requestAnimationFrame for potentially smoother updates (optional)
            requestAnimationFrame(() => {
                 card.style.setProperty('--x', `${x}%`);
                 card.style.setProperty('--y', `${y}%`);
            });
        } catch (error) {
             // Catch potential errors (e.g., if clientWidth/Height is zero)
             console.warn("Error applying hover effect to card:", card, error); 
        }
    });
});
*/