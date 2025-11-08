from flask import Flask, request, jsonify, send_file, Response, stream_with_context, send_from_directory
import yt_dlp
import os
import time
from urllib.parse import urlparse, parse_qs
from flask_cors import CORS
import subprocess
import threading
import queue
import json
from datetime import datetime

app = Flask(__name__, static_folder='static')
CORS(app)

def search_videos(query, max_results=5):
    """Search for YouTube videos"""
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            results = ydl.extract_info(f"ytsearch{max_results}:{query}", download=False)
            videos = []
            if 'entries' in results:
                for entry in results['entries']:
                    if entry:
                        videos.append({
                            'id': entry.get('id', ''),
                            'title': entry.get('title', ''),
                            'duration': entry.get('duration', ''),
                            'thumbnail': entry.get('thumbnail', ''),
                            'url': f"https://youtube.com/watch?v={entry.get('id', '')}"
                        })
            return videos
    except Exception as e:
        print(f"Search error: {str(e)}")
        return []

# Create directories
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Data files
LIKED_SONGS_FILE = os.path.join(DATA_DIR, 'liked_songs.json')
PLAYLISTS_FILE = os.path.join(DATA_DIR, 'playlists.json')
RECENT_TRACKS_FILE = os.path.join(DATA_DIR, 'recent_tracks.json')

def get_video_id(url):
    """Extract video ID from YouTube URL"""
    parsed = urlparse(url)
    if parsed.hostname in ('www.youtube.com', 'youtube.com', 'youtu.be'):
        if parsed.hostname == 'youtu.be':
            return parsed.path[1:]
        if parsed.path == '/watch':
            return parse_qs(parsed.query)['v'][0]
    return None

