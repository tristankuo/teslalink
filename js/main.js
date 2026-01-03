// Theme management
function getStoredTheme() {
    return localStorage.getItem('teslalink_theme') || 
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// Environment-aware navigation
function getBaseUrl() {
    // Environment-aware base URL detection
    const hostname = window.location.hostname;
    
    // Staging environment (GitHub Pages subdirectory)
    if (hostname === 'your-username.github.io') {
        return '/teslalink/';
    }
    
    // Production and local development
    return '/';
}

function updateInternalLinks() {
    const baseUrl = getBaseUrl();
    // If we are on the root domain (e.g., Firebase), no changes are needed for root-relative links.
    if (baseUrl === '/') return;

    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        // Check if it's a root-relative link (starts with / but not //)
        if (href && href.startsWith('/') && !href.startsWith('//')) {
            // Prepend the base URL, removing the leading slash from the original href
            link.href = baseUrl + href.slice(1);
        }
    });
}

// Initialize everything on load
document.addEventListener('DOMContentLoaded', function() {
    setTheme(getStoredTheme());
    updateInternalLinks();
});
