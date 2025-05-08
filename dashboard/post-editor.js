import { getFirebaseServices } from '../config/firebase.js';
import { ref, push, set, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Initialize Firebase Storage
const storage = getStorage();

// Blog post templates
const templates = {
    standard: {
        name: "Standard Blog Post",
        icon: "fas fa-paragraph",
        content: `# Your Title Here

## Introduction
Start with a compelling introduction that hooks your readers...

## Main Content
Your main content goes here...

## Conclusion
Wrap up your thoughts and provide a call to action...

*Tags: blog, writing*`,
        preview: "A clean, professional template suitable for any topic."
    },
    tutorial: {
        name: "Step-by-Step Tutorial",
        icon: "fas fa-list-ol",
        content: `# How to: Your Tutorial Title

## Prerequisites
- Item 1
- Item 2
- Item 3

## Step 1: Getting Started
Explain the first step...

## Step 2: Main Process
Detail the main steps...

## Step 3: Finishing Up
Explain the final steps...

## Troubleshooting
Common issues and solutions...

*Tags: tutorial, how-to*`,
        preview: "Perfect for technical tutorials and how-to guides."
    },
    review: {
        name: "Product Review",
        icon: "fas fa-star",
        content: `# Product Name Review

## Quick Summary
⭐⭐⭐⭐☆ (4/5 stars)

## Product Overview
Describe the product...

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Pros and Cons
### Pros
- Pro 1
- Pro 2

### Cons
- Con 1
- Con 2

## Final Verdict
Your final thoughts...

*Tags: review, product*`,
        preview: "Ideal for product reviews and comparisons."
    },
    news: {
        name: "News Article",
        icon: "fas fa-newspaper",
        content: `# Your News Headline

## Key Points
- Point 1
- Point 2
- Point 3

## The Story
Main news content...

## Background
Relevant background information...

## What's Next
Future implications...

*Tags: news, current-events*`,
        preview: "Professional format for news articles and updates."
    }
};

class PostEditor {
    constructor() {
        this.currentTemplate = null;
        this.editor = null;
        this.setupEventListeners();
        
        // Initialize Firebase services
        const { auth, database, storage } = getFirebaseServices();
        this.auth = auth;
        this.database = database;
        this.storage = storage;
    }

    setupEventListeners() {
        // Comment out this section to avoid conflicts with dashboard.js
        /*
        const newPostBtn = document.querySelector('#new-post-btn');
        if (newPostBtn) {
            newPostBtn.addEventListener('click', () => this.showTemplateSelector());
        }
        */
    }

    showTemplateSelector() {
        // Create modal for template selection
        const modal = document.createElement('div');
        modal.className = 'template-modal';
        modal.innerHTML = `
            <div class="template-modal-content">
                <div class="template-modal-header">
                    <h2>Choose a Template</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="template-grid">
                    ${Object.entries(templates).map(([key, template]) => `
                        <div class="template-card" data-template="${key}">
                            <i class="${template.icon}"></i>
                            <h3>${template.name}</h3>
                            <p>${template.preview}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .template-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }

            .template-modal-content {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
            }

            .template-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }

            .close-modal {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
            }

            .template-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
            }

            .template-card {
                padding: 1.5rem;
                border: 1px solid #eee;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .template-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }

            .template-card i {
                font-size: 2rem;
                color: #6200ea;
                margin-bottom: 1rem;
            }

            .template-card h3 {
                margin-bottom: 0.5rem;
            }

            .template-card p {
                color: #666;
                font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);

        // Handle template selection
        modal.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateKey = card.dataset.template;
                this.loadTemplate(templateKey);
                modal.remove();
            });
        });

        // Handle modal close
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    loadTemplate(templateKey) {
        const template = templates[templateKey];
        if (!template) return;

        this.currentTemplate = templateKey;
        this.showEditor(template.content);
    }

    showEditor(content) {
        // Create editor container if it doesn't exist
        let editorContainer = document.querySelector('#post-editor-container');
        if (!editorContainer) {
            editorContainer = document.createElement('div');
            editorContainer.id = 'post-editor-container';
            document.querySelector('#main-content').appendChild(editorContainer);
        }

        // Set up editor content
        editorContainer.innerHTML = `
            <div class="editor-header">
                <input type="text" id="post-title" placeholder="Enter post title..." class="title-input">
                <div class="editor-actions">
                    <button id="save-draft" class="btn btn-secondary">Save Draft</button>
                    <button id="publish-post" class="btn btn-primary">Publish</button>
                </div>
            </div>
            <div id="editor"></div>
        `;

        // Initialize TinyMCE with image upload
        tinymce.init({
            selector: '#editor',
            height: 500,
            menubar: true,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
                'bold italic backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | image | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',
            images_upload_handler: this.uploadImage.bind(this),
            automatic_uploads: true,
            file_picker_types: 'image',
            init_instance_callback: (editor) => {
                editor.setContent(content);
                this.editor = editor;
                this.setupAutoSave();
            }
        });

        // Add editor styles
        const style = document.createElement('style');
        style.textContent = `
            #post-editor-container {
                padding: 2rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                margin: 2rem;
            }

            .editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .title-input {
                font-size: 1.5rem;
                padding: 0.5rem;
                border: none;
                border-bottom: 2px solid #eee;
                width: 60%;
                margin-right: 1rem;
            }

            .title-input:focus {
                outline: none;
                border-bottom-color: #6200ea;
            }

            .editor-actions {
                display: flex;
                gap: 1rem;
            }

            .btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            }

            .btn-primary {
                background: #6200ea;
                color: white;
            }

            .btn-secondary {
                background: #f0f0f0;
                color: #333;
            }
        `;
        document.head.appendChild(style);

        // Handle save and publish
        document.querySelector('#save-draft').addEventListener('click', () => this.saveDraft());
        document.querySelector('#publish-post').addEventListener('click', () => this.publishPost());
    }

    setupAutoSave() {
        if (!this.editor) return;

        let autoSaveTimeout;
        const AUTOSAVE_DELAY = 30000; // Auto-save every 30 seconds after last edit

        // Add event listener for content changes
        this.editor.on('Change', () => {
            // Clear existing timeout
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout);
            }

            // Set new timeout
            autoSaveTimeout = setTimeout(() => {
                this.autoSave();
            }, AUTOSAVE_DELAY);
        });
    }

    async autoSave() {
        if (!this.editor) return;

        const title = document.querySelector('#post-title').value;
        const content = this.editor.getContent();
        const user = this.auth.currentUser;

        if (!user || !title.trim()) return;

        try {
            const draftsRef = ref(this.database, `users/${user.uid}/drafts/autosave`);
            await set(draftsRef, {
                title,
                content,
                template: this.currentTemplate,
                lastModified: serverTimestamp(),
                status: 'autosave'
            });

            // Show auto-save notification
            this.showToast('Post auto-saved successfully', 'success');
        } catch (error) {
            console.error('Error auto-saving:', error);
            this.showToast('Failed to auto-save post', 'error');
        }
    }

    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Add toast to container
        toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        // Handle close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    async saveDraft() {
        if (!this.editor) return;

        const title = document.querySelector('#post-title').value;
        const content = this.editor.getContent();
        const user = this.auth.currentUser;

        if (!user) {
            alert('Please log in to save your post');
            return;
        }

        try {
            const draftsRef = ref(this.database, `users/${user.uid}/drafts`);
            const newDraftRef = push(draftsRef);
            await set(newDraftRef, {
                title,
                content,
                template: this.currentTemplate,
                lastModified: serverTimestamp(),
                status: 'draft'
            });

            alert('Draft saved successfully!');
        } catch (error) {
            console.error('Error saving draft:', error);
            alert('Error saving draft. Please try again.');
        }
    }

    async publishPost() {
        if (!this.editor) return;

        const title = document.querySelector('#post-title').value;
        const content = this.editor.getContent();
        const user = this.auth.currentUser;

        if (!user) {
            alert('Please log in to publish your post');
            return;
        }

        if (!title.trim()) {
            alert('Please enter a title for your post');
            return;
        }

        try {
            const postsRef = ref(this.database, `users/${user.uid}/posts`);
            const newPostRef = push(postsRef);
            await set(newPostRef, {
                title,
                content,
                template: this.currentTemplate,
                author: user.displayName || user.email,
                authorId: user.uid,
                publishedAt: serverTimestamp(),
                status: 'published',
                views: 0,
                likes: 0,
                comments: {}
            });

            // Update blog stats
            const statsRef = ref(this.database, `users/${user.uid}/blogStats`);
            const statsSnapshot = await get(statsRef);
            const stats = statsSnapshot.val() || {};
            
            await set(statsRef, {
                ...stats,
                totalPosts: (stats.totalPosts || 0) + 1,
                recentActivity: [
                    {
                        type: 'post',
                        title,
                        timestamp: Date.now()
                    },
                    ...(stats.recentActivity || []).slice(0, 9)
                ]
            });

            alert('Post published successfully!');
            window.location.href = '/dashboard/dashboard.html';
        } catch (error) {
            console.error('Error publishing post:', error);
            alert('Error publishing post. Please try again.');
        }
    }

    async uploadImage(blobInfo, progress) {
        try {
            const file = blobInfo.blob();
            const fileName = blobInfo.filename();
            
            // Get Firebase services
            const { storage, auth } = getFirebaseServices();
            
            // Create storage reference
            const imageRef = storageRef(storage, `blog-images/${auth.currentUser.uid}/${Date.now()}-${fileName}`);
            
            // Upload file
            const snapshot = await uploadBytes(imageRef, file);
            
            // Get download URL
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error('Failed to upload image');
        }
    }
}

// Wait for Firebase to initialize before creating the editor
window.addEventListener('load', () => {
    const postEditor = new PostEditor();
    window.postEditor = postEditor; // Make it available globally if needed
});

export default PostEditor; 