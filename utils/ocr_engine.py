import cv2
import pytesseract
import numpy as np

class OCREngine:
    """
    Handles OCR processing for frames using Tesseract.
    Supports multiple languages.
    """
    
    def __init__(self):
        self.language = 'eng'
        
        self.available_languages = {
            'english': 'eng',
            'spanish': 'spa',
            'french': 'fra',
            'german': 'deu',
            'chinese': 'chi_sim',
            'japanese': 'jpn',
            'korean': 'kor',
            'russian': 'rus',
            'arabic': 'ara',
            'hindi': 'hin',
            'auto': 'osd'
        }
    
    def set_language(self, language):
        """Set the OCR language."""
        if language in self.available_languages:
            self.language = self.available_languages[language]
        elif language in self.available_languages.values():
            self.language = language
    
    def get_available_languages(self):
        """Return list of available languages."""
        return list(self.available_languages.keys())
    
    def preprocess_image(self, frame):
        """
        Preprocess image for better OCR results (optimized for Latin scripts).
        
        Args:
            frame: OpenCV image frame
            
        Returns:
            Preprocessed image
        """

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        
        thresh = cv2.adaptiveThreshold(
            blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 11, 2
        )
        
        kernel = np.ones((1, 1), np.uint8)
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        
        result = cv2.bitwise_not(opening)
        
        return result
        
    def preprocess_non_latin(self, frame):
        """
        Preprocess frame for better OCR results with non-Latin scripts.
        
        Args:
            frame: OpenCV image frame
            
        Returns:
            Preprocessed image
        """

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        bilateral = cv2.bilateralFilter(gray, 9, 75, 75)
        
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(bilateral)
        
        _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        kernel = np.ones((2, 2), np.uint8)
        dilated = cv2.dilate(binary, kernel, iterations=1)
        
        return dilated
    
    def extract_text(self, frame, language=None):
        """
        Extract text from an image frame using OCR.
        
        Args:
            frame: OpenCV image frame
            language: Optional language override
            
        Returns:
            Extracted text as string
        """
        try:

            lang = language if language else self.language
            
            if lang in ['hin', 'ara', 'chi_sim', 'jpn', 'kor']:

                processed_image = self.preprocess_non_latin(frame)
            else:

                processed_image = self.preprocess_image(frame)

            if lang == 'hin':

                config = '--psm 6 --oem 1'
            elif lang in ['chi_sim', 'jpn', 'kor']:

                config = '--psm 4 --oem 1'
            elif lang == 'ara':

                config = '--psm 6 --oem 1'
            else:

                config = '--psm 6 --oem 3'
            
            text = pytesseract.image_to_string(
                processed_image, 
                lang=lang,
                config=config
            )
            
            if not text.strip():

                alt_config = '--psm 3 --oem 1'
                text = pytesseract.image_to_string(
                    processed_image,
                    lang=lang,
                    config=alt_config
                )
            
            return text.strip()
            
        except Exception as e:
            print(f"OCR Error: {str(e)}")
            return f"OCR Error: Please check if language pack '{language}' is installed"

ocr_engine = OCREngine()