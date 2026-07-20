#!/usr/bin/env python3
import http.server
import subprocess
import tempfile
import json
import os
import sys
import shutil

PORT = 5050
PIPER = os.path.join(os.path.dirname(__file__), "piper", "piper")
LD_LIBRARY_PATH = os.path.join(os.path.dirname(__file__), "piper")
VOICES_DIR = os.path.join(os.path.dirname(__file__), "piper_voices")
CACHE_DIR = os.path.join(tempfile.gettempdir(), "tts_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

VOICE_MAP = {
    "PRESIDENTE": "es_ES-carlfm-x_low",
    "VOCAL": "es_MX-ald-x_low",
    "SECRETARIA": "es_AR-daniela-high",
    "ACCIONADA": "es_ES-mls_9972-low",
    "TERCERO": "es_MX-claude-high",
}

class TTSHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/tts":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
            text = data.get("text", "").strip()
            role = data.get("role", "PRESIDENTE")
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        if not text:
            self.send_error(400, "Empty text")
            return

        voice = VOICE_MAP.get(role, "es_ES-davefx-medium")
        model_path = os.path.join(VOICES_DIR, f"{voice}.onnx")

        if not os.path.exists(model_path):
            self.send_error(500, f"Voice model not found: {voice}")
            return

        text_clean = text.replace("\n", " ").strip()

        # Cache key
        import hashlib
        cache_key = hashlib.md5(f"{voice}:{text_clean}".encode()).hexdigest()
        cache_file = os.path.join(CACHE_DIR, f"{cache_key}.wav")

        if os.path.exists(cache_file):
            self._send_wav(cache_file)
            return

        try:
            env = os.environ.copy()
            if "LD_LIBRARY_PATH" in env:
                env["LD_LIBRARY_PATH"] = LD_LIBRARY_PATH + ":" + env["LD_LIBRARY_PATH"]
            else:
                env["LD_LIBRARY_PATH"] = LD_LIBRARY_PATH

            result = subprocess.run(
                [PIPER, "--model", model_path, "--output_file", cache_file],
                input=text_clean,
                capture_output=True,
                text=True,
                env=env,
                timeout=30,
            )

            if result.returncode != 0 or not os.path.exists(cache_file):
                print(f"Piper error: {result.stderr}", file=sys.stderr)
                self.send_error(500, "TTS generation failed")
                return

            self._send_wav(cache_file)

        except subprocess.TimeoutExpired:
            self.send_error(500, "TTS generation timeout")
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            self.send_error(500, str(e))

    def _send_wav(self, filepath):
        self.send_response(200)
        self.send_header("Content-Type", "audio/wav")
        self.send_header("Content-Length", str(os.path.getsize(filepath)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "public, max-age=86400")
        self.end_headers()
        with open(filepath, "rb") as f:
            self.wfile.write(f.read())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        print(f"[TTS] {args[0]}", file=sys.stderr)

if __name__ == "__main__":
    print(f"Piper TTS Server on port {PORT}")
    print(f"Piper binary: {PIPER}")
    print(f"Voices: {list(VOICE_MAP.values())}")
    server = http.server.HTTPServer(("0.0.0.0", PORT), TTSHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
