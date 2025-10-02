
function createFooter() {
    // Since this is for static pages, we'll hardcode the light theme styles.
    const footerHTML = `
        <div class="footer-container" style="background: rgba(255,255,255,0.3); border-radius: 12px; backdrop-filter: blur(10px); padding: 20px; margin-top: 40px;">
            
            <div style="text-align: center; margin-bottom: 20px;">
                <a href="https://ko-fi.com/teslalink" target="_blank" rel="noopener noreferrer" style="font-size: 14px; color: #ff5f5f; text-decoration: underline; background: none; border: none; cursor: pointer; padding: 0;">
                    ❤️ Support TeslaLink Development
                </a>
            </div>

            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-bottom: 20px;">
                <a href="about.html" class="footer-link" style="color: #000000; text-decoration: none; padding: 8px 16px; background: rgba(0,0,0,0.1); border-radius: 6px; font-size: 14px;">
                    📖 About
                </a>
                <a href="tesla-apps-guide.html" class="footer-link" style="color: #000000; text-decoration: none; padding: 8px 16px; background: rgba(0,0,0,0.1); border-radius: 6px; font-size: 14px;">
                    🚗 User Guide
                </a>
                <a href="tesla-browser-tips.html" class="footer-link" style="color: #000000; text-decoration: none; padding: 8px 16px; background: rgba(0,0,0,0.1); border-radius: 6px; font-size: 14px;">
                    💡 Browser Tips
                </a>
                <a href="contact.html" class="footer-link" style="color: #000000; text-decoration: none; padding: 8px 16px; background: rgba(0,0,0,0.1); border-radius: 6px; font-size: 14px;">
                    💬 Contact Us
                </a>
            </div>

            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; font-size: 12px; color: #7f8c8d;">
                <a href="privacy-policy.html" class="footer-link-small" style="color: inherit; text-decoration: none;">
                    Privacy Policy
                </a>
                <span>•</span>
                <a href="terms-of-service.html" class="footer-link-small" style="color: inherit; text-decoration: none;">
                    Terms of Service
                </a>
                <span>•</span>
                <span>© 2025 TeslaLink - Tesla App Hub</span>
            </div>
        </div>
        <style>
            .footer-link:hover, .footer-link-small:hover {
                text-decoration: underline !important;
            }
        </style>
    `;
    const footerElement = document.createElement('footer');
    footerElement.innerHTML = footerHTML;
    document.body.appendChild(footerElement);
}

document.addEventListener('DOMContentLoaded', createFooter);

