// Remove all imports as we're using the compat version loaded via script tags

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB1FMx76cBLz8LZq8-ai765u2mV-caQQZg",
    authDomain: "cloudblog-12cb8.firebaseapp.com",
    databaseURL: "https://cloudblog-12cb8-default-rtdb.firebaseio.com",
    projectId: "cloudblog-12cb8",
    storageBucket: "cloudblog-12cb8.firebasestorage.app",
    messagingSenderId: "632917097509",
    appId: "1:632917097509:web:35791d6861771bd3fc93cc",
    measurementId: "G-4DFB318NC2"
};

// Initialize Firebase services
let db = null;
let auth = null;
let storage = null;
let analytics = null;
let database = null;

// Function to check if Firebase is initialized
export function isFirebaseInitialized() {
    return window.firebase && firebase.apps.length > 0;
}

// Function to initialize Firebase
function initializeFirebase() {
    try {
        if (!window.firebase) {
            console.error('Firebase SDK not loaded');
            return;
        }

        // Initialize Firebase app if it hasn't been initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Initialize services with error handling
        try {
            db = firebase.firestore();
            // Use the new recommended way to enable persistence with merge: true
            db.settings({
                merge: true,
                cache: {
                    persistenceEnabled: true,
                    persistenceSettings: {
                        synchronizeTabs: true
                    }
                }
            });

            auth = firebase.auth();
            storage = firebase.storage();
            analytics = firebase.analytics();
            database = firebase.database();

            // Set up auth state persistence
            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .catch(error => {
                    console.error('Error setting auth persistence:', error);
                });

            console.log('Firebase services initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase services:', error);
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
    }
}

// Initialize Firebase when the script loads
initializeFirebase();

// Export function to get Firebase services
export function getFirebaseServices() {
    if (!isFirebaseInitialized()) {
        console.error('Firebase not initialized');
        return null;
    }
    return {
        db,
        auth,
        storage,
        analytics,
        database
    };
}
