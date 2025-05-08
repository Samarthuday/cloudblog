import { showErrorToast, showSuccessToast } from '../notification.js';
import { getFirebaseServices } from '../../config/firebase.js';

// Function to save to Firebase
async function saveToFirebase(data, collectionName = 'posts') {
    try {
        const { db, auth } = getFirebaseServices();
        
        // Ensure Firebase is initialized
        if (!firebase || !firebase.firestore) {
            console.error('Firebase is not initialized');
            throw new Error('Firebase is not initialized');
        }

        // Check if user is logged in
        const user = auth.currentUser;
        if (!user) {
            console.error('No user logged in');
            showErrorToast('Please log in to save or publish posts');
            return null;
        }

        // Add user and timestamp information
        const dataWithMetadata = {
            ...data,
            userId: user.uid,
            authorName: user.displayName || 'Anonymous User',
            authorEmail: user.email || 'anonymous@user.com',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log('Attempting to save to Firebase:', dataWithMetadata);
        
        // Explicitly create a reference to the collection
        const collectionRef = db.collection(collectionName);
        console.log('Collection reference created for:', collectionName);

        // Add the document
        const docRef = await collectionRef.add(dataWithMetadata);
        console.log('Successfully saved to Firebase with ID:', docRef.id);
        
        showSuccessToast('Successfully saved to Firebase!');
        return docRef.id;
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        // Log more details about the error
        if (error.code) {
            console.error('Error code:', error.code);
        }
        if (error.message) {
            console.error('Error message:', error.message);
        }
        showErrorToast('Failed to save to Firebase: ' + error.message);
        return null;
    }
}

// Export the handleNewPost function
export function handleNewPost() {
    try {
        console.log('handleNewPost function called');
        
        // Remove any existing modal
        const existingModal = document.querySelector('.modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create new modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            backdrop-filter: blur(5px);
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background-color: white;
                border-radius: 12px;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                transform: translateY(-20px);
                transition: transform 0.3s ease-in-out;
                padding: 24px;
                position: relative;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            ">
                <div class="modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #e1e4e8;
                ">
                    <h3 class="modal-title" style="
                        font-size: 28px;
                        font-weight: 600;
                        color: #1a1a1a;
                        margin: 0;
                    ">Choose a Blog Template</h3>
                    <button class="close-modal" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                        padding: 8px;
                        border-radius: 50%;
                        transition: all 0.2s ease;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        &:hover {
                            background-color: #f0f0f0;
                            color: #333;
                        }
                    ">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="section" style="margin-bottom: 32px;">
                        <h4 class="section-title" style="
                            font-size: 20px;
                            font-weight: 600;
                            color: #2c3e50;
                            margin-bottom: 16px;
                        ">Tech & Development</h4>
                        <div style="
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                            gap: 20px;
                        ">
                            <div class="template-card" data-template="tech-workspace" style="
                                background: white;
                                border: 1px solid #e1e4e8;
                                border-radius: 12px;
                                padding: 20px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                position: relative;
                                overflow: hidden;
                                &:hover {
                                    transform: translateY(-4px);
                                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                                    border-color: #3498db;
                                }
                            ">
                                <div class="template-category" style="
                                    display: flex;
                                    align-items: center;
                                    margin-bottom: 12px;
                                ">
                                    <div class="icon-wrapper" style="
                                        background: #3498db;
                                        width: 40px;
                                        height: 40px;
                                        border-radius: 10px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        margin-right: 12px;
                                    ">
                                        <i class="fas fa-laptop-code" style="color: white; font-size: 18px;"></i>
                                </div>
                                    <span class="category-text" style="
                                        color: #3498db;
                                        font-weight: 500;
                                        font-size: 14px;
                                    ">Technology</span>
                            </div>
                                <h3 class="template-title" style="
                                    font-size: 18px;
                                    font-weight: 600;
                                    color: #2c3e50;
                                    margin: 0 0 8px 0;
                                ">Tech Workspace</h3>
                                <p class="template-description" style="
                                    color: #666;
                                    font-size: 14px;
                                    line-height: 1.5;
                                    margin: 0 0 16px 0;
                                ">Perfect for tech tutorials, workspace setups, and development insights.</p>
                                <div class="template-meta" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 16px;
                                    font-size: 13px;
                                    color: #666;
                                ">
                                    <span class="meta-time" style="display: flex; align-items: center; gap: 4px;">
                                        <i class="far fa-clock"></i> 5 min setup
                                    </span>
                                    <span class="meta-rating" style="display: flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-star" style="color: #f1c40f;"></i> 4.9
                                    </span>
                            </div>
                        </div>

                            <div class="template-card" data-template="coding" style="
                                background: white;
                                border: 1px solid #e1e4e8;
                                border-radius: 12px;
                                padding: 20px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                position: relative;
                                overflow: hidden;
                                &:hover {
                                    transform: translateY(-4px);
                                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                                    border-color: #2ecc71;
                                }
                            ">
                                <div class="template-category" style="
                                    display: flex;
                                    align-items: center;
                                    margin-bottom: 12px;
                                ">
                                    <div class="icon-wrapper" style="
                                        background: #2ecc71;
                                        width: 40px;
                                        height: 40px;
                                        border-radius: 10px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        margin-right: 12px;
                                    ">
                                        <i class="fas fa-code" style="color: white; font-size: 18px;"></i>
                                </div>
                                    <span class="category-text" style="
                                        color: #2ecc71;
                                        font-weight: 500;
                                        font-size: 14px;
                                    ">Development</span>
                            </div>
                                <h3 class="template-title" style="
                                    font-size: 18px;
                                    font-weight: 600;
                                    color: #2c3e50;
                                    margin: 0 0 8px 0;
                                ">Coding Blog</h3>
                                <p class="template-description" style="
                                    color: #666;
                                    font-size: 14px;
                                    line-height: 1.5;
                                    margin: 0 0 16px 0;
                                ">Share programming tutorials, code snippets, and development best practices.</p>
                                <div class="template-meta" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 16px;
                                    font-size: 13px;
                                    color: #666;
                                ">
                                    <span class="meta-time" style="display: flex; align-items: center; gap: 4px;">
                                        <i class="far fa-clock"></i> 3 min setup
                                    </span>
                                    <span class="meta-rating" style="display: flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-star" style="color: #f1c40f;"></i> 4.8
                                    </span>
                            </div>
                        </div>
                            </div>
                        </div>

                    <div class="section" style="margin-bottom: 32px;">
                        <h4 class="section-title" style="
                            font-size: 20px;
                            font-weight: 600;
                            color: #2c3e50;
                            margin-bottom: 16px;
                        ">Creative & Media</h4>
                        <div style="
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                            gap: 20px;
                        ">
                            <div class="template-card" data-template="photography" style="
                                background: white;
                                border: 1px solid #e1e4e8;
                                border-radius: 12px;
                                padding: 20px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                position: relative;
                                overflow: hidden;
                                &:hover {
                                    transform: translateY(-4px);
                                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                                    border-color: #9b59b6;
                                }
                            ">
                                <div class="template-category" style="
                                    display: flex;
                                    align-items: center;
                                    margin-bottom: 12px;
                                ">
                                    <div class="icon-wrapper" style="
                                        background: #9b59b6;
                                        width: 40px;
                                        height: 40px;
                                        border-radius: 10px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        margin-right: 12px;
                                    ">
                                        <i class="fas fa-camera" style="color: white; font-size: 18px;"></i>
                                </div>
                                    <span class="category-text" style="
                                        color: #9b59b6;
                                        font-weight: 500;
                                        font-size: 14px;
                                    ">Photography</span>
                            </div>
                                <h3 class="template-title" style="
                                    font-size: 18px;
                                    font-weight: 600;
                                    color: #2c3e50;
                                    margin: 0 0 8px 0;
                                ">Photography Portfolio</h3>
                                <p class="template-description" style="
                                    color: #666;
                                    font-size: 14px;
                                    line-height: 1.5;
                                    margin: 0 0 16px 0;
                                ">Showcase your photography work with a beautiful gallery layout and story format.</p>
                                <div class="template-meta" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 16px;
                                    font-size: 13px;
                                    color: #666;
                                ">
                                    <span class="meta-time" style="display: flex; align-items: center; gap: 4px;">
                                        <i class="far fa-clock"></i> 4 min setup
                                    </span>
                                    <span class="meta-rating" style="display: flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-star" style="color: #f1c40f;"></i> 4.7
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section" style="margin-bottom: 32px;">
                        <h4 class="section-title" style="
                            font-size: 20px;
                            font-weight: 600;
                            color: #2c3e50;
                            margin-bottom: 16px;
                        ">Lifestyle & Travel</h4>
                        <div style="
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                            gap: 20px;
                        ">
                            <div class="template-card" data-template="travel" style="
                                background: white;
                                border: 1px solid #e1e4e8;
                                border-radius: 12px;
                                padding: 20px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                position: relative;
                                overflow: hidden;
                                &:hover {
                                    transform: translateY(-4px);
                                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                                    border-color: #e67e22;
                                }
                            ">
                                <div class="template-category" style="
                                    display: flex;
                                    align-items: center;
                                    margin-bottom: 12px;
                                ">
                                    <div class="icon-wrapper" style="
                                        background: #e67e22;
                                        width: 40px;
                                        height: 40px;
                                        border-radius: 10px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        margin-right: 12px;
                                    ">
                                        <i class="fas fa-plane" style="color: white; font-size: 18px;"></i>
                                </div>
                                    <span class="category-text" style="
                                        color: #e67e22;
                                        font-weight: 500;
                                        font-size: 14px;
                                    ">Travel</span>
                            </div>
                                <h3 class="template-title" style="
                                    font-size: 18px;
                                    font-weight: 600;
                                    color: #2c3e50;
                                    margin: 0 0 8px 0;
                                ">Travel Blog</h3>
                                <p class="template-description" style="
                                    color: #666;
                                    font-size: 14px;
                                    line-height: 1.5;
                                    margin: 0 0 16px 0;
                                ">Document your adventures and share travel guides with stunning visuals.</p>
                                <div class="template-meta" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 16px;
                                    font-size: 13px;
                                    color: #666;
                                ">
                                    <span class="meta-time" style="display: flex; align-items: center; gap: 4px;">
                                        <i class="far fa-clock"></i> 4 min setup
                                    </span>
                                    <span class="meta-rating" style="display: flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-star" style="color: #f1c40f;"></i> 4.7
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Append modal to body
        document.body.appendChild(modal);

        // Force a reflow to ensure the transition works
        modal.offsetHeight;

        // Show modal with a slight delay
        setTimeout(() => {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.querySelector('.modal-content').style.transform = 'translateY(0)';
            }, 10);
        }, 0);

        // Add close button handler
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
            setTimeout(() => modal.remove(), 300);
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
                setTimeout(() => modal.remove(), 300);
            }
        });

        // Add template selection handlers
        const templateCards = modal.querySelectorAll('.template-card');
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                const template = card.dataset.template;
                    initializeEditor(template);
                modal.style.opacity = '0';
                modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
                setTimeout(() => modal.remove(), 300);
            });
        });

    } catch (error) {
        console.error('Error showing template selector:', error);
        showErrorToast('Failed to show template selector: ' + error.message);
    }
}

