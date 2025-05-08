import { getFirebaseServices } from '../../config/firebase.js';

// Function to update post statistics
export async function updatePostStats(userId, increment = 1) {
    try {
        const { db } = getFirebaseServices();
        const statsRef = db.collection('userStats').doc(userId);
        
        await db.runTransaction(async (transaction) => {
            const statsDoc = await transaction.get(statsRef);
            if (!statsDoc.exists) {
                throw new Error('User statistics document does not exist');
            }

            const currentStats = statsDoc.data();
            transaction.update(statsRef, {
                totalPosts: (currentStats.totalPosts || 0) + increment,
                lastUpdated: new Date()
            });
        });
    } catch (error) {
        console.error('Error updating post statistics:', error);
    }
}

// Function to update view statistics
export async function updateViewStats(userId, increment = 1) {
    try {
        const { db } = getFirebaseServices();
        const statsRef = db.collection('userStats').doc(userId);
        
        await db.runTransaction(async (transaction) => {
            const statsDoc = await transaction.get(statsRef);
            if (!statsDoc.exists) {
                throw new Error('User statistics document does not exist');
            }

            const currentStats = statsDoc.data();
            transaction.update(statsRef, {
                totalViews: (currentStats.totalViews || 0) + increment,
                lastUpdated: new Date()
            });
        });
    } catch (error) {
        console.error('Error updating view statistics:', error);
    }
}

// Function to update comment statistics
export async function updateCommentStats(userId, increment = 1) {
    try {
        const { db } = getFirebaseServices();
        const statsRef = db.collection('userStats').doc(userId);
        
        await db.runTransaction(async (transaction) => {
            const statsDoc = await transaction.get(statsRef);
            if (!statsDoc.exists) {
                throw new Error('User statistics document does not exist');
            }

            const currentStats = statsDoc.data();
            transaction.update(statsRef, {
                totalComments: (currentStats.totalComments || 0) + increment,
                lastUpdated: new Date()
            });
        });
    } catch (error) {
        console.error('Error updating comment statistics:', error);
    }
}

// Function to update subscriber statistics
export async function updateSubscriberStats(userId, increment = 1) {
    try {
        const { db } = getFirebaseServices();
        const statsRef = db.collection('userStats').doc(userId);
        
        await db.runTransaction(async (transaction) => {
            const statsDoc = await transaction.get(statsRef);
            if (!statsDoc.exists) {
                throw new Error('User statistics document does not exist');
            }

            const currentStats = statsDoc.data();
            transaction.update(statsRef, {
                totalSubscribers: (currentStats.totalSubscribers || 0) + increment,
                lastUpdated: new Date()
            });
        });
    } catch (error) {
        console.error('Error updating subscriber statistics:', error);
    }
} 