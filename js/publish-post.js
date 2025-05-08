import { getFirebaseServices, isFirebaseInitialized } from '../config/firebase.js';

async function publishPost() {
    try {
        // Wait for Firebase to be initialized
        while (!isFirebaseInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { db } = getFirebaseServices();
        const postsRef = db.collection('posts');
        
        // Get the draft post
        const querySnapshot = await postsRef
            .where('title', '==', 'hello123')
            .where('status', '==', 'draft')
            .get();

        if (querySnapshot.empty) {
            console.log('No matching post found');
            return;
        }

        // Update the post
        const postDoc = querySnapshot.docs[0];
        await postsRef.doc(postDoc.id).update({
            status: 'published',
            publishedAt: firebase.firestore.Timestamp.now()
        });

        console.log('Post published successfully!');

    } catch (error) {
        console.error('Error publishing post:', error);
    }
}

// Run the function
document.addEventListener('DOMContentLoaded', () => {
    publishPost();
}); 