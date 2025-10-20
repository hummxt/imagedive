async function downloadImage(url, filename) {
    try {
        const downloadingOverlay = document.createElement('div');
        downloadingOverlay.className = 'downloading';
        downloadingOverlay.textContent = 'Downloading...';
        downloadingOverlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 9999;
        `;
        document.body.appendChild(downloadingOverlay);

        const secureUrl = url.replace('http://', 'https://');

        const response = await fetch(secureUrl, {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('Downloaded file is empty');
        }
        const objectUrl = window.URL.createObjectURL(blob);
        if (typeof require !== "undefined") {
            const { ipcRenderer } = require("electron");
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const result = await ipcRenderer.invoke('download-image-with-dialog', {
                buffer: Array.from(buffer),
                filename: filename
            });
            if (result.success) {
                if (result.path) {
                    showDownloadSuccess(result.path);
                } else {
                    showDownloadSuccess();
                }
            } else {
                throw new Error(result.error);
            }
        } else {
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = objectUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            showDownloadSuccess();
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
                window.URL.revokeObjectURL(objectUrl);
            }, 1000);
        }
        if (document.body.contains(downloadingOverlay)) {
            document.body.removeChild(downloadingOverlay);
        }
        return true;
    } catch (error) {
        const downloadingOverlay = document.querySelector('.downloading');
        if (downloadingOverlay && document.body.contains(downloadingOverlay)) {
            document.body.removeChild(downloadingOverlay);
        }
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const backgrounds = document.querySelector('.backgrounds');
    if (!backgrounds) return;

    backgrounds.addEventListener('click', async (e) => {
        const dlIcon = e.target.closest('.download-icon');
        if (!dlIcon) return;
        const backgroundItem = e.target.closest('.background-item');
        if (!backgroundItem) return;
        e.preventDefault();
        e.stopPropagation();
        const originalUrl = backgroundItem.dataset.originalUrl;
        if (!originalUrl) {
            alert('Image URL not found. Please try again.');
            return;
        }
        const downloadStatus = await downloadImage(originalUrl, `wallpaper-${Date.now()}.jpg`);
        if (!downloadStatus) {
            showDownloadError();
        }
    });
});

function showDownloadSuccess(savedPath) {
    const notification = document.createElement('div');
    notification.className = 'download-notification success';
    const subtitle = savedPath ? `Saved to: ${savedPath}` : 'Image saved successfully';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </div>
            <div class="notification-text">
                <div class="notification-title">Download Complete!</div>
                <div class="notification-subtitle">${subtitle}</div>
        </div>
        <div class="notification-progress"></div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showDownloadError() {
    const notification = document.createElement('div');
    notification.className = 'download-notification error';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="notification-text">
                <div class="notification-title">Download Failed</div>
                <div class="notification-subtitle">Please try again later</div>
            </div>
        </div>
        <div class="notification-progress error-progress"></div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}