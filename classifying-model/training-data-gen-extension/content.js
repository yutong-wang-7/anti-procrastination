// Create and manage the popup overlay
class YouTubeTrackerPopup {
  constructor() {
    this.popup = null;
    this.overlay = null;
    this.videoTitle = '';
    this.hasShownForCurrentVideo = false;
    this.currentVideoUrl = '';
    this.isShort = false;
  }

  createPopup() {
    // Check if popup already exists
    if (document.getElementById('yt-tracker-overlay')) {
      return;
    }

    // Get video title based on whether it's a short or regular video
    this.isShort = window.location.href.includes('/shorts');
    this.videoTitle = this.getVideoTitle();
    this.currentVideoUrl = window.location.href;

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'yt-tracker-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create popup
    this.popup = document.createElement('div');
    this.popup.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      text-align: center;
    `;

    // Title
    const title = document.createElement('h2');
    title.textContent = this.isShort ? 'Track this Short' : 'Track this video';
    title.style.cssText = `
      margin: 0 0 10px 0;
      color: #333;
      font-size: 24px;
    `;
    this.popup.appendChild(title);

    // Video name
    const videoName = document.createElement('p');
    videoName.textContent = this.videoTitle;
    videoName.style.cssText = `
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
      font-style: italic;
      word-wrap: break-word;
    `;
    this.popup.appendChild(videoName);

    // Keyboard shortcut hint
    const shortcuts = document.createElement('p');
    shortcuts.innerHTML = '⌨️ <strong>1</strong> = Productive | <strong>0</strong> = Distractive | <strong>S</strong> = Skip';
    shortcuts.style.cssText = `
      margin: 0 0 20px 0;
      color: #888;
      font-size: 13px;
      background: #f0f0f0;
      padding: 8px;
      border-radius: 4px;
    `;
    this.popup.appendChild(shortcuts);

    // Buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    `;

    // Productive button
    const productiveBtn = this.createButton('✅ Productive (1)', '#4CAF50', '#45a049');
    productiveBtn.addEventListener('click', () => this.handleChoice('productive'));
    buttonContainer.appendChild(productiveBtn);

    // Distractive button
    const distractiveBtn = this.createButton('❌ Distractive (0)', '#f44336', '#da190b');
    distractiveBtn.addEventListener('click', () => this.handleChoice('distractive'));
    buttonContainer.appendChild(distractiveBtn);

    // Skip button
    const skipBtn = this.createButton('⏭️ Skip (S)', '#9e9e9e', '#757575');
    skipBtn.addEventListener('click', () => this.handleChoice('skip'));
    buttonContainer.appendChild(skipBtn);

    this.popup.appendChild(buttonContainer);
    this.overlay.appendChild(this.popup);
    document.body.appendChild(this.overlay);

    // Prevent scrolling when popup is shown
    document.body.style.overflow = 'hidden';

    // Add keyboard listener
    this.keyboardHandler = (e) => {
      if (e.key === '1') {
        e.preventDefault();
        this.handleChoice('productive');
      } else if (e.key === '0') {
        e.preventDefault();
        this.handleChoice('distractive');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.handleChoice('skip');
      }
    };
    document.addEventListener('keydown', this.keyboardHandler);
  }

