# Multilingual Video OCR

**Multilingual Video OCR** is a Flask-based web application that allows users to upload videos and extract text from them in real-time using OCR (Optical Character Recognition) technology. It supports multiple languages and provides frame-by-frame text detection with the ability to download results as a CSV file.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [Supported Languages](#supported-languages)
- [Dependencies](#dependencies)
- [Configuration](#configuration)
- [File Structure](#file-structure)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)
- [License](#license)

## Features

- Upload `.mp4`, `.mov`, or `.avi` video files.
- Extract and display detected text from each second of the video.
- Supports multilingual OCR using Tesseract.
- Interactive history and frame navigation.
- Download detected text in CSV format.
- Bootstrap UI with language pack installation help modal.

## Demo

> Upload a video and see text detection in action for each second of the playback. Select from multiple languages and explore the detected text timeline.

## Installation

### Prerequisites

- Python 3.11+
- Node.js (if modifying frontend assets)
- Tesseract OCR with appropriate language packs

### Install Tesseract

```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract

# Windows
Download from: https://github.com/tesseract-ocr/tesseract
```


## Usage

Run the application using:

```bash
poetry run python app.py
```

Open your browser and navigate to http://localhost:5000.

## Supported Languages

- English

- Spanish

- French

- German

- Chinese (Simplified)

- Japanese

- Korean

- Russian

- Arabic

- Hindi

- Auto Detect (OSD)

---

## Dependencies

- Flask

- OpenCV

- Pillow

- pytesseract

- Bootstrap 5

- Font Awesome

Refer to pyproject.toml for full version constraints.

---

## Configuration

1. Uploaded videos are saved to static/uploads.

2. OCR settings and image preprocessing are handled in ocr_engine.py.

3. Language detection and switching logic is located in main.js.

---

## File Structure

```bash
.
├── app.py                  # Flask app factory and entry point
├── video_routes.py         # Routes for uploading and processing videos
├── ocr_engine.py           # Core OCR logic and image preprocessing
├── templates/
│   └── index.html          # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css       # Application styles
│   ├── js/
│   │   └── main.js         # Frontend logic and interactions
│   └── uploads/            # Uploaded video storage
├── pyproject.toml          # Project metadata and dependencies
```

---

## Troubleshooting

- **OCR Error: Unsupported language code**
Ensure the selected language is installed in Tesseract.

- **No text detected**
Try improving video quality or selecting the correct language.

- **Video not playing**
Ensure the uploaded file is a valid video format.

--- 

## Screenshots

![App Screenshot][def]

![App Screenshot][def2]

![App Screenshot][def3]

[def]: ./assets/ocr1.png

[def2]: ./assets/ocr2.png

[def3]: ./assets/ocr3.png




