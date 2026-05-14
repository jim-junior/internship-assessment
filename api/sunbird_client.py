import requests
import httpx
import os
from fastapi import File, UploadFile
import json


class SunbirdAPIClient:
    """API Client for Sunbird API"""

    def __init__(self):
        self.base_url = "https://api.sunbird.ai"
        self.api_token = os.getenv("SUNBIRD_API_TOKEN")
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
        }
        self.language_speaker_ids = {
            "Luganda": 248,
            "Acholi": 241,
            "Ateso": 242,
            "Runyankole": 243,
            "Lugbara": 245
        }

    def summarize_text(self, text: str) -> str:
        """Summarizes the given text using Sunbird API"""
        endpoint = f"{self.base_url}/tasks/summarise"
        payload = {
            "text": text,
        }
        response = httpx.post(endpoint, json=payload,
                              headers=self.headers, timeout=None)
        response.raise_for_status()
        return response.json()["summarized_text"]

    def translate_text(self, text: str, language: str) -> str:
        """Translates the given text to the specified language using Sunbird API"""
        endpoint = f"{self.base_url}/tasks/sunflower_simple"
        instruction_prompt = f"Translate the following English text into {language}: {text}"
        payload = {
            "instruction": instruction_prompt,
            "model_type": "qwen",
            "temperature": 0.2,
        }
        response = httpx.post(endpoint, data=payload,
                              headers=self.headers, timeout=None)
        response.raise_for_status()
        return response.json()["response"]

    def speech_to_text(self, audio_file: UploadFile) -> str:
        """Converts speech from the given audio URL to text using Sunbird API"""
        endpoint = f"{self.base_url}/tasks/stt"
        files = {
            "audio": (audio_file.filename, audio_file.file.read(), audio_file.content_type),
        }
        payload = {"language": "eng"}
        response = httpx.post(endpoint, data=payload, files=files, headers={
            "Authorization": f"Bearer {self.api_token}"
        }, timeout=None)

        response.raise_for_status()
        return response.json()["audio_transcription"]

    def text_to_speech(self, text: str, language: str) -> bytes:
        """Converts the given text to speech in the specified language using Sunbird API"""
        speaker_id = self.language_speaker_ids.get(language)
        if not speaker_id:
            raise ValueError(f"Unsupported language: {language}")

        endpoint = f"{self.base_url}/tasks/tts"
        payload = {
            "text": text,
            "speaker_id": speaker_id
        }
        response = httpx.post(endpoint, json=payload,
                              headers=self.headers, timeout=None)
        response.raise_for_status()
        return response.json()["output"]["audio_url"]
