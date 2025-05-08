import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase.js';

// Function to save blog post to Firebase
export async function saveBlogPost(title, content, isPublished = false) {
    try {
        // Check if user is authenticated
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to save posts');
        }

        // Create the blog post object
        const blogPost = {
            title: title,
            content: content,
            authorId: user.uid,
            authorName: user.displayName || 'Anonymous',
            authorEmail: user.email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: isPublished ? 'published' : 'draft',
            metadata: {
                wordCount: content.split(' ').length,
                readingTime: Math.ceil(content.split(' ').length / 200), // Assuming 200 words per minute
                hasImages: content.includes('<img')
            }
        };

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'posts'), blogPost);
        return docRef.id;
    } catch (error) {
        console.error('Error saving post to Firebase:', error);
        throw error;
    }
}

// Function to check if user is authenticated
export function isUserAuthenticated() {
    return auth.currentUser !== null;
}

// Function to get current user details
export function getCurrentUser() {
    const user = auth.currentUser;
    if (!user) return null;
    
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL
    };
} 