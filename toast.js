// toast.js - Reusable Toast Notification System
(function() {
    if (window.showToast) return; // Prevent double-inclusion
    // Inject toast container if not present
    function ensureContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }
    // Inject CSS if not present
    function injectToastCSS() {
        if (document.getElementById('toast-css')) return;
        const style = document.createElement('style');
        style.id = 'toast-css';
        style.textContent = `
#toast-container {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
}
.toast {
    min-width: 260px;
    max-width: 340px;
    background: #fff;
    color: #1e293b;
    border-radius: 0.75rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1rem;
    font-weight: 500;
    opacity: 0;
    transform: translateY(-20px);
    animation: toast-in 0.3s forwards, toast-out 0.3s 3.7s forwards;
    pointer-events: auto;
}
.toast.toast-success { border-left: 6px solid #10b981; }
.toast.toast-error   { border-left: 6px solid #ef4444; }
.toast.toast-info    { border-left: 6px solid #6366f1; }
.toast.toast-warning { border-left: 6px solid #f59e0b; }
.toast .toast-icon   { font-size: 1.3em; }
@keyframes toast-in {
    to { opacity: 1; transform: translateY(0); }
}
@keyframes toast-out {
    to { opacity: 0; transform: translateY(-20px); }
}
        `;
        document.head.appendChild(style);
    }
    // Main toast function
    window.showToast = function(type, message) {
        injectToastCSS();
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error:   '<i class="fas fa-times-circle"></i>',
            info:    '<i class="fas fa-info-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
        };
        const container = ensureContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
        }, 3700);
    };
    // --- i18n (multi-language) support ---
    window._i18n = {};
    window.i18nTranslate = function(key) {
        const lang = localStorage.getItem('userLanguage') || 'en';
        return (window._i18n[lang] && window._i18n[lang][key]) || key;
    };
    window.i18nApply = function() {
        const lang = localStorage.getItem('userLanguage') || 'en';
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const k = el.getAttribute('data-i18n');
            el.textContent = window.i18nTranslate(k);
        });
    };
    async function loadI18n(lang) {
        if (window._i18n[lang]) return;
        try {
            const resp = await fetch(`./${lang}.json`);
            if (resp.ok) {
                window._i18n[lang] = await resp.json();
                localStorage.setItem('i18n_' + lang, JSON.stringify(window._i18n[lang]));
            }
        } catch {}
    }
    document.addEventListener('DOMContentLoaded', async function() {
        const lang = localStorage.getItem('userLanguage') || 'en';
        // Try cache first
        const cached = localStorage.getItem('i18n_' + lang);
        if (cached) window._i18n[lang] = JSON.parse(cached);
        await loadI18n(lang);
        window.i18nApply();
        window.addEventListener('storage', async function(e) {
            if (e.key === 'userLanguage') {
                await loadI18n(e.newValue);
                window.i18nApply();
            }
        });
    });
})(); 