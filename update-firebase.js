const fs = require('fs');
const path = require('path');

// Files that need updating
const filesToUpdate = [
    'users.html',
    'admin-trans.html', 
    'admin-settings.html',
    'analytics.html',
    'notifications.html',
    'Admin.html'
];

// Firebase initialization replacement
const firebaseInitReplacement = `    <script src="firebase-init.js"></script>
    <script>
    // Get Firebase instances from centralized manager
    let auth, db;
    
    // Initialize Firebase and get instances
    async function initializeFirebase() {
        try {
            const firebaseInstance = await window.FirebaseManager.waitForReady();
            auth = firebaseInstance.auth;
            db = firebaseInstance.firestore;
            console.log('Firebase initialized successfully in this page');
        } catch (error) {
            console.error('Firebase initialization error:', error);
        }
    }`;

// Old Firebase initialization pattern
const oldFirebasePattern = /    <script>\s*\/\/ Firebase config\s*const firebaseConfig = \{[\s\S]*?\};\s*if \(typeof firebase !== 'undefined' && firebase\.apps\.length === 0\) \{[\s\S]*?firebase\.initializeApp\(firebaseConfig\);\s*\}\s*const auth = firebase\.auth\(\);\s*const db = firebase\.firestore\(\);/g;

filesToUpdate.forEach(filename => {
    const filePath = path.join(__dirname, filename);
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if file already has firebase-init.js
        if (content.includes('firebase-init.js')) {
            console.log(`${filename} already updated`);
            return;
        }
        
        // Replace old Firebase initialization
        const newContent = content.replace(oldFirebasePattern, firebaseInitReplacement);
        
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated ${filename}`);
        } else {
            console.log(`No changes needed for ${filename}`);
        }
    } else {
        console.log(`File not found: ${filename}`);
    }
});

console.log('Firebase initialization update complete!'); 