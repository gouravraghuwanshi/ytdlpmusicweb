from flask import Flask, render_template, request, jsonify, send_file, Response, stream_with_context
import yt_dlp
import os
import time
from urllib.parse import urlparse, parse_qs
from flask_cors import CORS
import subprocess
import threading
import queue

app = Flask(__name__)
CORS(app, resources={
    r"/search": {
        "origins": "*",
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    },
    r"/download": {
        "origins": "*",
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    },
    r"/play/*": {
        "origins": "*",
        "methods": ["GET", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

def search_videos(query, max_results=5):
    """Search for YouTube videos"""
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
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

# Create a cache directory for audio files
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)

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
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return cache_path, None
    except Exception as e:
        return None, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST', 'OPTIONS'])
def search():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    query = request.json.get('query')
    if not query:
        return jsonify({'error': 'No search query provided'}), 400
    
    videos = search_videos(query)
    return jsonify({'results': videos})

@app.route('/play-audio', methods=['POST', 'OPTIONS'])
def play_audio():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    url = request.json.get('url')
    mode = request.json.get('mode', 'stream')  # 'stream' or 'download'
    
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

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

@app.route('/play/<filename>')
def play_file(filename):
    response = send_file(os.path.join(CACHE_DIR, filename))
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

if __name__ == '__main__':
    app.run(debug=True)
