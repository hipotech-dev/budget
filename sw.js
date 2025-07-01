const CACHE_NAME = 'hipobudget-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/transaction.html',
    '/budget.html',
    '/goals.html',
    '/Reports.html',
    '/settings.html',
    '/theme.js',
    '/toast.js',
    '/firebase-init.js',
    '/en.json',
    '/fr.json',
    '/sw.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
    );
});

self.addEventListener('fetch', event => {
    // Skip unsupported schemes
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        // Clone the response
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                if (event.request.url.startsWith('http')) {
                                    cache.put(event.request, responseToCache);
                                }
                            });
                        return response;
                    });
            })
    );
}); 