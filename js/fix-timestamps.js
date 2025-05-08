import { getFirebaseServices, isFirebaseInitialized } from '../config/firebase.js';

async function fixTimestamps() {
    try {
        // Wait for Firebase to be initialized
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { db } = getFirebaseServices();
        const postsRef = db.collection('posts');
        
        // Get all posts
        const querySnapshot = await postsRef.get();

        // Update each post
        const updatePromises = querySnapshot.docs.map(async (doc) => {
            const post = doc.data();
            
            // Only update if publishedAt is not a proper timestamp
            if (post.publishedAt && typeof post.publishedAt.toDate !== 'function') {
                // Create a new timestamp
                const timestamp = new Date();
                
                // Update the document
                await postsRef.doc(doc.id).update({
                    publishedAt: db.Timestamp.fromDate(timestamp)
                });
                
                console.log(`Updated timestamp for post: ${doc.id}`);
            }
        });

        await Promise.all(updatePromises);
        console.log('All posts have been updated successfully');

    } catch (error) {
        console.error('Error updating posts:', error);
    }
}

// Run the function
document.addEventListener('DOMContentLoaded', () => {
    fixTimestamps();
}); 