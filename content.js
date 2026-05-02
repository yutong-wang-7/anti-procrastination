console.log("Extension loaded");

let checkedVideos = new Set();

// Create status indicator
const statusDiv = document.createElement('div');
statusDiv.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: #333;
    color: #0f0;
    padding: 4px 8px;
    font-size: 10px;
    font-family: monospace;
    z-index: 10000;
    border-radius: 3px;
`;
statusDiv.textContent = "Connecting to AI server...";
document.body.appendChild(statusDiv);

async function shouldBlock(title) {
    try {
        const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title, description: "" })
        });
        
        const data = await response.json();
        // Probability is sigmoid output, closer to 0 = block, closer to 1 = allow
        // Threshold at 0.5: below 0.5 = block, above 0.5 = allow
        // This may need to be adjusted
        return data.probability < 0.3;
    } catch (error) {
        console.error("Server error:", error);
        statusDiv.style.color = "red";
        statusDiv.textContent = "Server offline";
        return false;
    }
}

function getVideoTitle() {
    if (!window.location.href.includes('/watch') && !window.location.href.includes('/shorts')) {
        return null;
    }
    
    const selectors = [
        'h1.ytd-video-primary-info-renderer yt-formatted-string',
        '#title h1 yt-formatted-string',
        '#container h1 yt-formatted-string'
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText) {
            return element.innerText.trim();
        }
    }
    return null;
}

function blockVideo(title) {
    // Simple redirect that replaces the page
    const blockPage = chrome.runtime.getURL('blocked.html?title=' + encodeURIComponent(title));
    statusDiv.textContent = "Blocking...";
    window.location.href = blockPage;
}

async function checkAndBlock() {
    if (window.location.href.includes('blocked.html')) return;
    
    const title = getVideoTitle();
    if (!title) return;
    
    const videoId = window.location.href.split('v=')[1];
    if (checkedVideos.has(videoId)) return;
    checkedVideos.add(videoId);
    
    console.log("Checking:", title);
    statusDiv.textContent = "Checking...";
    
    const block = await shouldBlock(title);
    
    if (block) {
        console.log("BLOCKED:", title);
        blockVideo(title);
    } else {
        console.log("ALLOWED:", title);
        statusDiv.textContent = "AI Active";
        setTimeout(() => statusDiv.style.opacity = "0.5", 2000);
    }
}

// Start checking when page loads
setTimeout(checkAndBlock, 3000);

// Watch for navigation
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(checkAndBlock, 2000);
    }
});
observer.observe(document, { subtree: true, childList: true });