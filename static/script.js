// App State
let currentMode = 'stream';
let currentVideoUrl = '';
let currentTrack = null;
let isPlaying = false;
let currentTime = 0;
let duration = 0;
let recentTracks = JSON.parse(localStorage.getItem('recentTracks') || '[]');
let likedTracks = JSON.parse(localStorage.getItem('likedTracks') || '[]');

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('resultsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const playerSection = document.getElementById('playerSection');
const audioPlayer = document.getElementById('audioPlayer');
const playerTitle = document.getElementById('playerTitle');
const playerStatus = document.getElementById('playerStatus');
const playerThumbnail = document.getElementById('playerThumbnail');
const closePlayer = document.getElementById('closePlayer');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const themeToggle = document.getElementById('themeToggle');
const notification = document.getElementById('notification');
const playPauseBtn = document.getElementById('playPauseBtn');
const likeBtn = document.getElementById('likeBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeBtn = document.getElementById('volumeBtn');
const progressFill = document.getElementById('progressFill');
const progressHandle = document.getElementById('progressHandle');
const currentTimeDisplay = document.getElementById('currentTime');
const totalTimeDisplay = document.getElementById('totalTime');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const recentTracksContainer = document.getElementById('recentTracks');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    try {
        initializeApp();
        updateRecentTracks();
        updateGreeting();
        testServerConnection();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// Test server connection
async function testServerConnection() {
    try {
        const response = await fetch('/test');
        const data = await response.json();
        console.log('Server test:', data);
        if (data.status) {
            showNotification('Connected to server successfully', 'success');
        }
    } catch (error) {
        console.error('Server connection test failed:', error);
        showNotification('Failed to connect to server', 'error');
    }
}

function initializeApp() {
    // Check if all required DOM elements exist
    const requiredElements = {
        searchInput, searchBtn, resultsContainer, loadingSpinner,
        playerSection, audioPlayer, playerTitle, playerStatus,
        playerThumbnail, closePlayer, downloadBtn, shareBtn,
        themeToggle, notification, playPauseBtn, likeBtn,
        volumeSlider, volumeBtn, progressFill, progressHandle,
        currentTimeDisplay, totalTimeDisplay, backBtn, forwardBtn,
        recentTracksContainer
    };
    
    for (const [name, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(`Required element not found: ${name}`);
            showNotification(`UI Error: Missing element ${name}`, 'error');
            return;
        }
    }
    
    // Set initial volume
    audioPlayer.volume = volumeSlider.value / 100;
    
    // Update navigation state
    updateNavigationState();
    
    // Set up audio player event listeners
    setupAudioPlayerEvents();
    
    // Set up progress bar interaction
    setupProgressBarEvents();
}

function updateGreeting() {
    const hour = new Date().getHours();
    const heroTitle = document.querySelector('.hero-title');
    
    if (hour < 12) {
        heroTitle.textContent = 'Good morning';
    } else if (hour < 18) {
        heroTitle.textContent = 'Good afternoon';
    } else {
        heroTitle.textContent = 'Good evening';
    }
}

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const view = item.dataset.view;
        switchView(view);
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
    });
});

function switchView(viewName) {
    // Restore original content if it was replaced
    if (!document.getElementById('homeView')) {
        restoreOriginalContent();
    }
    
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
    switch(viewName) {
        case 'home':
            document.getElementById('homeView').classList.add('active');
            break;
        case 'search':
            document.getElementById('searchView').classList.add('active');
            break;
        case 'library':
            showLibraryView();
            break;
        case 'liked':
            showLikedSongsView();
            break;
        case 'recent':
            showRecentTracksView();
            break;
        case 'create':
            showCreatePlaylistDialog();
            break;
        default:
            document.getElementById('homeView').classList.add('active');
    }
}

