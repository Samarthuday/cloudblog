// dashboard/js/main.js
import { handleNewPost } from './dashboard.js';

// Make handleNewPost available globally
window.handleNewPost = handleNewPost;

// Initialize all event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const newPostBtn = document.querySelector('#new-post-btn');
    const quickActionNewPost = document.querySelector('.action-card[data-action="new-post"]');

    if (newPostBtn) {
        newPostBtn.addEventListener('click', handleNewPost);
    }

    if (quickActionNewPost) {
        quickActionNewPost.addEventListener('click', handleNewPost);
    }
});