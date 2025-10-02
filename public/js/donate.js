function showDonateModal() {
    // Check if the modal already exists
    if (document.getElementById('donate-modal')) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'donate-modal';
    modal.style.cssText = `
        position: fixed;
        z-index: 1001;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const modalContent = document.createElement('div');
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const containerBg = theme === 'dark' ? 'rgba(42, 42, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)';
    const textColor = theme === 'dark' ? '#ecf0f1' : '#2c3e50';

    modalContent.style.cssText = `
        background: ${containerBg};
        color: ${textColor};
        margin: auto;
        padding: 30px;
        border-radius: 20px;
        width: 90%;
        max-width: 400px;
        text-align: center;
        position: relative;
        box-shadow: 0 20px 50px rgba(0,0,0,0.2);
    `;

    modalContent.innerHTML = `
        <span id="close-modal" style="position: absolute; top: 15px; right: 20px; color: ${textColor}; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
        <h2 style="color: ${textColor}; font-weight: 700; margin-bottom: 15px;">Support TeslaLink</h2>
        <p style="line-height: 1.7; margin-bottom: 20px;">Scan the QR code with your phone to open the Ko-fi page. Your support is greatly appreciated!</p>
        <img src="ko_fi_teslalink_qr.png" alt="Ko-fi QR Code" style="max-width: 200px; margin-bottom: 20px; border-radius: 12px;">
        <br>
        <a href="https://ko-fi.com/tristankuo" target="_blank" style="display: inline-block; padding: 12px 30px; text-decoration: none; background: #FF5E5B; color: white; border-radius: 50px; font-weight: bold; transition: all 0.3s ease;">Open Ko-fi Page</a>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal events
    const closeModal = () => document.body.removeChild(modal);
    document.getElementById('close-modal').onclick = closeModal;
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}
