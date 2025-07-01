// Theme management for HipoBudget
function applyTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    const themeColor = localStorage.getItem('themeColor') || 'indigo';
    
    // Apply theme class
    document.body.classList.toggle('dark-theme', theme === 'dark');
    
    // Set CSS variables based on theme color
    let primaryColor, primaryDarkColor;
    switch(themeColor) {
        case 'emerald':
            primaryColor = '#10b981';
            primaryDarkColor = '#059669';
            break;
        case 'amber':
            primaryColor = '#f59e0b';
            primaryDarkColor = '#d97706';
            break;
        case 'red':
            primaryColor = '#ef4444';
            primaryDarkColor = '#dc2626';
            break;
        case 'violet':
            primaryColor = '#8b5cf6';
            primaryDarkColor = '#7c3aed';
            break;
        default: // indigo
            primaryColor = '#6366f1';
            primaryDarkColor = '#4f46e5';
    }
    
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--primary-dark', primaryDarkColor);
    
    // Dispatch theme change event
    const event = new CustomEvent('themeChanged', {
        detail: { theme, themeColor }
    });
    window.dispatchEvent(event);
}

function initThemeToggle(toggleBtnId = 'theme-toggle', iconId = 'theme-icon') {
    const themeToggle = document.getElementById(toggleBtnId);
    const themeIcon = document.getElementById(iconId);
    
    function setTheme(mode) {
        localStorage.setItem('theme', mode);
        applyTheme();
        
        if (themeIcon) {
            themeIcon.className = mode === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        if (themeToggle) {
            themeToggle.classList.toggle('active', mode === 'dark');
        }
    }
    
    // Initialize from localStorage
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
    
    // Set up toggle handler
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
}

function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3), 16);
    let G = parseInt(color.substring(3,5), 16);
    let B = parseInt(color.substring(5,7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = Math.min(255, Math.max(0, R));
    G = Math.min(255, Math.max(0, G));
    B = Math.min(255, Math.max(0, B));

    const RR = R.toString(16).padStart(2, '0');
    const GG = G.toString(16).padStart(2, '0');
    const BB = B.toString(16).padStart(2, '0');

    return `#${RR}${GG}${BB}`;
}

function getUserCurrency() {
    return localStorage.getItem('userCurrency') || 'USD';
}

// Patch global formatCurrency to always use the user's currency from localStorage (like transaction page)
window.formatCurrency = function(amount) {
    const currency = window.getUserCurrency ? window.getUserCurrency() : (localStorage.getItem('userCurrency') || 'TZS');
    if (currency === 'TZS') {
        return 'Tsh ' + Number(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Initialize theme when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    
    // Watch for changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme' || e.key === 'themeColor') {
            applyTheme();
        }
    });
});

// Export functions
window.initThemeToggle = initThemeToggle;
window.applyTheme = applyTheme;
window.getUserCurrency = getUserCurrency;

// --- Global Notification Mirroring Helper ---
window.addNotification = async function({ type, title, description, userId }) {
    try {
        // Wait for Firebase to be ready
        if (window.FirebaseManager) {
            const firebaseInstance = await window.FirebaseManager.waitForReady();
            await firebaseInstance.firestore.collection('notifications').add({
                type,
                title,
                description,
                status: 'unread',
                createdAt: firebaseInstance.firestore.FieldValue.serverTimestamp(),
                userId: userId || null
            });
        }
    } catch (err) {
        // Optionally log or ignore
        console.warn('Failed to add notification:', err);
    }
};

// --- Global Admin Settings Loader ---
window.adminSettings = {
    currency: 'USD',
    language: 'en',
    loaded: false
};

window.loadAdminSettings = async function(force = false) {
    if (window.adminSettings.loaded && !force) return window.adminSettings;
    
    try {
        if (window.FirebaseManager) {
            const firebaseInstance = await window.FirebaseManager.waitForReady();
            const doc = await firebaseInstance.firestore.collection('settings').doc('general').get();
            if (doc.exists) {
                const data = doc.data();
                window.adminSettings.currency = data.currency || 'USD';
                window.adminSettings.language = data.language || 'en';
                window.adminSettings.loaded = true;
            }
            
            // Set up Firebase listeners after successfully loading settings
            // This ensures Firebase is ready before setting up listeners
            if (window.setupFirebaseListeners) {
                window.setupFirebaseListeners();
            }
        }
    } catch (e) {
        console.warn('Failed to load admin settings:', e);
        window.adminSettings.currency = 'USD';
        window.adminSettings.language = 'en';
        window.adminSettings.loaded = true;
    }
    return window.adminSettings;
};

// Helper to get current app currency (admin-wide)
window.getAppCurrency = function() {
    return window.adminSettings.currency || 'USD';
};

// Helper to get current app language (admin-wide)
window.getAppLanguage = function() {
    return window.adminSettings.language || 'en';
};

// Listen for settings changes and update cache - only if Firebase is available
async function setupFirebaseListeners() {
    try {
        // Check if FirebaseManager is available
        if (!window.FirebaseManager) {
            console.warn('FirebaseManager not available, skipping listener setup');
            return;
        }
        
        // Wait for Firebase to be ready with timeout
        const firebaseInstance = await Promise.race([
            window.FirebaseManager.waitForReady(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 5000))
        ]);
        
        firebaseInstance.firestore.collection('settings').doc('general')
            .onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    window.adminSettings.currency = data.currency || 'USD';
                    window.adminSettings.language = data.language || 'en';
                    window.adminSettings.loaded = true;
                }
            }, error => {
                console.warn('Settings listener error:', error);
            });
    } catch (err) {
        console.warn('Failed to set up settings listener:', err);
    }
}

// Don't automatically set up Firebase listeners - only when explicitly called
// This prevents Firebase errors when theme.js loads before Firebase is ready
window.setupFirebaseListeners = setupFirebaseListeners;

// --- Global Toast Notification Helper ---
document.addEventListener('DOMContentLoaded', function() {
(function() {
    if (document.getElementById('global-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.minWidth = '220px';
    toast.style.maxWidth = '90vw';
    toast.style.padding = '1rem 1.5rem';
    toast.style.borderRadius = '0.75rem';
    toast.style.fontSize = '1rem';
    toast.style.fontWeight = '500';
    toast.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
    toast.style.zIndex = '9999';
    toast.style.display = 'none';
    toast.style.transition = 'opacity 0.3s, bottom 0.3s';
    document.body.appendChild(toast);

    const typeStyles = {
        success: 'background:#10b981;color:#fff;',
        error: 'background:#ef4444;color:#fff;',
        info: 'background:#3b82f6;color:#fff;',
        warning: 'background:#f59e0b;color:#fff;'
    };
    window.showToast = function(type, message) {
        toast.style = toast.style.cssText + (typeStyles[type] || typeStyles.info);
        toast.textContent = message;
        toast.style.display = 'block';
        toast.style.opacity = '1';
        toast.style.bottom = '2rem';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.bottom = '0.5rem';
            setTimeout(() => { toast.style.display = 'none'; }, 400);
        }, 2500);
    };
})();
});

window.getUserPlanPermissions = async function(uid) {
    if (!uid) return {};
    try {
        if (window.FirebaseManager) {
            const firebaseInstance = await window.FirebaseManager.waitForReady();
            const doc = await firebaseInstance.firestore.collection('users').doc(uid).collection('permissions').doc('planFeatures').get();
            return doc.exists ? doc.data() : {};
        }
    } catch (err) { 
        console.warn('Failed to get user plan permissions:', err);
        return {}; 
    }
    return {};
}; 