// Service Worker for BlogDash - handles caching, offline support, and push notifications
const CACHE_NAME = 'blogdash-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/charts.js',
    '/offline.html',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
    'https://via.placeholder.com/150'
];
// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});
// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(cacheName => {
                        return cacheName !== CACHE_NAME;
                    }).map(cacheName => {
                        return caches.delete(cacheName);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});
// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    // Skip for Firebase API requests
    if (event.request.url.includes('firebaseio.com') || 
        event.request.url.includes('googleapis.com')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached response if found
                if (response) {
                    return response;
                }
                
                // Otherwise fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response to cache and return
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                            
                        return response;
                    })
                    .catch(error => {
                        // If offline and requesting a page, show offline page
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});
// Push event - handle push notifications
self.addEventListener('push', event => {
    if (!event.data) {
        console.log('Push event but no data');
        return;
    }
    
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/images/notification-icon.png',
        badge: '/images/notification-badge.png',
        data: {
            url: data.url
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event - open the URL when notification is clicked
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// Background sync event - for deferred actions when coming back online
self.addEventListener('sync', event => {
    if (event.tag === 'sync-posts') {
        event.waitUntil(syncPosts());
    } else if (event.tag === 'sync-comments') {
        event.waitUntil(syncComments());
    }
});

// Function to sync posts that were created while offline
async function syncPosts() {
    try {
        const db = await openIndexedDB();
        const posts = await getOfflinePosts(db);
        
        for (const post of posts) {
            await sendPostToServer(post);
            await markPostAsSynced(db, post.id);
        }
        
        console.log('Posts synced successfully');
    } catch (error) {
        console.error('Post sync failed:', error);
    }
}

// Function to sync comments that were created while offline
async function syncComments() {
    try {
        const db = await openIndexedDB();
        const comments = await getOfflineComments(db);
        
        for (const comment of comments) {
            await sendCommentToServer(comment);
            await markCommentAsSynced(db, comment.id);
        }
        
        console.log('Comments synced successfully');
    } catch (error) {
        console.error('Comment sync failed:', error);
    }
}

// Helper function to open IndexedDB
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('blogdash-offline', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// Helper functions for offline data management
function getOfflinePosts(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['posts'], 'readonly');
        const store = transaction.objectStore('posts');
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function getOfflineComments(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['comments'], 'readonly');
        const store = transaction.objectStore('comments');
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function markPostAsSynced(db, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['posts'], 'readwrite');
        const store = transaction.objectStore('posts');
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

function markCommentAsSynced(db, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['comments'], 'readwrite');
        const store = transaction.objectStore('comments');
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// Helper function to send post to server
function sendPostToServer(post) {
    return fetch('/api/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(post)
    });
}

// Helper function to send comment to server
function sendCommentToServer(comment) {
    return fetch(`/api/posts/${comment.postId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(comment)
    });
}