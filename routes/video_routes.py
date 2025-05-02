from flask import Blueprint, request, jsonify, send_from_directory
import os
import cv2
import uuid
from utils.ocr_engine import ocr_engine

video_bp = Blueprint('video', __name__)

UPLOAD_DIR = 'static/uploads'
os.makedirs(UPLOAD_DIR, exist_ok=True)

@video_bp.route('/upload_video', methods=['POST'])
def upload_video():
    """
    Handle video upload and save to server.
    
    Returns:
        JSON response with video_id
    """
    file = request.files.get('video')
    if not file:
        return jsonify({'error': 'No file provided'}), 400

    video_id = str(uuid.uuid4()) + ".mp4"
    video_path = os.path.join(UPLOAD_DIR, video_id)
    file.save(video_path)

    return jsonify({'video_id': video_id})

@video_bp.route('/static/uploads/<filename>')
def serve_video(filename):
    """
    Serve uploaded video files.
    
    Args:
        filename: Name of the video file
        
    Returns:
        Video file
    """
    return send_from_directory(UPLOAD_DIR, filename)

@video_bp.route('/detect_text_at_time', methods=['POST'])
def detect_text_at_time():
    """
    Extract text from a specific timestamp in the video.
    
    Returns:
        JSON response with extracted text
    """
    try:
        data = request.get_json()
        video_id = data.get('video_id')
        timestamp = float(data.get('timestamp', 0))
        language = data.get('language', 'eng')

        if not video_id:
            return jsonify({'text': 'Error: Missing video ID'}), 400

        video_path = os.path.join(UPLOAD_DIR, video_id)
        if not os.path.exists(video_path):
            return jsonify({'text': 'Error: Video not found'}), 404

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_number = int(timestamp * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        success, frame = cap.read()
        cap.release()

        if not success:
            return jsonify({'text': 'Error: Could not read frame'}), 500

        if language not in ocr_engine.available_languages.values():
            return jsonify({
                'text': f'OCR Error: Unsupported language code "{language}"'
            })

        text = ocr_engine.extract_text(frame, language)
     
        if not text or text.isspace():
            return jsonify({'text': '[No text detected]'})
            
        return jsonify({'text': text})
        
    except Exception as e:
        print(f"Error in detect_text_at_time: {str(e)}")
        return jsonify({'text': f'Server error: {str(e)}'}), 500

@video_bp.route('/get_available_languages', methods=['GET'])
def get_available_languages():
    """
    Get list of available OCR languages.
    
    Returns:
        JSON response with language options
    """
    languages = ocr_engine.get_available_languages()
    return jsonify({'languages': languages})