function restoreOriginalContent() {
    const contentArea = document.querySelector('.content-area');
    contentArea.innerHTML = `
        <!-- Home View -->
        <div id="homeView" class="view active">
            <div class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">Good evening</h1>
                    <p class="hero-subtitle">Discover and stream your favorite music</p>
                </div>
                <div class="hero-gradient"></div>
            </div>
            
            <div class="quick-picks">
                <h2 class="section-title">Quick picks</h2>
                <div class="quick-picks-grid" id="quickPicks">
                    <div class="quick-pick-item" onclick="quickSearch('trending music 2024')">
                        <div class="quick-pick-icon">
                            <i class="fas fa-fire"></i>
                        </div>
                        <span>Trending Now</span>
                    </div>
                    <div class="quick-pick-item" onclick="quickSearch('chill music')">
                        <div class="quick-pick-icon">
                            <i class="fas fa-leaf"></i>
                        </div>
                        <span>Chill Vibes</span>
                    </div>
                    <div class="quick-pick-item" onclick="quickSearch('workout music')">
                        <div class="quick-pick-icon">
                            <i class="fas fa-dumbbell"></i>
                        </div>
                        <span>Workout</span>
                    </div>
                    <div class="quick-pick-item" onclick="quickSearch('focus music')">
                        <div class="quick-pick-icon">
                            <i class="fas fa-brain"></i>
                        </div>
                        <span>Focus</span>
                    </div>
                </div>
            </div>
            
            <div class="recent-section" id="recentSection">
                <h2 class="section-title">Recently played</h2>
                <div class="recent-tracks" id="recentTracks">
                    <div class="empty-state">
                        <i class="fas fa-music"></i>
                        <p>Start listening to see your recent tracks here</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Search Results View -->
        <div id="searchView" class="view">
            <div class="search-header">
                <h1 class="page-title">Search Results</h1>
            </div>
            
            <div id="loadingSpinner" class="loading-spinner hidden">
                <div class="spinner"></div>
                <p>Searching for music...</p>
            </div>
            
            <div id="resultsContainer" class="results-container"></div>
        </div>
    `;
    updateRecentTracks();
    updateGreeting();
}

function updateNavigationState() {
    // Disable back/forward buttons for now (can be enhanced later)
    backBtn.disabled = true;
    forwardBtn.disabled = true;
}

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const icon = themeToggle.querySelector('i');
    const span = themeToggle.querySelector('span');
    
    if (document.body.classList.contains('light-theme')) {
        icon.className = 'fas fa-sun';
        span.textContent = 'Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        span.textContent = 'Dark Mode';
    }
});

// Mode selector
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        
        const mode = btn.dataset.mode;
        showNotification(
            mode === 'stream' ? 'Streaming mode enabled' : 'Download mode enabled',
            'info'
        );
    });
});

// Search functionality
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

searchInput.addEventListener('input', (e) => {
    if (e.target.value.trim()) {
        switchView('search');
    }
});

// Quick search function
function quickSearch(query) {
    searchInput.value = query;
    performSearch();
    switchView('search');
}

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    console.log('Performing search for:', query);
    showLoading(true);
    resultsContainer.innerHTML = '';
    switchView('search');

    try {
        const response = await fetch(`${API_BASE_URL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        console.log('Search response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Search results:', data);
        showLoading(false);

        if (data.results && data.results.length > 0) {
            displayResults(data.results);
            showNotification(`Found ${data.results.length} results`, 'success');
        } else {
            resultsContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-search"></i>
                    <p>No results found for "${escapeHtml(query)}"</p>
                    <p style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Try different keywords or check your spelling</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        showLoading(false);
        showNotification('Search failed: ' + error.message, 'error');
        resultsContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Search failed</p>
                <p style="font-size: 12px; margin-top: 8px; opacity: 0.7;">${error.message}</p>
            </div>
        `;
    }
}

function displayResults(videos) {
    resultsContainer.innerHTML = videos.map(video => `
        <div class="video-card" onclick="playVideo('${video.url}', '${escapeHtml(video.title)}', '${video.thumbnail}', '${video.id}')">
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" loading="lazy">
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-info">
                <div class="video-title">${escapeHtml(video.title)}</div>
                <div class="video-duration">
                    <i class="fas fa-clock"></i>
                    ${formatDuration(video.duration)}
                </div>
            </div>
        </div>
    `).join('');
}

