
// Handler for managing Spark downloads

const REPO_OWNER = 'samobeng';
const REPO_NAME = 'Spark-binaries';
const API_RELEASES_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`;
const UPDATE_INTERVAL_MS = 5 * 60 * 1000;

const DOWNLOAD_URLS = {
    'macos-arm64': 'https://github.com/samobeng/Spark-binaries/releases/download/Spark/Spark.dmg.zip',
    'macos-x64':   'https://github.com/samobeng/Spark-binaries/releases/download/Spark/Spark-x86_64.dmg',
    'windows':     'https://github.com/samobeng/Spark-binaries/releases/download/Spark/Spark-Windows-Installer.zip'
};

const macBtn = document.getElementById('macDownloadButton');
const winBtn = document.getElementById('windowsDownloadButton');
const platformInfoElement = document.getElementById('platformInfo');
const downloadCountElement = document.getElementById('downloadCount');
const statusMessageElement = document.getElementById('statusMessage');
const lastUpdatedElement = document.getElementById('lastUpdated');

const messageBox = document.getElementById('messageBox');
const messageBoxContent = document.getElementById('messageBoxContent');
const messageBoxClose = document.getElementById('messageBoxClose');
const messageOverlay = document.getElementById('messageOverlay');

function showMessage(message, { allowHTML = false } = {}) {
    if (allowHTML) {
        messageBoxContent.innerHTML = message;
    } else {
        messageBoxContent.textContent = message;
    }
    messageBox.style.display = 'flex';
    messageOverlay.style.display = 'block';
}

messageBoxClose.addEventListener('click', () => {
    messageBox.style.display = 'none';
    messageOverlay.style.display = 'none';
});

function triggerDownload(url) {
    try {
        // Open in a new tab to force download prompt from GitHub
        window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
        console.error('Download failed:', e);
        showMessage(
            'Automatic download was blocked.<br/><br/>' +
            '<a href="' + url + '" target="_blank" rel="noopener noreferrer" style="color:#DB5527;text-decoration:underline;">Click here to download manually.</a>',
            { allowHTML: true }
        );
    }
}

function attachDownloadHandler(button, url) {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        triggerDownload(url);
    });
}

async function getDetectedPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    if (navigator.userAgentData) {
        try {
            const uaData = await navigator.userAgentData.getHighEntropyValues(['platform', 'architecture']);
            const os = uaData.platform.toLowerCase();
            const arch = (uaData.architecture || 'x64').toLowerCase();
            if (os === 'macos') return arch.includes('arm') ? 'macos-arm64' : 'macos-x64';
            if (os.includes('windows')) return 'windows';
        } catch (e) {
            console.warn('Error accessing userAgentData:', e);
        }
    }

    if (userAgent.includes('windows') || platform.includes('win')) return 'windows';
    if (userAgent.includes('macintosh') || platform.includes('mac')) {
        if (userAgent.includes('arm64') || userAgent.includes('aarch64')) return 'macos-arm64';
        return 'macos-x64';
    }
    return 'unknown';
}

async function updateDownloadButtonsAndInfo() {
    const detected = await getDetectedPlatform();
    macBtn.style.display = 'none';
    winBtn.style.display = 'none';

    if (detected === 'macos-arm64') {
        platformInfoElement.innerHTML = 'Detected: <span class="platform-indicator">macOS (Apple Silicon)</span>';
        macBtn.textContent = 'Download for macOS (Apple Silicon)';
        macBtn.style.display = 'inline-flex';
        attachDownloadHandler(macBtn, DOWNLOAD_URLS['macos-arm64']);
    } else if (detected === 'macos-x64') {
        platformInfoElement.innerHTML = 'Detected: <span class="platform-indicator">macOS (Intel)</span>';
        macBtn.textContent = 'Download for macOS (Intel)';
        macBtn.style.display = 'inline-flex';
        attachDownloadHandler(macBtn, DOWNLOAD_URLS['macos-x64']);
    } else if (detected === 'windows') {
        platformInfoElement.innerHTML = 'Detected: <span class="platform-indicator">Windows</span>';
        winBtn.textContent = 'Download for Windows';
        winBtn.style.display = 'inline-flex';
        attachDownloadHandler(winBtn, DOWNLOAD_URLS['windows']);
    } else {
        platformInfoElement.textContent = 'Could not detect your OS. Please choose:';
        macBtn.textContent = 'Download for macOS (Intel/Universal)';
        winBtn.textContent = 'Download for Windows';
        macBtn.style.display = 'inline-flex';
        winBtn.style.display = 'inline-flex';
        attachDownloadHandler(macBtn, DOWNLOAD_URLS['macos-x64']);
        attachDownloadHandler(winBtn, DOWNLOAD_URLS['windows']);
        showMessage('We could not detect your operating system. Please select your download manually.');
    }
}

async function fetchDownloadCounts() {
    statusMessageElement.textContent = 'Fetching latest data...';
    downloadCountElement.innerHTML = '<div class="loading-spinner"></div>';
    lastUpdatedElement.textContent = '';

    try {
        const res = await fetch(API_RELEASES_URL);
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        const releases = await res.json();
        let total = 0;
        for (const release of releases) {
            if (Array.isArray(release.assets)) {
                for (const asset of release.assets) {
                    total += asset.download_count || 0;
                }
            }
        }
        downloadCountElement.textContent = total.toLocaleString();
        statusMessageElement.textContent = 'Data updated successfully.';
        lastUpdatedElement.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    } catch (err) {
        console.error('Failed to fetch download count:', err);
        downloadCountElement.textContent = 'Error';
        statusMessageElement.innerHTML = '<span class="error-message">Failed to fetch data.</span>';
        lastUpdatedElement.textContent = `Last attempt: ${new Date().toLocaleTimeString()}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateDownloadButtonsAndInfo();
    fetchDownloadCounts();
    setInterval(fetchDownloadCounts, UPDATE_INTERVAL_MS);
});
