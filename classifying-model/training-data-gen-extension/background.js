// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /youtube\.com\/watch/,
  /youtube\.com\/shorts/,
  /youtu\.be\//
];

function isYouTubeVideo(url) {
  if (!url) return false;
  return YOUTUBE_PATTERNS.some(pattern => pattern.test(url));
}

// Send message with retry
async function sendMessageWithRetry(tabId, message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await chrome.tabs.sendMessage(tabId, message);
      console.log('Message sent successfully to tab', tabId);
      return true;
    } catch (error) {
      console.log(`Retry ${i + 1}/${maxRetries} for tab ${tabId}`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  console.log('Failed to send message to tab', tabId);
  return false;
}

// Listen for when a YouTube page is loaded
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // When page finishes loading
  if (changeInfo.status === 'complete' && tab.url && isYouTubeVideo(tab.url)) {
    console.log('YouTube page fully loaded:', tab.url);
    setTimeout(() => {
      sendMessageWithRetry(tabId, { action: 'showPopup' });
    }, 2000);
  }
  
  // When URL changes (SPA navigation)
  if (changeInfo.url && isYouTubeVideo(changeInfo.url)) {
    console.log('YouTube URL changed:', changeInfo.url);
    setTimeout(() => {
      sendMessageWithRetry(tabId, { action: 'showPopup' });
    }, 2000);
  }
});

// Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  // Initialize storage if needed
  chrome.storage.local.get(['trackingData'], (result) => {
    if (!result.trackingData) {
      chrome.storage.local.set({ trackingData: [] });
      console.log('Initialized tracking data storage');
    }
  });
});

// Log when service worker starts
console.log('YouTube Tracker background service worker started and ready');