async function playVideo(url, title, thumbnail, id) {
    currentVideoUrl = url;
    currentTrack = { url, title, thumbnail, id };
    
    playerTitle.textContent = title;
    playerThumbnail.src = thumbnail;
    playerStatus.textContent = 'Loading...';
    
    // Update like button state
    updateLikeButton();
    
    playerSection.classList.remove('hidden');
    document.querySelector('.app-container').classList.add('player-active');

    try {
        const response = await fetch(`${API_BASE_URL}/play-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, mode: currentMode })
        });

        const data = await response.json();

        if (data.success) {
            if (data.type === 'stream') {
                audioPlayer.src = data.stream_url;
                playerStatus.textContent = 'Streaming';
            } else if (data.type === 'cached' || data.type === 'download') {
                audioPlayer.src = `${API_BASE_URL}/play/${data.file}`;
                playerStatus.textContent = data.type === 'cached' ? 'Playing from cache' : 'Downloaded';
            }
            
            audioPlayer.play();
            isPlaying = true;
            updatePlayPauseButton();
            
            // Add to recent tracks
            addToRecentTracks(currentTrack);
            
            showNotification('Now playing: ' + title, 'success');
        } else {
            throw new Error(data.error || 'Failed to play audio');
        }
    } catch (error) {
        playerStatus.textContent = 'Error';
        showNotification('Playback failed: ' + error.message, 'error');
    }
}

// Player Controls
closePlayer.addEventListener('click', () => {
    playerSection.classList.add('hidden');
    document.querySelector('.app-container').classList.remove('player-active');
    audioPlayer.pause();
    audioPlayer.src = '';
    isPlaying = false;
    currentTrack = null;
    updatePlayPauseButton();
});

playPauseBtn.addEventListener('click', () => {
    if (audioPlayer.src) {
        if (isPlaying) {
            audioPlayer.pause();
        } else {
            audioPlayer.play();
        }
    }
});

likeBtn.addEventListener('click', () => {
    if (currentTrack) {
        toggleLikeTrack(currentTrack);
    }
});

volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    audioPlayer.volume = volume;
    updateVolumeIcon(volume);
});

volumeBtn.addEventListener('click', () => {
    if (audioPlayer.volume > 0) {
        audioPlayer.volume = 0;
        volumeSlider.value = 0;
    } else {
        audioPlayer.volume = 0.5;
        volumeSlider.value = 50;
    }
    updateVolumeIcon(audioPlayer.volume);
});

function updatePlayPauseButton() {
    const icon = playPauseBtn.querySelector('i');
    icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
}

function updateVolumeIcon(volume) {
    const icon = volumeBtn.querySelector('i');
    if (volume === 0) {
        icon.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
        icon.className = 'fas fa-volume-down';
    } else {
        icon.className = 'fas fa-volume-up';
    }
}

function updateLikeButton() {
    if (currentTrack) {
        const isLiked = likedTracks.some(track => track.id === currentTrack.id);
        const icon = likeBtn.querySelector('i');
        icon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
        likeBtn.classList.toggle('liked', isLiked);
    }
}

async function toggleLikeTrack(track) {
    const existingIndex = likedTracks.findIndex(t => t.id === track.id);
    
    try {
        if (existingIndex >= 0) {
            // Remove from liked songs
            const response = await fetch(`${API_BASE_URL}/liked-songs`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: track.id })
            });
            
            if (response.ok) {
                likedTracks.splice(existingIndex, 1);
                showNotification('Removed from liked songs', 'info');
            }
        } else {
            // Add to liked songs
            const response = await fetch(`${API_BASE_URL}/liked-songs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ song: track })
            });
            
            if (response.ok) {
                likedTracks.push(track);
                showNotification('Added to liked songs', 'success');
            }
        }
        
        localStorage.setItem('likedTracks', JSON.stringify(likedTracks));
        updateLikeButton();
    } catch (error) {
        showNotification('Failed to update liked songs', 'error');
    }
}

async function addToRecentTracks(track) {
    try {
        const response = await fetch(`${API_BASE_URL}/recent-tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ track })
        });
        
        if (response.ok) {
            // Remove if already exists
            recentTracks = recentTracks.filter(t => t.id !== track.id);
            
            // Add to beginning
            recentTracks.unshift(track);
            
            // Keep only last 20 tracks
            recentTracks = recentTracks.slice(0, 20);
            
            localStorage.setItem('recentTracks', JSON.stringify(recentTracks));
            updateRecentTracks();
        }
    } catch (error) {
        console.error('Failed to save recent track:', error);
    }
}

function updateRecentTracks() {
    if (recentTracks.length === 0) {
        recentTracksContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-music"></i>
                <p>Start listening to see your recent tracks here</p>
            </div>
        `;
        return;
    }
    
    recentTracksContainer.innerHTML = recentTracks.slice(0, 6).map(track => `
        <div class="video-card" onclick="playVideo('${track.url}', '${escapeHtml(track.title)}', '${track.thumbnail}', '${track.id}')">
            <div class="video-thumbnail">
                <img src="${track.thumbnail}" alt="${escapeHtml(track.title)}" loading="lazy">
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-info">
                <div class="video-title">${escapeHtml(track.title)}</div>
            </div>
        </div>
    `).join('');
}

// Audio Player Events
function setupAudioPlayerEvents() {
    audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        updatePlayPauseButton();
    });
    
    audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayPauseButton();
    });
    
    audioPlayer.addEventListener('timeupdate', () => {
        currentTime = audioPlayer.currentTime;
        duration = audioPlayer.duration || 0;
        updateProgressBar();
        updateTimeDisplays();
    });
    
    audioPlayer.addEventListener('loadedmetadata', () => {
        duration = audioPlayer.duration;
        updateTimeDisplays();
    });
    
    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayPauseButton();
        // Could implement auto-next here
    });
}

