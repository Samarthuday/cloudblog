import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test data
const testUser = {
    uid: 'test-user-1',
    data: {
        displayName: 'Test User',
        photoURL: '../assests/images/avatar-svgrepo-com.svg',
        email: 'test@example.com'
    }
};

const testPost = {
    title: 'Test Blog Post',
    content: 'This is a test blog post content.',
    status: 'published',
    publishedAt: Timestamp.now(),
    userId: testUser.uid,
    excerpt: 'This is a test blog post.',
    coverImage: 'https://via.placeholder.com/800x400'
};

// Add test data
async function addTestData() {
    try {
        // Add test user
        await setDoc(doc(db, 'users', testUser.uid), testUser.data);
        console.log('Test user added successfully');

        // Add test post
        const postDoc = doc(collection(db, 'posts'));
        await setDoc(postDoc, testPost);
        console.log('Test post added successfully');

    } catch (error) {
        console.error('Error adding test data:', error);
    }
}

// Run the function
addTestData(); 