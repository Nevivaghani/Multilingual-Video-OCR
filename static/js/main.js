document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const form = document.getElementById('uploadForm');
    const videoPlayer = document.getElementById('videoPlayer');
    const ocrText = document.getElementById('ocrText');
    const downloadBtn = document.getElementById('downloadCsv');
    const languageSelector = document.getElementById('languageSelector');
    const processingOverlay = document.getElementById('processingOverlay');
    const confThreshold = document.getElementById('confidenceThreshold');
    const historyList = document.getElementById('historyList');
    
    // Stats elements
    const totalFramesEl = document.getElementById('totalFrames');
    const textDetectedEl = document.getElementById('textDetected');
    const currentTimeEl = document.getElementById('currentTime');
    const helpModal = document.getElementById('helpModal');
    const modalContent = document.getElementById('modalHelpContent');
    
    // State variables
    let videoId = "";
    let textData = [];
    let intervalId = null;
    let languages = [];
    let currentLanguage = 'eng';
    let lastProcessedTime = -1;
    let historyEntries = [];
    let totalFrames = 0;
    let framesWithText = 0;
    
    // Language information for help modal
    const languageInfo = {
        'eng': { name: 'English', code: 'eng' },
        'spa': { name: 'Spanish', code: 'spa' },
        'fra': { name: 'French', code: 'fra' },
        'deu': { name: 'German', code: 'deu' },
        'chi_sim': { name: 'Chinese (Simplified)', code: 'chi_sim' },
        'jpn': { name: 'Japanese', code: 'jpn' },
        'kor': { name: 'Korean', code: 'kor' },
        'rus': { name: 'Russian', code: 'rus' },
        'ara': { name: 'Arabic', code: 'ara' },
        'hin': { name: 'Hindi', code: 'hin' },
        'osd': { name: 'Auto Detect', code: 'osd' }
    };
    
    // Fetch available languages
    fetchLanguages();
    
    // Event Listeners
    form.addEventListener('submit', handleVideoUpload);
    videoPlayer.addEventListener('play', startTextDetection);
    videoPlayer.addEventListener('pause', stopTextDetection);
    videoPlayer.addEventListener('ended', stopTextDetection);
    downloadBtn.addEventListener('click', downloadCsv);
    
    if (languageSelector) {
        languageSelector.addEventListener('change', function() {
            currentLanguage = this.value;
            // Restart detection if video is playing
            if (!videoPlayer.paused) {
                stopTextDetection();
                startTextDetection();
            }
        });
    }
    
    /**
     * Fetch available OCR languages from server
     */
    function fetchLanguages() {
        fetch('/get_available_languages')
            .then(response => response.json())
            .then(data => {
                languages = data.languages;
                populateLanguageSelector(languages);
            })
            .catch(error => {
                console.error('Error fetching languages:', error);
            });
    }
    
    /**
     * Populate language dropdown with available options
     * @param {Array} languages - List of available languages
     */
    function populateLanguageSelector(languages) {
        if (!languageSelector) return;
        
        languageSelector.innerHTML = '';
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang === 'english' ? 'eng' : 
                           lang === 'spanish' ? 'spa' : 
                           lang === 'french' ? 'fra' : 
                           lang === 'german' ? 'deu' : 
                           lang === 'chinese' ? 'chi_sim' : 
                           lang === 'japanese' ? 'jpn' : 
                           lang === 'korean' ? 'kor' : 
                           lang === 'russian' ? 'rus' : 
                           lang === 'arabic' ? 'ara' : 
                           lang === 'hindi' ? 'hin' : 
                           lang === 'auto' ? 'osd' : lang;
            option.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
            languageSelector.appendChild(option);
        });
    }
    
    /**
     * Handle video upload
     * @param {Event} e - Form submission event
     */
    async function handleVideoUpload(e) {
        e.preventDefault();
        
        // Clear previous data
        ocrText.innerText = 'Processing video...';
        textData = [];
        historyEntries = [];
        historyList.innerHTML = '';
        totalFrames = 0;
        framesWithText = 0;
        updateStats();
        
        // Show processing overlay
        processingOverlay.style.display = 'flex';
        
        try {
            const formData = new FormData(form);
            const response = await fetch('/upload_video', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            videoId = data.video_id;
            
            // Setup video player
            videoPlayer.src = '/static/uploads/' + videoId;
            videoPlayer.style.display = 'block';
            downloadBtn.disabled = false;
            
            // Hide overlay once video is loaded
            videoPlayer.onloadeddata = function() {
                processingOverlay.style.display = 'none';
                videoPlayer.play();
            };
            
        } catch (error) {
            console.error('Error uploading video:', error);
            ocrText.innerText = 'Error uploading video. Please try again.';
            processingOverlay.style.display = 'none';
        }
    }
    
    /**
     * Start text detection when video plays
     */
    function startTextDetection() {
        if (intervalId) {
            clearInterval(intervalId);
        }
        
        // Process every second
        intervalId = setInterval(async () => {
            if (videoPlayer.paused) return;
            
            const currentTime = videoPlayer.currentTime.toFixed(2);
            
            // Skip if we've already processed this time (within 0.5 seconds)
            if (Math.abs(currentTime - lastProcessedTime) < 0.5) {
                return;
            }
            
            lastProcessedTime = currentTime;
            totalFrames++;
            updateStats();
            
            try {
                // Show processing indicator
                ocrText.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status" style="width: 1rem; height: 1rem;"></div> Processing...</div>';
                
                const res = await fetch('/detect_text_at_time', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        video_id: videoId, 
                        timestamp: currentTime,
                        language: currentLanguage
                    })
                });
                
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                
                const result = await res.json();
                const text = result.text || '[No text detected]';
                
                // Check for error message
                if (text.includes('OCR Error')) {
                    ocrText.innerHTML = `<div class="alert alert-warning" role="alert">
                        <i class="fas fa-exclamation-triangle"></i> ${text}
                        <hr>
                        <small>Make sure you have installed the language pack for ${currentLanguage} in Tesseract OCR.</small>
                    </div>`;
                    
                    // Show language pack installation guide
                    showLanguagePackHelp(currentLanguage);
                    return;
                }
                
                // Update UI
                ocrText.innerText = text;
                
                // Update stats
                if (text !== '[No text detected]') {
                    framesWithText++;
                    updateStats();
                }
                
                // Save data
                if (!textData.some(entry => entry.timestamp === currentTime)) {
                    textData.push({ timestamp: currentTime, text });
                    
                    // Add to history list if text was detected
                    if (text !== '[No text detected]' && text.length > 0) {
                        addToHistory(currentTime, text);
                    }
                }
                
            } catch (error) {
                console.error('Error detecting text:', error);
                ocrText.innerHTML = `<div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-circle"></i> Error detecting text. 
                    <hr>
                    <small>Please check server logs or try with a different language.</small>
                </div>`;
            }
        }, 1000);
    }
    
    /**
     * Stop text detection
     */
    function stopTextDetection() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
    
    /**
     * Add entry to history list
     * @param {string} timestamp - Video timestamp
     * @param {string} text - Detected text
     */
    function addToHistory(timestamp, text) {
        // Only keep unique entries
        if (historyEntries.some(entry => entry.text === text)) {
            return;
        }
        
        historyEntries.push({ timestamp, text });
        
        // Add to UI
        const listItem = document.createElement('li');
        listItem.className = 'history-item';
        listItem.innerHTML = `
            <span class="badge timestamp-badge">${timestamp}s</span>
            <span class="text-truncate">${text.substring(0, 30)}${text.length > 30 ? '...' : ''}</span>
        `;
        
        // Jump to timestamp when clicked
        listItem.addEventListener('click', () => {
            videoPlayer.currentTime = parseFloat(timestamp);
            ocrText.innerText = text;
        });
        
        historyList.prepend(listItem);
    }
    
    /**
     * Download CSV of detected text
     */
    function downloadCsv() {
        if (textData.length === 0) return;
        
        let csv = 'Timestamp,Text\n';
        textData.forEach(row => {
            const cleanText = row.text.replace(/"/g, '""');
            csv += `"${row.timestamp}","${cleanText}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ocr_text_data.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Update statistics
     */
    function updateStats() {
        if (totalFramesEl) totalFramesEl.textContent = totalFrames;
        if (textDetectedEl) textDetectedEl.textContent = framesWithText;
        if (currentTimeEl && videoPlayer) currentTimeEl.textContent = videoPlayer.currentTime.toFixed(2) + 's';
    }
    
    /**
     * Show language pack installation help
     * @param {string} langCode - The language code that needs installation help
     */
    function showLanguagePackHelp(langCode) {
        if (!helpModal || !modalContent) return;
        
        // Get language info
        const lang = languageInfo[langCode] || { name: langCode, code: langCode };
        
        // Create help content
        modalContent.innerHTML = `
            <div class="alert alert-info">
                <h5><i class="fas fa-info-circle"></i> Missing Language Pack: ${lang.name}</h5>
                <p>It seems the language pack for <strong>${lang.name}</strong> (code: ${lang.code}) is not installed or not properly configured with Tesseract OCR.</p>
                
                <h6 class="mt-3">Installation Instructions:</h6>
                <ul>
                    <li><strong>Windows:</strong> Download the language data file (${lang.code}.traineddata) from 
                        <a href="https://github.com/tesseract-ocr/tessdata" target="_blank">Tesseract GitHub</a> 
                        and place it in your Tesseract tessdata directory.</li>
                    <li><strong>Ubuntu/Debian:</strong> Run <code>sudo apt-get install tesseract-ocr-${lang.code}</code></li>
                    <li><strong>macOS:</strong> Run <code>brew install tesseract-lang</code> to install all language packs</li>
                </ul>
                
                <p class="mt-3">After installing the language pack, restart the application.</p>
            </div>
        `;
        
        // Show modal
        new bootstrap.Modal(helpModal).show();
    }
    
});