function updateProgressBar() {
    if (duration > 0) {
        const progress = (currentTime / duration) * 100;
        progressFill.style.width = `${progress}%`;
        progressHandle.style.left = `${progress}%`;
    }
}

function updateTimeDisplays() {
    currentTimeDisplay.textContent = formatTime(currentTime);
    totalTimeDisplay.textContent = formatTime(duration);
}

function setupProgressBarEvents() {
    const progressBar = document.querySelector('.progress-bar');
    
    progressBar.addEventListener('click', (e) => {
        if (duration > 0) {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const progress = clickX / rect.width;
            const newTime = progress * duration;
            
            audioPlayer.currentTime = newTime;
        }
    });
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

downloadBtn.addEventListener('click', async () => {
    if (!currentVideoUrl) {
        showNotification('No track selected for download', 'error');
        return;
    }
    
    showNotification('Starting download...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/play-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: currentVideoUrl, mode: 'download' })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Download response:', data);

        if (data.success) {
            // Create download link
            const link = document.createElement('a');
            link.href = `${API_BASE_URL}/play/${data.file}`;
            link.download = data.file;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('Download started!', 'success');
        } else {
            throw new Error(data.error || 'Download failed');
        }
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Download failed: ' + error.message, 'error');
    }
});

shareBtn.addEventListener('click', async () => {
    if (!currentVideoUrl) {
        showNotification('No track selected to share', 'error');
        return;
    }
    
    try {
        if (navigator.share && currentTrack) {
            await navigator.share({
                title: currentTrack.title,
                text: `Check out this track: ${currentTrack.title}`,
                url: currentVideoUrl
            });
        } else {
            await navigator.clipboard.writeText(currentVideoUrl);
            showNotification('Link copied to clipboard!', 'success');
        }
    } catch (error) {
        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(currentVideoUrl);
            showNotification('Link copied to clipboard!', 'success');
        } catch (clipboardError) {
            showNotification('Failed to share or copy link', 'error');
        }
    }
});

function showLoading(show) {
    loadingSpinner.classList.toggle('hidden', !show);
    if (show) {
        resultsContainer.innerHTML = '';
    }
}

function showNotification(message, type = 'success') {
    const notificationText = notification.querySelector('.notification-text');
    const notificationIcon = notification.querySelector('.notification-icon');
    
    notificationText.textContent = message;
    
    // Set icon based on type
    let iconClass = 'fas fa-check-circle';
    if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    else if (type === 'info') iconClass = 'fas fa-info-circle';
    else if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';
    
    notificationIcon.className = `notification-icon ${iconClass}`;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space bar for play/pause
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (audioPlayer.src) {
            if (isPlaying) {
                audioPlayer.pause();
            } else {
                audioPlayer.play();
            }
        }
    }
    
    // Escape to close player
    if (e.code === 'Escape') {
        if (!playerSection.classList.contains('hidden')) {
            closePlayer.click();
        }
    }
    
    // Ctrl/Cmd + K for search focus
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
});

// Handle search input focus
searchInput.addEventListener('focus', () => {
    searchInput.parentElement.style.transform = 'scale(1.02)';
});

searchInput.addEventListener('blur', () => {
    searchInput.parentElement.style.transform = 'scale(1)';
});

