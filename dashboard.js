// Add refresh button handler
document.getElementById('refresh-posts').addEventListener('click', () => {
    loadRecentPosts();
    showToast('Refreshing posts...', 'info');
}); 