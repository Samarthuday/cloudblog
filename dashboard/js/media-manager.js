import { getFirebaseServices } from '../../config/firebase.js';
import { showSuccessToast, showErrorToast } from '../notification.js';

class MediaManager {
    constructor() {
        this.storage = getFirebaseServices().storage;
        this.db = getFirebaseServices().db;
        this.currentUser = null;
        this.mediaItems = [];
        this.initialize();
    }

    async initialize() {
        try {
            const { auth } = getFirebaseServices();
            auth.onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = user;
                    this.loadMediaItems();
                }
            });
        } catch (error) {
            console.error('Error initializing media manager:', error);
            showErrorToast('Failed to initialize media manager');
        }
    }

    async loadMediaItems() {
        try {
            const mediaRef = this.db.collection('media')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('uploadedAt', 'desc');

            mediaRef.onSnapshot((snapshot) => {
                this.mediaItems = [];
                snapshot.forEach((doc) => {
                    this.mediaItems.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.renderMediaItems();
            });
        } catch (error) {
            console.error('Error loading media items:', error);
            showErrorToast('Failed to load media items');
        }
    }

    async uploadFile(file) {
        try {
            const fileRef = this.storage.ref()
                .child(`users/${this.currentUser.uid}/media/${Date.now()}_${file.name}`);
            
            const uploadTask = fileRef.put(file);
            
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Progress monitoring
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    console.error('Error uploading file:', error);
                    showErrorToast('Failed to upload file');
                },
                async () => {
                    // Upload complete
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    // Save to Firestore
                    await this.db.collection('media').add({
                        userId: this.currentUser.uid,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                        downloadURL: downloadURL,
                        uploadedAt: new Date(),
                        metadata: {
                            lastModified: file.lastModified,
                            type: file.type
                        }
                    });

                    showSuccessToast('File uploaded successfully');
                }
            );
        } catch (error) {
            console.error('Error in upload process:', error);
            showErrorToast('Failed to upload file');
        }
    }

    async deleteMediaItem(mediaId, filePath) {
        try {
            // Delete from Storage
            await this.storage.ref(filePath).delete();
            
            // Delete from Firestore
            await this.db.collection('media').doc(mediaId).delete();
            
            showSuccessToast('Media item deleted successfully');
        } catch (error) {
            console.error('Error deleting media item:', error);
            showErrorToast('Failed to delete media item');
        }
    }

    renderMediaItems() {
        const mediaContainer = document.querySelector('.media-container');
        if (!mediaContainer) return;

        mediaContainer.innerHTML = this.mediaItems.map(item => `
            <div class="media-item" data-id="${item.id}">
                <div class="media-preview">
                    ${this.getPreviewHTML(item)}
                </div>
                <div class="media-info">
                    <h4>${item.fileName}</h4>
                    <p>${this.formatFileSize(item.fileSize)}</p>
                    <p>${new Date(item.uploadedAt).toLocaleDateString()}</p>
                </div>
                <div class="media-actions">
                    <button class="btn btn-icon copy-url" data-url="${item.downloadURL}">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-icon delete-media" data-path="${item.filePath}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        this.addEventListeners();
    }

    getPreviewHTML(item) {
        if (item.fileType.startsWith('image/')) {
            return `<img src="${item.downloadURL}" alt="${item.fileName}">`;
        } else if (item.fileType.startsWith('video/')) {
            return `<video src="${item.downloadURL}" controls></video>`;
        } else {
            return `<i class="fas fa-file"></i>`;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    addEventListeners() {
        // Copy URL buttons
        document.querySelectorAll('.copy-url').forEach(button => {
            button.addEventListener('click', (e) => {
                const url = e.currentTarget.dataset.url;
                navigator.clipboard.writeText(url).then(() => {
                    showSuccessToast('URL copied to clipboard');
                });
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-media').forEach(button => {
            button.addEventListener('click', (e) => {
                const mediaItem = e.currentTarget.closest('.media-item');
                const mediaId = mediaItem.dataset.id;
                const filePath = e.currentTarget.dataset.path;
                
                if (confirm('Are you sure you want to delete this media item?')) {
                    this.deleteMediaItem(mediaId, filePath);
                }
            });
        });
    }
}

// Initialize media manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.media-container')) {
        new MediaManager();
    }
}); 