// Library and playlist functions
function showLibraryView() {
    const content = `
        <div id="libraryView" class="view active">
            <div class="library-view">
                <h1 class="page-title">Your Library</h1>
                <div class="library-sections">
                    <div class="library-section" onclick="showLikedSongsView()">
                        <i class="fas fa-heart"></i>
                        <span>Liked Songs</span>
                    </div>
                    <div class="library-section" onclick="showRecentTracksView()">
                        <i class="fas fa-clock"></i>
                        <span>Recently Played</span>
                    </div>
                    <div class="library-section" onclick="showCreatePlaylistDialog()">
                        <i class="fas fa-plus"></i>
                        <span>Create Playlist</span>
                    </div>
                </div>
                <div id="playlistsList"></div>
            </div>
        </div>
    `;
    
    document.querySelector('.content-area').innerHTML = content;
    loadPlaylists();
}

async function showLikedSongsView() {
    try {
        const response = await fetch(`${API_BASE_URL}/liked-songs`);
        const data = await response.json();
        
        const content = `
            <div id="likedSongsView" class="view active">
                <div class="liked-songs-view">
                    <h1 class="page-title">Liked Songs</h1>
                    <div class="results-container" id="likedSongsContainer"></div>
                </div>
            </div>
        `;
        
        document.querySelector('.content-area').innerHTML = content;
        
        if (data.songs && data.songs.length > 0) {
            displayResults(data.songs, 'likedSongsContainer');
        } else {
            document.getElementById('likedSongsContainer').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <p>No liked songs yet</p>
                </div>
            `;
        }
    } catch (error) {
        showNotification('Failed to load liked songs', 'error');
    }
}

async function showRecentTracksView() {
    try {
        const response = await fetch(`${API_BASE_URL}/recent-tracks`);
        const data = await response.json();
        
        const content = `
            <div id="recentTracksView" class="view active">
                <div class="recent-tracks-view">
                    <h1 class="page-title">Recently Played</h1>
                    <div class="results-container" id="recentTracksViewContainer"></div>
                </div>
            </div>
        `;
        
        document.querySelector('.content-area').innerHTML = content;
        
        if (data.tracks && data.tracks.length > 0) {
            displayResults(data.tracks, 'recentTracksViewContainer');
        } else {
            document.getElementById('recentTracksViewContainer').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>No recent tracks</p>
                </div>
            `;
        }
    } catch (error) {
        showNotification('Failed to load recent tracks', 'error');
    }
}

function showCreatePlaylistDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
        <div class="dialog">
            <h3>Create Playlist</h3>
            <input type="text" id="playlistName" placeholder="Playlist name" maxlength="50">
            <div class="dialog-buttons">
                <button onclick="this.closest('.dialog-overlay').remove()">Cancel</button>
                <button onclick="createPlaylist()">Create</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
    document.getElementById('playlistName').focus();
}

async function createPlaylist() {
    const name = document.getElementById('playlistName').value.trim();
    if (!name) {
        showNotification('Please enter a playlist name', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Playlist created successfully', 'success');
            document.querySelector('.dialog-overlay').remove();
            showLibraryView();
        } else {
            showNotification('Failed to create playlist', 'error');
        }
    } catch (error) {
        showNotification('Failed to create playlist', 'error');
    }
}

async function loadPlaylists() {
    try {
        const response = await fetch(`${API_BASE_URL}/playlists`);
        const data = await response.json();
        
        const container = document.getElementById('playlistsList');
        if (data.playlists && data.playlists.length > 0) {
            container.innerHTML = `
                <h3>Your Playlists</h3>
                <div class="playlists-grid">
                    ${data.playlists.map(playlist => `
                        <div class="playlist-card" onclick="showPlaylist('${playlist.id}')">
                            <i class="fas fa-music"></i>
                            <span>${escapeHtml(playlist.name)}</span>
                            <small>${playlist.songs.length} songs</small>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load playlists:', error);
    }
}

function displayResults(videos, containerId = 'resultsContainer') {
    const container = document.getElementById(containerId);
    container.innerHTML = videos.map(video => `
        <div class="video-card" onclick="playVideo('${video.url}', '${escapeHtml(video.title)}', '${video.thumbnail}', '${video.id}')">
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" loading="lazy">
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-info">
                <div class="video-title">${escapeHtml(video.title)}</div>
                <div class="video-duration">
                    <i class="fas fa-clock"></i>
                    ${formatDuration(video.duration)}
                </div>
            </div>
        </div>
    `).join('');
}
