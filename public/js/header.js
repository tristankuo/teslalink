
function createHeader() {
    const headerHTML = `
        <button id="theme-toggle" class="theme-toggle" onclick="toggleTheme()">🌙 Dark</button>
        <div class="container" style="margin-bottom: 0; padding-bottom: 0;">
            <a href="/teslalink/" class="nav-link back-link">← Back to TeslaLink</a>
        </div>
    `;
    const headerElement = document.createElement('header');
    headerElement.innerHTML = headerHTML;
    // Insert header at the beginning of the body
    document.body.insertBefore(headerElement, document.body.firstChild);
}

document.addEventListener('DOMContentLoaded', createHeader);