def get_audio_info(url):
    """Get audio stream URL and info from YouTube"""
    video_id = get_video_id(url)
    if not video_id:
        return None, None, "Invalid YouTube URL"

    cache_path = os.path.join(CACHE_DIR, f"{video_id}.mp3")
    
    # Return cached file if it exists
    if os.path.exists(cache_path):
        return cache_path, None, None

    ydl_opts = {
        'format': 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio[ext=webm]/bestaudio',
        'quiet': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'extractor_args': {
            'youtube': {
                'skip': ['dash', 'hls']
            }
        }
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            url = info['url']
            title = info.get('title', '')
            return None, {
                'url': url,
                'title': title,
                'format': info.get('ext', '')
            }, None
    except Exception as e:
        return None, None, str(e)

def download_audio(url):
    """Download audio from YouTube URL"""
    video_id = get_video_id(url)
    if not video_id:
        return None, "Invalid YouTube URL"

    cache_path = os.path.join(CACHE_DIR, f"{video_id}.mp3")
    
    # Return cached file if it exists
    if os.path.exists(cache_path):
        return cache_path, None

    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': cache_path[:-4],  # Remove .mp3 extension as it will be added by yt-dlp
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return cache_path, None
    except Exception as e:
        return None, str(e)

def load_json_data(file_path, default=None):
    """Load JSON data from file"""
    if default is None:
        default = []
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
    return default

def save_json_data(file_path, data):
    """Save JSON data to file"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving {file_path}: {e}")
        return False

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/test')
def test():
    return jsonify({'status': 'Server is working!', 'message': 'Backend is running properly'})

@app.route('/debug')
def debug():
    return send_from_directory('static', 'debug.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/search', methods=['POST', 'OPTIONS'])
def search():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        query = data.get('query')
        if not query:
            return jsonify({'error': 'No search query provided'}), 400
        
        print(f"Searching for: {query}")
        videos = search_videos(query)
        print(f"Found {len(videos)} videos")
        return jsonify({'results': videos})
    except Exception as e:
        print(f"Search error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/play-audio', methods=['POST', 'OPTIONS'])
def play_audio():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        url = data.get('url')
        mode = data.get('mode', 'stream')  # 'stream' or 'download'
        
        if not url:
            return jsonify({'error': 'No URL provided'}), 400

        print(f"Playing audio: {url} in {mode} mode")

        if mode == 'download':
            file_path, error = download_audio(url)
            if error:
                return jsonify({'error': error}), 400
            return jsonify({
                'success': True,
                'type': 'download',
                'file': os.path.basename(file_path)
            })
        else:  # streaming mode
            cache_path, stream_info, error = get_audio_info(url)
            if error:
                return jsonify({'error': error}), 400
            
            if cache_path:  # cached file exists
                return jsonify({
                    'success': True,
                    'type': 'cached',
                    'file': os.path.basename(cache_path)
                })
            
            return jsonify({
                'success': True,
                'type': 'stream',
                'stream_url': stream_info['url'],
                'title': stream_info['title']
            })
    except Exception as e:
        print(f"Play audio error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/play/<filename>')
def play_file(filename):
    try:
        file_path = os.path.join(CACHE_DIR, filename)
        if os.path.exists(file_path):
            response = send_file(file_path)
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/liked-songs', methods=['GET', 'POST', 'DELETE'])
def liked_songs():
    if request.method == 'GET':
        songs = load_json_data(LIKED_SONGS_FILE)
        return jsonify({'songs': songs})
    
    elif request.method == 'POST':
        data = request.get_json()
        song = data.get('song')
        if not song:
            return jsonify({'error': 'No song data provided'}), 400
        
        songs = load_json_data(LIKED_SONGS_FILE)
        song['liked_at'] = datetime.now().isoformat()
        
        # Remove if already exists
        songs = [s for s in songs if s.get('id') != song.get('id')]
        songs.insert(0, song)
        
        if save_json_data(LIKED_SONGS_FILE, songs):
            return jsonify({'success': True, 'message': 'Song added to liked songs'})
        return jsonify({'error': 'Failed to save'}), 500
    
    elif request.method == 'DELETE':
        data = request.get_json()
        song_id = data.get('id')
        if not song_id:
            return jsonify({'error': 'No song ID provided'}), 400
        
        songs = load_json_data(LIKED_SONGS_FILE)
        songs = [s for s in songs if s.get('id') != song_id]
        
        if save_json_data(LIKED_SONGS_FILE, songs):
            return jsonify({'success': True, 'message': 'Song removed from liked songs'})
        return jsonify({'error': 'Failed to save'}), 500

@app.route('/playlists', methods=['GET', 'POST'])
def playlists():
    if request.method == 'GET':
        playlists = load_json_data(PLAYLISTS_FILE)
        return jsonify({'playlists': playlists})
    
    elif request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        if not name:
            return jsonify({'error': 'No playlist name provided'}), 400
        
        playlists = load_json_data(PLAYLISTS_FILE)
        playlist = {
            'id': str(len(playlists) + 1),
            'name': name,
            'songs': [],
            'created_at': datetime.now().isoformat()
        }
        playlists.append(playlist)
        
        if save_json_data(PLAYLISTS_FILE, playlists):
            return jsonify({'success': True, 'playlist': playlist})
        return jsonify({'error': 'Failed to save'}), 500

@app.route('/playlists/<playlist_id>/songs', methods=['POST', 'DELETE'])
def playlist_songs(playlist_id):
    playlists = load_json_data(PLAYLISTS_FILE)
    playlist = next((p for p in playlists if p['id'] == playlist_id), None)
    
    if not playlist:
        return jsonify({'error': 'Playlist not found'}), 404
    
    if request.method == 'POST':
        data = request.get_json()
        song = data.get('song')
        if not song:
            return jsonify({'error': 'No song data provided'}), 400
        
        # Remove if already exists
        playlist['songs'] = [s for s in playlist['songs'] if s.get('id') != song.get('id')]
        playlist['songs'].append(song)
        
        if save_json_data(PLAYLISTS_FILE, playlists):
            return jsonify({'success': True, 'message': 'Song added to playlist'})
        return jsonify({'error': 'Failed to save'}), 500
    
    elif request.method == 'DELETE':
        data = request.get_json()
        song_id = data.get('id')
        if not song_id:
            return jsonify({'error': 'No song ID provided'}), 400
        
        playlist['songs'] = [s for s in playlist['songs'] if s.get('id') != song_id]
        
        if save_json_data(PLAYLISTS_FILE, playlists):
            return jsonify({'success': True, 'message': 'Song removed from playlist'})
        return jsonify({'error': 'Failed to save'}), 500

@app.route('/recent-tracks', methods=['GET', 'POST'])
def recent_tracks():
    if request.method == 'GET':
        tracks = load_json_data(RECENT_TRACKS_FILE)
        return jsonify({'tracks': tracks})
    
    elif request.method == 'POST':
        data = request.get_json()
        track = data.get('track')
        if not track:
            return jsonify({'error': 'No track data provided'}), 400
        
        tracks = load_json_data(RECENT_TRACKS_FILE)
        track['played_at'] = datetime.now().isoformat()
        
        # Remove if already exists
        tracks = [t for t in tracks if t.get('id') != track.get('id')]
        tracks.insert(0, track)
        
        # Keep only last 50 tracks
        tracks = tracks[:50]
        
        if save_json_data(RECENT_TRACKS_FILE, tracks):
            return jsonify({'success': True})
        return jsonify({'error': 'Failed to save'}), 500

if __name__ == '__main__':
    print("Starting AudioStream server...")
    print("Open your browser and go to: http://localhost:5000")
    print("For debugging, visit: http://localhost:5000/debug")
    app.run(debug=True, host='0.0.0.0', port=5000)
