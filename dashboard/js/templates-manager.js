import { getFirebaseServices } from '../../config/firebase.js';
import { showSuccessToast, showErrorToast } from '../notification.js';

class TemplatesManager {
    constructor() {
        this.db = getFirebaseServices().db;
        this.currentUser = null;
        this.templates = [];
        this.initialize();
    }

    async initialize() {
        try {
            const { auth } = getFirebaseServices();
            this.currentUser = auth.currentUser;
            
            if (this.currentUser) {
                await this.loadTemplates();
            }
            
            auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    this.loadTemplates();
                }
            });
        } catch (error) {
            console.error('Error initializing templates manager:', error);
            showErrorToast('Failed to initialize templates manager');
        }
    }

    async loadTemplates() {
        try {
            if (!this.currentUser) {
                console.error('No authenticated user found');
                return;
            }

            const templatesRef = this.db.collection('templates')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('createdAt', 'desc');

            templatesRef.onSnapshot((snapshot) => {
                this.templates = [];
                snapshot.forEach((doc) => {
                    this.templates.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.renderTemplates();
            }, (error) => {
                console.error('Error in templates snapshot:', error);
                showErrorToast('Failed to load templates');
            });
        } catch (error) {
            console.error('Error loading templates:', error);
            showErrorToast('Failed to load templates');
        }
    }

    async createTemplate(templateData) {
        try {
            await this.db.collection('templates').add({
                ...templateData,
                userId: this.currentUser.uid,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            showSuccessToast('Template created successfully');
        } catch (error) {
            console.error('Error creating template:', error);
            showErrorToast('Failed to create template');
        }
    }

    async updateTemplate(templateId, templateData) {
        try {
            await this.db.collection('templates')
                .doc(templateId)
                .update({
                    ...templateData,
                    updatedAt: new Date()
                });
            
            showSuccessToast('Template updated successfully');
        } catch (error) {
            console.error('Error updating template:', error);
            showErrorToast('Failed to update template');
        }
    }

    async deleteTemplate(templateId) {
        try {
            await this.db.collection('templates')
                .doc(templateId)
                .delete();
            
            showSuccessToast('Template deleted successfully');
        } catch (error) {
            console.error('Error deleting template:', error);
            showErrorToast('Failed to delete template');
        }
    }

    async useTemplate(templateId) {
        try {
            const templateDoc = await this.db.collection('templates')
                .doc(templateId)
                .get();
            
            if (templateDoc.exists) {
                const template = templateDoc.data();
                // Navigate to post editor with template data
                window.location.href = `post-editor.html?template=${templateId}`;
            }
        } catch (error) {
            console.error('Error using template:', error);
            showErrorToast('Failed to use template');
        }
    }

    renderTemplates() {
        const templatesContainer = document.querySelector('.templates-container');
        if (!templatesContainer) return;

        templatesContainer.innerHTML = this.templates.map(template => `
            <div class="template-item" data-id="${template.id}">
                <div class="template-preview">
                    <div class="template-content">
                        <h3>${template.title}</h3>
                        <p>${template.description || 'No description'}</p>
                    </div>
                </div>
                <div class="template-info">
                    <p class="template-date">
                        Created: ${new Date(template.createdAt.toDate()).toLocaleDateString()}
                    </p>
                    <p class="template-category">
                        Category: ${template.category || 'Uncategorized'}
                    </p>
                </div>
                <div class="template-actions">
                    <button class="btn btn-primary use-template">
                        <i class="fas fa-file-alt"></i> Use Template
                    </button>
                    <button class="btn btn-icon edit-template">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon delete-template">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.addEventListeners();
    }

    addEventListeners() {
        // Use template buttons
        document.querySelectorAll('.use-template').forEach(button => {
            button.addEventListener('click', (e) => {
                const templateItem = e.currentTarget.closest('.template-item');
                const templateId = templateItem.dataset.id;
                this.useTemplate(templateId);
            });
        });

        // Edit template buttons
        document.querySelectorAll('.edit-template').forEach(button => {
            button.addEventListener('click', (e) => {
                const templateItem = e.currentTarget.closest('.template-item');
                const templateId = templateItem.dataset.id;
                this.showEditTemplateModal(templateId);
            });
        });

        // Delete template buttons
        document.querySelectorAll('.delete-template').forEach(button => {
            button.addEventListener('click', (e) => {
                const templateItem = e.currentTarget.closest('.template-item');
                const templateId = templateItem.dataset.id;
                
                if (confirm('Are you sure you want to delete this template?')) {
                    this.deleteTemplate(templateId);
                }
            });
        });
    }

    showEditTemplateModal(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Template</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-template-form">
                        <div class="form-group">
                            <label for="template-title">Title</label>
                            <input type="text" id="template-title" value="${template.title}" required>
                        </div>
                        <div class="form-group">
                            <label for="template-description">Description</label>
                            <textarea id="template-description">${template.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="template-category">Category</label>
                            <input type="text" id="template-category" value="${template.category || ''}">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                            <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        const form = modal.querySelector('#edit-template-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const templateData = {
                title: form.querySelector('#template-title').value,
                description: form.querySelector('#template-description').value,
                category: form.querySelector('#template-category').value
            };
            this.updateTemplate(templateId, templateData);
            modal.remove();
        });

        modal.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => {
                modal.remove();
            });
        });
    }
}

// Initialize templates manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.templates-container')) {
        new TemplatesManager();
    }
}); 