// Function to initialize template handlers
function initializeTemplateHandlers() {
    const modalBody = document.getElementById('modal-body');
    
    // Handle preview functionality
    const previewButtons = modalBody.querySelectorAll('.preview-link');
    const closeButtons = modalBody.querySelectorAll('.close-preview');
    const useTemplateButtons = modalBody.querySelectorAll('.use-template');

    // Show preview modal
    previewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const previewId = button.getAttribute('data-target');
            const previewModal = modalBody.querySelector(`#${previewId}`);
            if (previewModal) {
                previewModal.classList.add('active');
            }
        });
    });

    // Close preview modal
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const previewModal = button.closest('.preview-modal');
            if (previewModal) {
                previewModal.classList.remove('active');
            }
        });
    });

    // Use template from preview
    useTemplateButtons.forEach(button => {
        button.addEventListener('click', () => {
            const templateType = button.getAttribute('data-template');
            const previewModal = button.closest('.preview-modal');
            if (previewModal) {
                previewModal.classList.remove('active');
            }
            const modal = document.getElementById('modal');
            modal.style.display = 'none';
            modal.classList.remove('active');
            initializeEditor(templateType);
        });
    });

    // Handle template selection from main modal
    const templateCards = modalBody.querySelectorAll('.card');
    templateCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.preview-link')) {
                const templateType = card.dataset.template;
                const modal = document.getElementById('modal');
                modal.style.display = 'none';
                modal.classList.remove('active');
                initializeEditor(templateType);
            }
        });
    });
}

