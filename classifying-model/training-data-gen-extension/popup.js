let currentFilter = 'all';

// Load and display statistics
async function updateStats() {
  try {
    const result = await chrome.storage.local.get(['trackingData']);
    const data = result.trackingData || [];
    
    document.getElementById('totalEntries').textContent = data.length;
    
    const productive = data.filter(entry => entry.endsWith('\t1'));
    const distractive = data.filter(entry => entry.endsWith('\t0'));
    const shorts = data.filter(entry => entry.startsWith('[Short]'));
    
    document.getElementById('productiveCount').textContent = productive.length;
    document.getElementById('distractiveCount').textContent = distractive.length;
    document.getElementById('shortsCount').textContent = shorts.length;
    
    // Update progress bar
    const total = data.length;
    const percentage = total > 0 ? (productive.length / total) * 100 : 0;
    document.getElementById('progressFill').style.width = percentage + '%';
    
    // Update data preview
    updateDataPreview(data);
    
    // Show last entry
    if (data.length > 0) {
      const lastEntry = data[data.length - 1];
      const lastEntryDiv = document.getElementById('lastEntry');
      lastEntryDiv.style.display = 'block';
      lastEntryDiv.innerHTML = `<strong>Last entry:</strong><br>${lastEntry.replace('\t', ' → ')}`;
    } else {
      document.getElementById('lastEntry').style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function updateDataPreview(data) {
  const preview = document.getElementById('dataPreview');
  
  let filteredData = data;
  
  switch(currentFilter) {
    case 'productive':
      filteredData = data.filter(entry => entry.endsWith('\t1'));
      break;
    case 'distractive':
      filteredData = data.filter(entry => entry.endsWith('\t0'));
      break;
    case 'shorts':
      filteredData = data.filter(entry => entry.includes('[Short]'));
      break;
  }
  
  if (filteredData.length === 0) {
    preview.innerHTML = '<div class="empty-state">No entries to display</div>';
    return;
  }
  
  // Show last 50 entries
  const displayData = filteredData.slice(-50).reverse();
  const html = displayData.map(entry => {
    const isProductive = entry.endsWith('\t1');
    const isShort = entry.includes('[Short]');
    const color = isProductive ? '#4CAF50' : '#f44336';
    const icon = isProductive ? '✅' : '❌';
    const shortIcon = isShort ? '📱 ' : '';
    const cleanEntry = entry.replace('\t', ' → ');
    
    return `<div style="color: ${color}; margin: 3px 0;">
      ${shortIcon}${icon} ${cleanEntry}
    </div>`;
  }).join('');
  
  preview.innerHTML = html;
}

// Filter button handlers
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    
    const result = await chrome.storage.local.get(['trackingData']);
    updateDataPreview(result.trackingData || []);
  });
});

// Download data as TXT file
document.getElementById('downloadBtn').addEventListener('click', async () => {
  try {
    const result = await chrome.storage.local.get(['trackingData']);
    const data = result.trackingData || [];
    
    if (data.length === 0) {
      alert('No data to download!');
      return;
    }
    
    // Add header information
    const header = `YouTube Productivity Tracker - Data Export
Generated: ${new Date().toLocaleString()}
Total Entries: ${data.length}
Productive: ${data.filter(e => e.endsWith('\t1')).length}
Distractive: ${data.filter(e => e.endsWith('\t0')).length}
Shorts: ${data.filter(e => e.includes('[Short]')).length}
${'='.repeat(50)}

`;
    
    const content = header + data.join('\n');
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-tracker-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Data downloaded successfully!');
  } catch (error) {
    console.error('Error downloading data:', error);
    alert('Error downloading data!');
  }
});

// Clear all data
document.getElementById('clearBtn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear all tracking data? This cannot be undone.')) {
    try {
      await chrome.storage.local.set({ trackingData: [] });
      await updateStats();
      console.log('All data cleared!');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
});

// Update stats when popup opens
document.addEventListener('DOMContentLoaded', updateStats);

// Refresh stats when popup gains focus
window.addEventListener('focus', updateStats);

// Auto-refresh every 2 seconds while popup is open
setInterval(updateStats, 2000);