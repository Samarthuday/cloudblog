import { getFirebaseServices } from '../../config/firebase.js';
import { showSuccessToast, showErrorToast } from '../notification.js';

class CommentsManager {
    constructor() {
        this.db = getFirebaseServices().db;
        this.currentUser = null;
        this.comments = [];
        this.initialize();
    }

    async initialize() {
        try {
            const { auth } = getFirebaseServices();
            auth.onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = user;
                    this.loadComments();
                }
            });
        } catch (error) {
            console.error('Error initializing comments manager:', error);
            showErrorToast('Failed to initialize comments manager');
        }
    }

    async loadComments() {
        try {
            const commentsRef = this.db.collectionGroup('comments')
                .where('postAuthorId', '==', this.currentUser.uid)
                .orderBy('createdAt', 'desc');

            commentsRef.onSnapshot((snapshot) => {
                this.comments = [];
                snapshot.forEach((doc) => {
                    this.comments.push({
                        id: doc.id,
                        postId: doc.ref.parent.parent.id,
                        ...doc.data()
                    });
                });
                this.renderComments();
            });
        } catch (error) {
            console.error('Error loading comments:', error);
            showErrorToast('Failed to load comments');
        }
    }

    async approveComment(commentId, postId) {
        try {
            await this.db.collection('posts')
                .doc(postId)
                .collection('comments')
                .doc(commentId)
                .update({
                    status: 'approved',
                    approvedAt: new Date()
                });
            
            showSuccessToast('Comment approved successfully');
        } catch (error) {
            console.error('Error approving comment:', error);
            showErrorToast('Failed to approve comment');
        }
    }

    async deleteComment(commentId, postId) {
        try {
            await this.db.collection('posts')
                .doc(postId)
                .collection('comments')
                .doc(commentId)
                .delete();
            
            showSuccessToast('Comment deleted successfully');
        } catch (error) {
            console.error('Error deleting comment:', error);
            showErrorToast('Failed to delete comment');
        }
    }

    async replyToComment(commentId, postId, replyText) {
        try {
            const commentRef = this.db.collection('posts')
                .doc(postId)
                .collection('comments')
                .doc(commentId);

            await commentRef.update({
                reply: {
                    text: replyText,
                    authorId: this.currentUser.uid,
                    createdAt: new Date()
                }
            });

            showSuccessToast('Reply added successfully');
        } catch (error) {
            console.error('Error replying to comment:', error);
            showErrorToast('Failed to add reply');
        }
    }

    renderComments() {
        const commentsContainer = document.querySelector('.comments-container');
        if (!commentsContainer) return;

        commentsContainer.innerHTML = this.comments.map(comment => `
            <div class="comment-item" data-id="${comment.id}" data-post-id="${comment.postId}">
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="${comment.userPhotoURL || '../assests/images/avatar-svgrepo-com.svg'}" 
                             alt="${comment.userDisplayName}" class="author-avatar">
                        <div class="author-info">
                            <h4>${comment.userDisplayName}</h4>
                            <p class="comment-time">${new Date(comment.createdAt.toDate()).toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="comment-status ${comment.status}">
                        ${comment.status}
                    </div>
                </div>
                <div class="comment-content">
                    <p>${comment.text}</p>
                </div>
                ${comment.reply ? `
                    <div class="comment-reply">
                        <div class="reply-header">
                            <strong>Your Reply:</strong>
                            <span class="reply-time">${new Date(comment.reply.createdAt.toDate()).toLocaleString()}</span>
                        </div>
                        <p>${comment.reply.text}</p>
                    </div>
                ` : ''}
                <div class="comment-actions">
                    ${comment.status !== 'approved' ? `
                        <button class="btn btn-icon approve-comment">
                            <i class="fas fa-check"></i> Approve
                        </button>
                    ` : ''}
                    <button class="btn btn-icon delete-comment">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    ${!comment.reply ? `
                        <button class="btn btn-icon reply-comment">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        this.addEventListeners();
    }

    addEventListeners() {
        // Approve buttons
        document.querySelectorAll('.approve-comment').forEach(button => {
            button.addEventListener('click', (e) => {
                const commentItem = e.currentTarget.closest('.comment-item');
                const commentId = commentItem.dataset.id;
                const postId = commentItem.dataset.postId;
                this.approveComment(commentId, postId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-comment').forEach(button => {
            button.addEventListener('click', (e) => {
                const commentItem = e.currentTarget.closest('.comment-item');
                const commentId = commentItem.dataset.id;
                const postId = commentItem.dataset.postId;
                
                if (confirm('Are you sure you want to delete this comment?')) {
                    this.deleteComment(commentId, postId);
                }
            });
        });

        // Reply buttons
        document.querySelectorAll('.reply-comment').forEach(button => {
            button.addEventListener('click', (e) => {
                const commentItem = e.currentTarget.closest('.comment-item');
                const commentId = commentItem.dataset.id;
                const postId = commentItem.dataset.postId;
                
                const replyText = prompt('Enter your reply:');
                if (replyText) {
                    this.replyToComment(commentId, postId, replyText);
                }
            });
        });
    }
}

// Initialize comments manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.comments-container')) {
        new CommentsManager();
    }
}); 