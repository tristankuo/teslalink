
function createFooter() {
    const footerHTML = `
        <hr style="margin: 40px 0;">
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="/teslalink/" class="nav-link back-link">🏠 Home</a>
            <a href="/teslalink/about.html" class="nav-link">ℹ️ About</a>
            <a href="/teslalink/contact.html" class="nav-link">💬 Contact</a>
            <a href="/teslalink/privacy-policy.html" class="nav-link">🔒 Privacy Policy</a>
            <a href="/teslalink/terms-of-service.html" class="nav-link">📜 Terms of Service</a>
        </div>
        <p style="text-align: center; color: var(--text-muted); margin-top: 20px; font-size: 0.9em;">
            <em>TeslaLink is an independent project and is not affiliated with Tesla, Inc.</em>
        </p>
    `;
    const footerElement = document.createElement('footer');
    footerElement.innerHTML = footerHTML;
    document.body.appendChild(footerElement);

    // Adjust links for production vs. local
    const baseUrl = getBaseUrl();
    const links = footerElement.querySelectorAll('a.nav-link');
    links.forEach(link => {
        const originalHref = link.getAttribute('href');
        if (originalHref.startsWith('/teslalink/')) {
            link.href = baseUrl + originalHref.substring('/teslalink/'.length);
        }
    });
     // Adjust back link separately
     const backLink = footerElement.querySelector('a.back-link');
     if (backLink) {
         backLink.href = baseUrl;
     }
}

document.addEventListener('DOMContentLoaded', createFooter);
