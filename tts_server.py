#!/usr/bin/env python3
import http.server
import subprocess
import tempfile
import json
import os
import sys
import hashlib
from socketserver import ThreadingMixIn

PORT = 5050
PIPER = os.path.join(os.path.dirname(__file__), "piper", "piper")
LD_LIBRARY_PATH = os.path.join(os.path.dirname(__file__), "piper")
VOICES_DIR = os.path.join(os.path.dirname(__file__), "piper_voices")
CACHE_DIR = os.path.join(tempfile.gettempdir(), "tts_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

VOICE_MAP = {
    "PRESIDENTE": {
        "voice": "es_ES-sharvard-medium",
        "speaker": 0,
    },
    "VOCAL": {
        "voice": "es_ES-davefx-medium",
    },
    "SECRETARIA": {
        "voice": "es_AR-daniela-high",
    },
    "ACCIONADA": {
        "voice": "es_MX-claude-high",
    },
    "TERCERO": {
        "voice": "es_MX-ald-x_low",
    },
}

FALLBACK_VOICE = {
    "voice": "es_ES-davefx-medium",
}

PROSODY_MAP = {
    "PRESIDENTE":       {"length_scale": 1.0, "noise_scale": 0.667, "sentence_silence": 0.35},
    "VOCAL":            {"length_scale": 1.0, "noise_scale": 0.667, "sentence_silence": 0.25},
    "SECRETARIA":       {"length_scale": 0.95, "noise_scale": 0.667, "sentence_silence": 0.22},
    "ACCIONANTE":       {"length_scale": 1.0, "noise_scale": 0.667, "sentence_silence": 0.25},
    "ACCIONADA":        {"length_scale": 1.05, "noise_scale": 0.7,   "sentence_silence": 0.28},
    "TERCERO":          {"length_scale": 1.0, "noise_scale": 0.667, "sentence_silence": 0.22},
    "SENTENCIA_FINAL":  {"length_scale": 1.0, "noise_scale": 0.667, "sentence_silence": 0.35},
}


def get_voice_cfg(role):
    return VOICE_MAP.get(role, FALLBACK_VOICE)


def get_prosody(role):
    return PROSODY_MAP.get(role, {"length_scale": 1.0, "noise_scale": 0.667, "sentence_silence": 0.25})


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

        vcfg = get_voice_cfg(role)
        voice_name = vcfg["voice"]
        speaker = vcfg.get("speaker")
        model_path = os.path.join(VOICES_DIR, f"{voice_name}.onnx")

        if not os.path.exists(model_path):
            self.send_error(500, f"Voice model not found: {voice_name}")
            return

        prosody = get_prosody(role)
        text_clean = text.replace("\n", " ").strip()

        cache_key = hashlib.md5(
            f"{voice_name}:{speaker}:{prosody['length_scale']}:{prosody['noise_scale']}:{prosody['sentence_silence']}:{text_clean}".encode()
        ).hexdigest()
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

            cmd = [
                PIPER,
                "--model", model_path,
                "--output_file", cache_file,
                "--length_scale", str(prosody["length_scale"]),
                "--noise_scale", str(prosody["noise_scale"]),
                "--sentence_silence", str(prosody["sentence_silence"]),
            ]

            if speaker is not None:
                cmd += ["--speaker", str(speaker)]

            result = subprocess.run(
                cmd,
                input=text_clean,
                capture_output=True,
                text=True,
                env=env,
                timeout=300,
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
    print(f"Piper TTS Server on port {PORT} (multi-threaded)")
    print(f"Piper binary: {PIPER}")
    for role, cfg in VOICE_MAP.items():
        sp = f" (speaker {cfg['speaker']})" if cfg.get("speaker") is not None else ""
        print(f"  {role}: {cfg['voice']}{sp}")
    print(f"  FALLBACK: {FALLBACK_VOICE['voice']}")

    class ThreadedServer(ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True

    server = ThreadedServer(("0.0.0.0", PORT), TTSHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
