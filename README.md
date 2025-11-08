# AudioStream - YouTube Music Player

A modern web-based music streaming application that allows you to search, stream, and download music from YouTube with a Spotify-like interface.

## Features

- 🎵 **Search & Stream** - Search YouTube and stream music instantly
- 📥 **Download** - Download tracks as MP3 files
- ❤️ **Liked Songs** - Save your favorite tracks
- 📝 **Playlists** - Create and manage custom playlists
- 🕒 **Recent Tracks** - View your listening history
- 🎨 **Modern UI** - Spotify-inspired dark/light theme
- 📱 **Responsive** - Works on desktop and mobile

## Prerequisites

- **Python 3.8+**
- **FFmpeg** (for audio conversion)

### Install FFmpeg

**Windows:**
1. Download from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract and add to PATH
3. Test: `ffmpeg -version`

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg  # Ubuntu/Debian
sudo yum install ffmpeg  # CentOS/RHEL
```

## Quick Start

### 1. Clone/Download
```bash
git clone <repository-url>
cd ytdlpweb
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Application
```bash
python app.py
```

### 4. Open Browser
Go to: `http://localhost:5000`

## Usage

1. **Search** - Type song name in search box
2. **Play** - Click any track to start streaming
3. **Download** - Use download button in player
4. **Like** - Heart button to save favorites
5. **Playlists** - Create custom playlists in Library

## File Structure

```
ytdlpweb/
├── app.py              # Flask backend
├── requirements.txt    # Python dependencies
├── static/            # Frontend files
│   ├── index.html     # Main UI
│   ├── script.js      # JavaScript logic
│   └── style.css      # Styling
├── cache/             # Downloaded audio files
└── data/              # User data (playlists, likes)
```

## Configuration

### Change Port
Edit `app.py`:
```python
app.run(port=8000)  # Change from 5000 to 8000
```

### Audio Quality
Edit download quality in `app.py`:
```python
'preferredquality': '320'  # Change from 192 to 320
```

## Troubleshooting

### "FFmpeg not found"
- Install FFmpeg and add to PATH
- Restart terminal/command prompt

### "YouTube bot detection"
- This is normal for some videos
- Try different search terms
- Works better locally than on servers

### "Port already in use"
- Change port in `app.py`
- Or kill process: `lsof -ti:5000 | xargs kill -9` (macOS/Linux)

### "Module not found"
```bash
pip install -r requirements.txt
```

## Development

### Add New Features
1. Backend: Edit `app.py`
2. Frontend: Edit `static/script.js`
3. Styling: Edit `static/style.css`

### Debug Mode
```python
app.run(debug=True)
```

## Deployment

### Local Network Access
```python
app.run(host='0.0.0.0', port=5000)
```
Access via: `http://YOUR_IP:5000`

### Cloud Deployment
- **Railway**: Upload folder directly
- **Render**: Connect GitHub repo
- **Heroku**: Use included `Procfile`

## License

MIT License - Feel free to modify and distribute.

## Support

For issues:
1. Check FFmpeg installation
2. Verify Python version (3.8+)
3. Check console for errors (F12 in browser)

---

**Enjoy your music! 🎵**