  createButton(text, bgColor, hoverColor) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      background: ${bgColor};
      color: white;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s, transform 0.2s;
      min-width: 140px;
    `;
    button.addEventListener('mouseenter', () => {
      button.style.background = hoverColor;
      button.style.transform = 'scale(1.05)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = bgColor;
      button.style.transform = 'scale(1)';
    });
    return button;
  }

  getVideoTitle() {
    let title = '';
    
    if (this.isShort) {
      // Multiple selectors for Shorts title (YouTube frequently changes these)
      title = this.getShortsTitle();
    } else {
      // Regular video title selectors
      title = this.getRegularVideoTitle();
    }
    
    if (title) {
      // Remove " - YouTube" from the end if present
      title = title.replace(/\s*-\s*YouTube$/, '');
      return title.trim();
    }
    
    return 'Unknown Video';
  }

  getShortsTitle() {
    // Try multiple selectors for Shorts
    const selectors = [
      // Newer YouTube Shorts selectors
      'yt-formatted-string#title h1',
      'h1.ytd-shorts',
      '#title h1',
      'yt-formatted-string.title',
      // Fallback selectors
      'h1[itemprop="headline"]',
      '.shorts-title',
      '#title > h1',
      // Meta tags
      'meta[name="title"]',
      'meta[property="og:title"]',
      // Title tag (least reliable but works as fallback)
      'title'
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          let title = '';
          if (element.tagName === 'META') {
            title = element.getAttribute('content') || '';
          } else {
            title = element.textContent || element.innerText || '';
          }
          title = title.trim();
          // Filter out generic YouTube titles
          if (title && 
              title !== 'YouTube' && 
              !title.includes('YouTube') && 
              title.length > 3 &&
              !title.startsWith('#shorts')) {
            return title;
          }
        }
      } catch (e) {
        console.log('Error with selector:', selector, e);
      }
    }

    // If all else fails, try to get it from the page metadata
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      const content = ogTitle.getAttribute('content');
      if (content && content !== 'YouTube') {
        return content;
      }
    }

    // Last resort: try to find any heading element that looks like a title
    const headings = document.querySelectorAll('h1, h2');
    for (const heading of headings) {
      const text = heading.textContent.trim();
      if (text && text.length > 3 && text !== 'YouTube' && !text.includes('Shorts')) {
        return text;
      }
    }

    return 'Unknown Short';
  }

  getRegularVideoTitle() {
    const selectors = [
      'h1.ytd-video-primary-info-renderer',
      'h1.style-scope.ytd-watch-metadata',
      '#title h1',
      'h1[itemprop="headline"]',
      'meta[name="title"]',
      'meta[property="og:title"]',
      'title'
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          let title = '';
          if (element.tagName === 'META') {
            title = element.getAttribute('content') || '';
          } else {
            title = element.textContent || element.innerText || '';
          }
          title = title.trim();
          if (title && title !== 'YouTube' && title.length > 3) {
            return title;
          }
        }
      } catch (e) {
        console.log('Error with selector:', selector, e);
      }
    }

    return 'Unknown Video';
  }

  async handleChoice(choice) {
    if (choice === 'skip') {
      this.closePopup();
      return;
    }

    const value = choice === 'productive' ? '1' : '0';
    const prefix = this.isShort ? '[Short] ' : '';
    const entry = `${prefix}${this.videoTitle}\t${value}`;

    try {
      // Save to storage
      const result = await chrome.storage.local.get(['trackingData']);
      let trackingData = result.trackingData || [];
      trackingData.push(entry);
      await chrome.storage.local.set({ trackingData });
      
      console.log('Saved:', entry);
    } catch (error) {
      console.error('Error saving data:', error);
    }

    this.closePopup();
  }

  closePopup() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.popup = null;
      document.body.style.overflow = '';
      
      // Remove keyboard listener
      if (this.keyboardHandler) {
        document.removeEventListener('keydown', this.keyboardHandler);
        this.keyboardHandler = null;
      }
    }
  }
}

// Initialize tracker
const tracker = new YouTubeTrackerPopup();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showPopup') {
    // Check if we've already shown for this video
    const currentUrl = window.location.href;
    if (tracker.hasShownForCurrentVideo && tracker.currentVideoUrl === currentUrl) {
      return;
    }
    
    // Wait for title to be available
    const showPopup = () => {
      tracker.createPopup();
      tracker.hasShownForCurrentVideo = true;
      tracker.currentVideoUrl = currentUrl;
    };

    // For Shorts, need a longer delay as content loads dynamically
    const delay = window.location.href.includes('/shorts') ? 2000 : 1500;
    
    // Try multiple times to get the title if it's not immediately available
    let attempts = 0;
    const maxAttempts = 5;
    
    const tryShowPopup = () => {
      const title = tracker.getVideoTitle();
      if (title && title !== 'Unknown Video' && title !== 'Unknown Short') {
        setTimeout(showPopup, delay);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryShowPopup, 500);
      } else {
        // If we can't get the title after max attempts, show anyway
        setTimeout(showPopup, delay);
      }
    };
    
    tryShowPopup();
  }
});

// Detect navigation within YouTube (SPA)
let lastUrl = location.href;
let urlCheckInterval;

function checkUrlChange() {
  const url = location.href;
  if (url !== lastUrl) {
    const wasShort = lastUrl.includes('/shorts');
    const isShort = url.includes('/shorts');
    
    lastUrl = url;
    
    // Reset tracker for new video
    if (url.includes('/watch') || isShort) {
      tracker.hasShownForCurrentVideo = false;
      tracker.currentVideoUrl = '';
      
      // Only show popup if it's a new video/short
      if (url.includes('/watch') || (isShort && url !== lastUrl)) {
        // Remove any existing popup
        if (tracker.overlay) {
          tracker.closePopup();
        }
        
        // Wait for the page to update
        setTimeout(() => {
          tracker.createPopup();
          tracker.hasShownForCurrentVideo = true;
          tracker.currentVideoUrl = url;
        }, isShort ? 2000 : 1500);
      }
    }
  }
}

// Use both MutationObserver and interval check for reliability
urlCheckInterval = setInterval(checkUrlChange, 1000);

const observer = new MutationObserver(() => {
  checkUrlChange();
});

observer.observe(document, { subtree: true, childList: true });

// Clean up interval when page unloads (though not strictly necessary for content scripts)
window.addEventListener('unload', () => {
  clearInterval(urlCheckInterval);
  observer.disconnect();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showPopup') {
    console.log('Received showPopup message');
    
    // Initialize tracker if not already done
    if (!tracker) {
      tracker = new YouTubeTrackerPopup();
    }
    
    // Check if we should show popup for this URL
    const currentUrl = window.location.href;
    
    // Don't show if already shown for this exact URL
    if (tracker.hasShownForCurrentVideo && tracker.currentVideoUrl === currentUrl) {
      console.log('Already shown for this video, skipping');
      return;
    }
    
    // Show the popup
    tracker.createPopup().then(() => {
      console.log('Popup created for:', currentUrl);
    }).catch(console.error);
    
    // Send response to keep the message channel open
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});