// Initialize event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Handle new post button clicks
    const newPostBtn = document.querySelector('#new-post-btn');
    const quickActionNewPost = document.querySelector('.action-card[data-action="new-post"]');

    if (newPostBtn) {
        newPostBtn.addEventListener('click', () => {
            console.log('New post button clicked');
            handleNewPost();
        });
    }

    if (quickActionNewPost) {
        quickActionNewPost.addEventListener('click', () => {
            console.log('Quick action new post clicked');
            handleNewPost();
        });
    }

    // View All Posts functionality
    const viewAllBtn = document.getElementById('view-all-posts-btn');
    const allPostsContainer = document.getElementById('all-posts-container');
    if (viewAllBtn && allPostsContainer) {
        viewAllBtn.addEventListener('click', async () => {
            viewAllBtn.disabled = true;
            allPostsContainer.innerHTML = '<div style="padding:2rem;text-align:center;">Loading all posts...</div>';
            allPostsContainer.style.display = 'block';
            const posts = await loadPublishedPosts();
            if (!posts.length) {
                allPostsContainer.innerHTML = '<div style="padding:2rem;text-align:center;">No published posts found.</div>';
            } else {
                allPostsContainer.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                        <h2 style="margin:0;">All Published Posts</h2>
                        <button id="close-all-posts" style="background:none;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>
                    </div>
                    <ul class="all-posts-list" style="list-style:none;padding:0;margin:0;"></ul>
                `;
                const list = allPostsContainer.querySelector('.all-posts-list');
                posts.forEach(post => {
                    const li = document.createElement('li');
                    li.className = 'post-item';
                    li.style.marginBottom = '1rem';
                    li.innerHTML = `
                        <img src="${post.coverImage || '../assests/images/placeholder.png'}" alt="Post Thumbnail" class="post-thumbnail">
                        <div class="post-details">
                            <h3 class="post-title">${post.title || 'Untitled Post'}</h3>
                            <div class="post-meta">
                                <span><i class="far fa-calendar"></i> ${post.publishedAt && post.publishedAt.toDate ? post.publishedAt.toDate().toLocaleDateString() : 'Draft'}</span>
                                <span><i class="far fa-eye"></i> ${post.views || 0}</span>
                                <span><i class="far fa-comment"></i> ${post.commentCount || 0}</span>
                            </div>
                        </div>
                    `;
                    list.appendChild(li);
                });
                // Close button
                allPostsContainer.querySelector('#close-all-posts').addEventListener('click', () => {
                    allPostsContainer.style.display = 'none';
                    viewAllBtn.disabled = false;
                });
            }
        });
    }
});

// Function to get template content
function getTemplateContent(templateType) {
    const templates = {
        'tech-workspace': `
            <h1>Tech Review Title</h1>
            <div class="meta">
                <span class="category">Tech Review</span>
                <span class="reading-time">5 min read</span>
            </div>
            
            <div class="featured-image">
                [Insert your product/workspace image here]
            </div>
            
            <h2>Overview</h2>
            <p>Introduce the tech product or workspace setup you're reviewing...</p>
            
            <h2>Technical Specifications</h2>
            <ul>
                <li>Specification 1</li>
                <li>Specification 2</li>
                <li>Specification 3</li>
            </ul>
            
            <h2>Performance Analysis</h2>
            <p>Detail the performance metrics and your experience...</p>
            
            <div class="code-block">
                // Add relevant code examples here
                function example() {
                    console.log("Hello World");
                }
            </div>
            
            <h2>Pros and Cons</h2>
            <div class="pros-cons">
                <div class="pros">
                    <h3>Pros</h3>
                    <ul>
                        <li>Pro point 1</li>
                        <li>Pro point 2</li>
                    </ul>
                </div>
                <div class="cons">
                    <h3>Cons</h3>
                    <ul>
                        <li>Con point 1</li>
                        <li>Con point 2</li>
                    </ul>
                </div>
            </div>
            
            <h2>Verdict</h2>
            <p>Summarize your final thoughts and recommendations...</p>
        `,
        'coding': `
            <h1>Coding Tutorial Title</h1>
            <div class="meta">
                <span class="difficulty">Intermediate</span>
                <span class="category">Programming</span>
                <span class="reading-time">10 min read</span>
            </div>
            
            <h2>Introduction</h2>
            <p>Explain what readers will learn in this tutorial...</p>
            
            <h2>Prerequisites</h2>
            <ul>
                <li>Requirement 1</li>
                <li>Requirement 2</li>
            </ul>
            
            <h2>Setup</h2>
            <div class="code-block">
                // Add setup code here
            </div>
            
            <h2>Step-by-Step Guide</h2>
            <h3>Step 1: Getting Started</h3>
            <p>Explain the first step...</p>
            <div class="code-block">
                // Add code for step 1
            </div>
            
            <h3>Step 2: Implementation</h3>
            <p>Detail the implementation...</p>
            <div class="code-block">
                // Add code for step 2
            </div>
            
            <h2>Testing</h2>
            <p>Explain how to test the implementation...</p>
            
            <h2>Conclusion</h2>
            <p>Summarize what was learned...</p>
        `,
        'mindfulness': `
            <h1>Mindfulness Practice Title</h1>
            <div class="meta">
                <span class="category">Wellness</span>
                <span class="duration">10 min practice</span>
            </div>
            
            <div class="featured-image">
                [Insert calming image here]
            </div>
            
            <h2>Introduction</h2>
            <p>Set the context for this mindfulness practice...</p>
            
            <h2>Benefits</h2>
            <ul>
                <li>Benefit 1</li>
                <li>Benefit 2</li>
                <li>Benefit 3</li>
            </ul>
            
            <h2>Practice Guide</h2>
            <ol>
                <li>Step 1: Getting comfortable...</li>
                <li>Step 2: Breathing exercise...</li>
                <li>Step 3: Mindful observation...</li>
            </ol>
            
            <blockquote>
                "Add an inspiring quote about mindfulness here"
            </blockquote>
            
            <h2>Tips for Practice</h2>
            <p>Share helpful tips for maintaining practice...</p>
            
            <h2>Reflection</h2>
            <p>Guide for post-practice reflection...</p>
        `,
        'photography': `
            <h1>Photography Story Title</h1>
            <div class="meta">
                <span class="category">Photography</span>
                <span class="location">Location Name</span>
            </div>
            
            <div class="gallery">
                [Insert photo gallery here]
            </div>
            
            <h2>The Story Behind the Shot</h2>
            <p>Share the story behind your photographs...</p>
            
            <h2>Technical Details</h2>
            <ul>
                <li>Camera: [Your Camera]</li>
                <li>Lens: [Your Lens]</li>
                <li>Settings: [Camera Settings]</li>
            </ul>
            
            <h2>Post-Processing</h2>
            <p>Explain your editing process...</p>
            
            <h2>Tips and Techniques</h2>
            <p>Share photography tips...</p>
            
            <div class="before-after">
                [Insert before/after comparison]
            </div>
        `,
        'culinary': `
            <h1>Recipe Title</h1>
            <div class="meta">
                <span class="category">Recipes</span>
                <span class="prep-time">Prep: 20 mins</span>
                <span class="cook-time">Cook: 30 mins</span>
                <span class="servings">Serves: 4</span>
            </div>
            
            <div class="featured-image">
                [Insert dish photo here]
            </div>
            
            <h2>Ingredients</h2>
            <ul class="ingredients-list">
                <li>Ingredient 1</li>
                <li>Ingredient 2</li>
                <li>Ingredient 3</li>
            </ul>
            
            <h2>Instructions</h2>
            <ol class="instructions-list">
                <li>Step 1: Preparation...</li>
                <li>Step 2: Cooking...</li>
                <li>Step 3: Finishing...</li>
            </ol>
            
            <h2>Chef's Notes</h2>
            <p>Share cooking tips and variations...</p>
            
            <h2>Nutrition Information</h2>
            <div class="nutrition-info">
                <p>Calories: XXX</p>
                <p>Protein: XXg</p>
                <p>Carbs: XXg</p>
                <p>Fat: XXg</p>
            </div>
        `,
        'travel': `
            <h1>Travel Destination Title</h1>
            <div class="meta">
                <span class="location">City, Country</span>
                <span class="duration">Duration: X days</span>
                <span class="best-time">Best Time to Visit: Season</span>
            </div>
            
            <div class="featured-image">
                [Insert destination photo here]
            </div>
            
            <h2>Overview</h2>
            <p>Introduce the destination...</p>
            
            <div class="map-embed">
                [Insert location map here]
            </div>
            
            <h2>Highlights</h2>
            <ul>
                <li>Highlight 1</li>
                <li>Highlight 2</li>
                <li>Highlight 3</li>
            </ul>
            
            <h2>Itinerary</h2>
            <h3>Day 1</h3>
            <p>Detail the activities...</p>
            
            <h2>Where to Stay</h2>
            <p>Accommodation recommendations...</p>
            
            <h2>Local Tips</h2>
            <p>Share insider tips...</p>
            
            <h2>Travel Tips</h2>
            <ul>
                <li>Tip 1</li>
                <li>Tip 2</li>
                <li>Tip 3</li>
            </ul>
        `
    };

    return templates[templateType] || templates['tech-workspace'];
}

// Function to get template cards HTML
function getTemplateCardsHTML() {
    return `
        <div class="section">
            <h4 class="section-title">Popular Templates</h4>
            <div class="template-card" data-template="tech-workspace">
                <div class="template-category">
                    <div class="icon-wrapper">
                        <i class="fas fa-laptop-code"></i>
                    </div>
                    <span class="category-text">Technology</span>
                </div>
                <h3 class="template-title">Tech Workspace</h3>
                <p class="template-description">Perfect for tech tutorials, coding insights, and development journey.</p>
                <div class="template-meta">
                    <span class="meta-time"><i class="far fa-clock"></i> 5 min setup</span>
                    <span class="meta-rating"><i class="fas fa-star"></i> 4.9</span>
                </div>
                <button class="preview-btn" data-target="techPreview">
                    <i class="far fa-eye"></i> Preview
                </button>
            </div>

            <div class="template-card" data-template="coding">
                <div class="template-category">
                    <div class="icon-wrapper">
                        <i class="fas fa-code"></i>
                    </div>
                    <span class="category-text">Development</span>
                </div>
                <h3 class="template-title">Coding Blog</h3>
                <p class="template-description">Share your programming knowledge and coding experiences.</p>
                <div class="template-meta">
                    <span class="meta-time"><i class="far fa-clock"></i> 3 min setup</span>
                    <span class="meta-rating"><i class="fas fa-star"></i> 4.8</span>
                </div>
                <button class="preview-btn" data-target="codingPreview">
                    <i class="far fa-eye"></i> Preview
                </button>
            </div>
        </div>

        <div class="section">
            <h4 class="section-title">Creative Templates</h4>
            <div class="template-card" data-template="photography">
                <div class="template-category">
                    <div class="icon-wrapper">
                        <i class="fas fa-camera"></i>
                    </div>
                    <span class="category-text">Photography</span>
                </div>
                <h3 class="template-title">Photography Portfolio</h3>
                <p class="template-description">Showcase your photography work with a beautiful gallery layout.</p>
                <div class="template-meta">
                    <span class="meta-time"><i class="far fa-clock"></i> 4 min setup</span>
                    <span class="meta-rating"><i class="fas fa-star"></i> 4.7</span>
                </div>
                <button class="preview-btn" data-target="photographyPreview">
                    <i class="far fa-eye"></i> Preview
                </button>
            </div>
        </div>

        <div class="section">
            <h4 class="section-title">Lifestyle Templates</h4>
            <div class="template-card" data-template="mindfulness">
                <div class="template-category">
                    <div class="icon-wrapper">
                        <i class="fas fa-spa"></i>
                    </div>
                    <span class="category-text">Wellness</span>
                </div>
                <h3 class="template-title">Mindfulness & Wellness</h3>
                <p class="template-description">Share meditation practices and wellness tips for a balanced life.</p>
                <div class="template-meta">
                    <span class="meta-time"><i class="far fa-clock"></i> 3 min setup</span>
                    <span class="meta-rating"><i class="fas fa-star"></i> 4.6</span>
                </div>
                <button class="preview-btn" data-target="mindfulnessPreview">
                    <i class="far fa-eye"></i> Preview
                </button>
            </div>

            <div class="template-card" data-template="travel">
                <div class="template-category">
                    <div class="icon-wrapper">
                        <i class="fas fa-plane"></i>
                    </div>
                    <span class="category-text">Travel</span>
                </div>
                <h3 class="template-title">Travel Blog</h3>
                <p class="template-description">Document your adventures and share travel tips with fellow explorers.</p>
                <div class="template-meta">
                    <span class="meta-time"><i class="far fa-clock"></i> 4 min setup</span>
                    <span class="meta-rating"><i class="fas fa-star"></i> 4.7</span>
                </div>
                <button class="preview-btn" data-target="travelPreview">
                    <i class="far fa-eye"></i> Preview
                </button>
            </div>
        </div>
    `;
}

// Initialize editor with selected template
function initializeEditor(templateType) {
    try {
        // Remove any existing TinyMCE instance
        if (tinymce.get('editor')) {
            tinymce.remove('#editor');
        }

        // Create editor container if it doesn't exist
        let editorContainer = document.querySelector('#post-editor-container');
        if (!editorContainer) {
            editorContainer = document.createElement('div');
            editorContainer.id = 'post-editor-container';
            document.querySelector('#main-content').appendChild(editorContainer);
        }

        // Make editor container visible
        editorContainer.style.display = 'block';

        // Set up editor content
        editorContainer.innerHTML = `
            <div class="editor-header" style="
                position: sticky;
                top: 0;
                z-index: 100;
                background: white;
                padding: 16px;
                border-bottom: 1px solid #e1e4e8;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
                <input type="text" id="post-title" placeholder="Enter post title..." style="
                    flex: 1;
                    margin-right: 16px;
                    padding: 12px;
                    border: 1px solid #e1e4e8;
                    border-radius: 6px;
                    font-size: 18px;
                    font-weight: 500;
                    color: #2c3e50;
                    transition: all 0.3s ease;
                    &:focus {
                        outline: none;
                        border-color: #3498db;
                        box-shadow: 0 0 0 2px rgba(52,152,219,0.2);
                    }
                ">
                <div class="editor-actions" style="display: flex; gap: 12px;">
                    <button id="save-draft" style="
                        padding: 10px 20px;
                        border: 1px solid #e1e4e8;
                        border-radius: 6px;
                        background: white;
                        color: #2c3e50;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                        &:hover {
                            background: #f8f9fa;
                            border-color: #cbd5e0;
                        }
                    ">
                        <i class="fas fa-save"></i>
                        Save Draft
                    </button>
                    <button id="publish-post" style="
                        padding: 10px 20px;
                        border: none;
                        border-radius: 6px;
                        background: #3498db;
                        color: white;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                        &:hover {
                            background: #2980b9;
                        }
                    ">
                        <i class="fas fa-paper-plane"></i>
                        Publish
                    </button>
                    <button id="close-editor" style="
                        padding: 10px 20px;
                        border: none;
                        border-radius: 6px;
                        background: #e74c3c;
                        color: white;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                        &:hover {
                            background: #c0392b;
                        }
                    ">
                        <i class="fas fa-times"></i>
                        Close
                    </button>
                </div>
            </div>
            <div id="editor" style="padding: 20px;"></div>
        `;

        // Initialize TinyMCE with enhanced configuration
        tinymce.init({
            selector: '#editor',
            height: 600,
            menubar: true,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount', 'autosave'
            ],
            toolbar: 'undo redo | formatselect | ' +
                'bold italic backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | image media link | help',
            content_style: `
                body {
                    font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif;
                    font-size: 16px;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                h1, h2, h3, h4, h5, h6 {
                    color: #2c3e50;
                    margin-top: 24px;
                    margin-bottom: 16px;
                }
                p {
                    margin-bottom: 16px;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                }
            `,
            automatic_uploads: true,
            images_upload_handler: function (blobInfo, progress) {
                return new Promise((resolve, reject) => {
                    const storage = firebase.storage();
                    const ref = storage.ref('blog-images/' + Date.now() + '_' + blobInfo.filename());
                    ref.put(blobInfo.blob())
                        .then(snapshot => snapshot.ref.getDownloadURL())
                        .then(resolve)
                        .catch(reject);
                });
            },
            images_upload_url: null,
            file_picker_types: 'image',
            setup: function(editor) {
                editor.on('init', function() {
                    editor.setContent(getTemplateContent(templateType));
                });
            }
        });

        // Add event listeners for the buttons
        document.getElementById('close-editor').addEventListener('click', () => {
            if (confirm('Are you sure you want to close the editor? Any unsaved changes will be lost.')) {
                editorContainer.style.display = 'none';
                tinymce.remove('#editor');
            }
        });

        document.getElementById('save-draft').addEventListener('click', async () => {
            const editor = tinymce.get('editor');
            const title = document.getElementById('post-title').value.trim();
            const content = editor.getContent();

            if (!title) {
                showErrorToast('Please enter a title for your blog post');
                return;
            }

            try {
                const draft = {
                    title: title,
                    content: content,
                    status: 'draft'
                };

                // Save to localStorage first
                const drafts = JSON.parse(localStorage.getItem('blog_drafts') || '[]');
                drafts.push(draft);
                localStorage.setItem('blog_drafts', JSON.stringify(drafts));

                // Then try to save to Firebase
                console.log('Saving draft to Firebase...');
                const firebaseId = await saveToFirebase(draft);
                if (firebaseId) {
                    console.log('Draft saved successfully to Firebase with ID:', firebaseId);
                    showSuccessToast('Draft saved successfully!');
                } else {
                    console.warn('Draft saved to localStorage only');
                    showSuccessToast('Draft saved locally');
                }
            } catch (error) {
                console.error('Error saving draft:', error);
                showErrorToast('Failed to save draft: ' + error.message);
            }
        });

        document.getElementById('publish-post').addEventListener('click', async () => {
            const editor = tinymce.get('editor');
            const title = document.getElementById('post-title').value.trim();
            const content = editor.getContent();

            if (!title) {
                showErrorToast('Please enter a title for your blog post');
                return;
            }

            try {
                const post = {
                    title: title,
                    content: content,
                    status: 'published',
                    publishedAt: new Date().toISOString()
                };

                // Save to localStorage first
                const posts = JSON.parse(localStorage.getItem('blog_posts') || '[]');
                posts.push(post);
                localStorage.setItem('blog_posts', JSON.stringify(posts));

                // Then try to save to Firebase
                console.log('Publishing post to Firebase...');
                const firebaseId = await saveToFirebase(post);
                if (firebaseId) {
                    console.log('Post published successfully to Firebase with ID:', firebaseId);
                    showSuccessToast('Post published successfully!');
                } else {
                    console.warn('Post saved to localStorage only');
                    showSuccessToast('Post saved locally');
                }

                // Close the editor after successful publish
                const editorContainer = document.querySelector('#post-editor-container');
                if (editorContainer) {
                    editorContainer.style.display = 'none';
                    tinymce.remove('#editor');
                }
            } catch (error) {
                console.error('Error publishing post:', error);
                showErrorToast('Failed to publish post: ' + error.message);
            }
        });

    } catch (error) {
        console.error('Error initializing editor:', error);
        showErrorToast('Failed to initialize editor: ' + error.message);
    }
}

// Function to load drafts from Firestore
export async function loadDrafts() {
    try {
        const { db, auth } = getFirebaseServices();
        
        const user = auth.currentUser;
        if (!user) {
            showErrorToast('You must be logged in to view drafts');
            return [];
        }

        const querySnapshot = await db.collection('posts')
            .where('userId', '==', user.uid)
            .where('status', '==', 'draft')
            .orderBy('updatedAt', 'desc')
            .get();

        const drafts = [];
        querySnapshot.forEach((doc) => {
            drafts.push({ id: doc.id, ...doc.data() });
        });

        return drafts;
    } catch (error) {
        console.error('Error loading drafts:', error);
        showErrorToast('Failed to load drafts: ' + error.message);
        return [];
    }
}

// Function to load published posts from Firestore
export async function loadPublishedPosts() {
    try {
        const { db, auth } = getFirebaseServices();
        
        const user = auth.currentUser;
        if (!user) {
            showErrorToast('You must be logged in to view posts');
            return [];
        }

        const querySnapshot = await db.collection('posts')
            .where('userId', '==', user.uid)
            .where('status', '==', 'published')
            .orderBy('publishedAt', 'desc')
            .get();

        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() });
        });

        return posts;
    } catch (error) {
        console.error('Error loading posts:', error);
        showErrorToast('Failed to load posts: ' + error.message);
        return [];
    }
}

async function saveBlogPost(title, content, status = 'draft') {
    try {
        const { db, auth } = getFirebaseServices();
        
        // Ensure Firebase is initialized
        if (!firebase || !firebase.firestore) {
            throw new Error('Firebase is not initialized');
        }

        // Get the current user
        const user = auth.currentUser;
        if (!user) {
            showErrorToast('Please log in to save or publish posts');
            return null;
        }

        // Create the blog post object
        const blogPost = {
            title,
            content,
            status,
            userId: user.uid,
            authorName: user.displayName || 'Anonymous',
            authorEmail: user.email || 'anonymous@user.com',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            publishedAt: status === 'published' ? firebase.firestore.FieldValue.serverTimestamp() : null
        };

        console.log('Attempting to save blog post:', blogPost);

        // Add the document to Firestore
        const docRef = await db.collection('posts').add(blogPost);
        
        console.log('Successfully saved blog post with ID:', docRef.id);
        showSuccessToast(`Post ${status === 'draft' ? 'saved as draft' : 'published'} successfully!`);
        return docRef.id;
    } catch (error) {
        console.error('Error saving blog post:', error);
        if (error.code) {
            console.error('Error code:', error.code);
        }
        showErrorToast('Failed to save blog post: ' + error.message);
        throw error;
    }
}

// Function to load recent posts
export async function loadRecentPosts() {
    try {
        const { db, auth } = getFirebaseServices();
        const recentPostsList = document.querySelector('.recent-posts');
        
        if (!recentPostsList) {
            console.error('Recent posts list element not found');
            return;
        }

        // Get current user
        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in');
            recentPostsList.innerHTML = `
                <li class="post-item">
                    <p>Please log in to view your posts</p>
                </li>
            `;
            return;
        }

        // Show loading state
        recentPostsList.innerHTML = `
            <li class="post-item loading">
                <p>Loading your posts...</p>
            </li>
        `;

        try {
            // Simplified query that doesn't require a composite index
            const postsSnapshot = await db.collection('posts')
                .where('userId', '==', user.uid)
                .limit(5)
                .get();

            if (postsSnapshot.empty) {
                recentPostsList.innerHTML = `
                    <li class="post-item">
                        <p>You haven't created any posts yet. Click "New Post" to get started!</p>
                    </li>
                `;
                return;
            }

            // Clear the loading message
            recentPostsList.innerHTML = '';

            // Sort the posts in memory
            const posts = [];
            postsSnapshot.forEach(doc => {
                posts.push({ id: doc.id, ...doc.data() });
            });

            // Sort by createdAt timestamp in descending order
            posts.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });

            // Add each post to the list
            posts.forEach(post => {
                const postElement = createRecentPostElement(post.id, post);
                recentPostsList.appendChild(postElement);
            });

        } catch (error) {
            console.error('Error fetching posts:', error);
            recentPostsList.innerHTML = `
                <li class="post-item error">
                    <p>Error loading posts. Please try again later.</p>
                </li>
            `;
            throw error;
        }

    } catch (error) {
        console.error('Error loading recent posts:', error);
        showErrorToast('Failed to load recent posts: ' + error.message);
    }
}

// Function to handle refresh button click
function handleRefreshPosts() {
    const refreshButton = document.getElementById('refresh-posts');
    if (refreshButton) {
        refreshButton.addEventListener('click', async () => {
            // Add rotation animation to the refresh icon
            const refreshIcon = refreshButton.querySelector('i');
            if (refreshIcon) {
                refreshIcon.style.transition = 'transform 1s';
                refreshIcon.style.transform = 'rotate(360deg)';
                
                // Reset the rotation after animation
                setTimeout(() => {
                    refreshIcon.style.transition = 'none';
                    refreshIcon.style.transform = 'rotate(0deg)';
                }, 1000);
            }
            
            // Reload the posts
            await loadRecentPosts();
        });
    }
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Load initial posts
    loadRecentPosts();
    
    // Setup refresh button
    handleRefreshPosts();
});

// Function to create a recent post element
function createRecentPostElement(postId, post) {
    try {
        const li = document.createElement('li');
        li.className = 'post-item';
        li.setAttribute('data-post-id', postId);

        // Format date
        let publishDate = 'Draft';
        if (post.publishedAt) {
            try {
                // Handle both Firestore Timestamp and regular Date objects
                const date = post.publishedAt.toDate ? post.publishedAt.toDate() : new Date(post.publishedAt);
                publishDate = date.toLocaleDateString();
            } catch (error) {
                console.error('Error formatting date:', error);
                publishDate = 'Unknown date';
            }
        }

        // Ensure we have valid values for all fields
        const title = post.title || 'Untitled Post';
        const coverImage = post.coverImage || '../assests/images/placeholder.png';
        const views = post.views || 0;
        const commentCount = post.commentCount || 0;

        li.innerHTML = `
            <img src="${coverImage}" alt="Post Thumbnail" class="post-thumbnail">
            <div class="post-details">
                <h3 class="post-title">${title}</h3>
                <div class="post-meta">
                    <span><i class="far fa-calendar"></i> ${publishDate}</span>
                    <span><i class="far fa-eye"></i> ${views}</span>
                    <span><i class="far fa-comment"></i> ${commentCount}</span>
                </div>
            </div>
            <div class="post-actions">
                <button class="edit-post" data-id="${postId}"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete-post" data-id="${postId}"><i class="fas fa-trash"></i></button>
            </div>
        `;

        // Add event listeners for edit and delete
        const editButton = li.querySelector('.edit-post');
        const deleteButton = li.querySelector('.delete-post');

        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            handleEditPost(postId);
        });

        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDeletePost(postId);
        });

        return li;
    } catch (error) {
        console.error('Error creating post element:', error);
        // Return a fallback element if something goes wrong
        const fallbackLi = document.createElement('li');
        fallbackLi.className = 'post-item error';
        fallbackLi.innerHTML = '<p>Error loading post</p>';
        return fallbackLi;
    }
}

// Function to handle post deletion
async function handleDeletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const { db } = getFirebaseServices();
        await db.collection('posts').doc(postId).delete();
        await loadRecentPosts(); // Reload the posts list
    } catch (error) {
        console.error('Error deleting post:', error);
    }
}

// Function to handle post editing
function handleEditPost(postId) {
    // Redirect to edit page or open edit modal
    window.location.href = `edit-post.html?id=${postId}`;
}

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadRecentPosts();
        
        // Set up real-time listener for posts
        const { db, auth } = getFirebaseServices();
        const user = auth.currentUser;

        if (user) {
            db.collection('posts')
                .where('userId', '==', user.uid)
                .onSnapshot(() => {
                    loadRecentPosts(); // Reload posts when changes occur
                });
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}); 