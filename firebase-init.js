// Centralized Firebase initialization with mobile support
(function() {
    'use strict';
    
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyA8z_PPv0lJ5hUB2TK4j5MKmKExs_Rfc_w",
        authDomain: "last-c89dd.firebaseapp.com",
        projectId: "last-c89dd",
        storageBucket: "last-c89dd.appspot.com",
        messagingSenderId: "982991611164",
        appId: "1:982991611164:web:85e80958f49bfe214906d9",
        measurementId: "G-YFN0G4PFME"
    };

    // Global Firebase instance
    let firebaseApp = null;
    let firebaseAuth = null;
    let firebaseFirestore = null;
    let isInitialized = false;
    let initPromise = null;

    // Initialize Firebase with retry logic and mobile support
    function initializeFirebase() {
        if (initPromise) {
            return initPromise;
        }

        initPromise = new Promise((resolve, reject) => {
            // Check if Firebase is already loaded
            if (typeof firebase === 'undefined') {
                console.error('Firebase SDK not loaded');
                reject(new Error('Firebase SDK not loaded'));
                return;
            }

            // Additional check for Firebase apps
            if (!firebase.apps) {
                console.error('Firebase apps not available');
                reject(new Error('Firebase apps not available'));
                return;
            }

            try {
                // Check if Firebase is already initialized
                if (firebase.apps.length > 0) {
                    firebaseApp = firebase.apps[0];
                    console.log('Firebase already initialized');
                } else {
                    // Initialize Firebase with error handling
                    firebaseApp = firebase.initializeApp(firebaseConfig);
                    console.log('Firebase initialized successfully');
                }

                // Initialize Auth and Firestore with additional checks
                if (firebase.auth) {
                    firebaseAuth = firebase.auth();
                } else {
                    throw new Error('Firebase Auth not available');
                }
                
                if (firebase.firestore) {
                    firebaseFirestore = firebase.firestore();
                } else {
                    throw new Error('Firebase Firestore not available');
                }
                
                // Enable offline persistence for mobile
                if (firebaseFirestore) {
                    firebaseFirestore.enablePersistence({
                        synchronizeTabs: true
                    }).catch(function(err) {
                        if (err.code === 'failed-precondition') {
                            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
                        } else if (err.code === 'unimplemented') {
                            console.warn('The current browser does not support persistence.');
                        }
                    });
                }

                isInitialized = true;
                resolve({
                    app: firebaseApp,
                    auth: firebaseAuth,
                    firestore: firebaseFirestore
                });

            } catch (error) {
                console.error('Firebase initialization error:', error);
                reject(error);
            }
        });

        return initPromise;
    }

    // Get Firebase instances
    function getFirebase() {
        if (!isInitialized) {
            throw new Error('Firebase not initialized. Call initializeFirebase() first.');
        }
        return {
            app: firebaseApp,
            auth: firebaseAuth,
            firestore: firebaseFirestore
        };
    }

    // Check if Firebase is ready
    function isFirebaseReady() {
        return isInitialized && firebaseApp && firebaseAuth && firebaseFirestore;
    }

    // Wait for Firebase to be ready
    function waitForFirebase() {
        return new Promise((resolve, reject) => {
            if (isFirebaseReady()) {
                resolve(getFirebase());
                return;
            }

            // Try to initialize if not already done
            initializeFirebase()
                .then(resolve)
                .catch((error) => {
                    console.warn('Firebase initialization failed, retrying...', error);
                    // Retry once after a short delay
                    setTimeout(() => {
                        initializeFirebase()
                            .then(resolve)
                            .catch(reject);
                    }, 1000);
                });
        });
    }

    // Auto-initialize when DOM is ready
    function autoInitialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeFirebase);
        } else {
            initializeFirebase();
        }
    }

    // Expose functions globally
    window.FirebaseManager = {
        initialize: initializeFirebase,
        getFirebase: getFirebase,
        isReady: isFirebaseReady,
        waitForReady: waitForFirebase,
        config: firebaseConfig
    };

    // Auto-initialize
    autoInitialize();

    // Handle mobile-specific issues
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        console.log('Mobile device detected, applying mobile-specific Firebase settings');
        
        // Add mobile-specific error handling
        window.addEventListener('online', function() {
            console.log('Device is online, reconnecting Firebase...');
            if (firebaseFirestore) {
                firebaseFirestore.enableNetwork();
            }
        });

        window.addEventListener('offline', function() {
            console.log('Device is offline, Firebase will work offline');
        });
    }

})(); 