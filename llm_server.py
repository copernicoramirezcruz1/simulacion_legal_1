#!/usr/bin/env python3
"""
LLM Server multi-proveedor — puerto 5051
Endpoint: POST /sentencia
Proveedores: ollama (local), groq, gemini, openai
"""

import http.server
import json
import os
import sys
import urllib.request
import urllib.error

PORT = 5051
BASE_DIR = os.path.dirname(__file__)
CONFIG_PATH = os.path.join(BASE_DIR, "llm_config.json")

PROMPT_TEMPLATE = """Eres un juez del Tribunal de Garantias Constitucionales de Bolivia.
Dicta sentencia en esta accion de amparo considerando los argumentos expuestos.

SENTENCIA BASE:
{original}

ARGUMENTOS DE LA PARTE ACCIONANTE:
{argumentos}

INSTRUCCIONES:
- Si los argumentos son solidos, fundamentados y evidencian vulneracion de derechos constitucionales: CONCEDE el amparo.
- Si los argumentos son debiles, no fundamentan la vulneracion o carecen de sustento juridico: DENIEGA el amparo.
- Si los argumentos son parcialmente validos pero insuficientes: CONCEDE EN PARTE el amparo.
- Manten el formato juridico boliviano: VISTOS, CONSIDERANDO, POR TANTO.
- NO inventes datos ni hechos. Evaluacion basada exclusivamente en los argumentos presentados.
- Responde UNICAMENTE con la sentencia completa, sin comentarios adicionales."""


def load_config():
    with open(CONFIG_PATH) as f:
        return json.load(f)


def build_prompt(original, argumentos):
    args_text = "\n".join(f"- {a}" for a in argumentos)
    return PROMPT_TEMPLATE.format(original=original, argumentos=args_text)


# --- Backend: Ollama ---

def call_ollama(config, prompt):
    url = f"{config['url']}/api/generate"
    body = json.dumps({
        "model": config["model"],
        "prompt": prompt,
        "stream": False,
    }).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=300)
    data = json.loads(resp.read())
    return data.get("response", "")


# --- Backend: Groq ---

def call_groq(config, prompt):
    url = "https://api.groq.com/openai/v1/chat/completions"
    body = json.dumps({
        "model": config["model"],
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 4096,
    }).encode()
    req = urllib.request.Request(url, data=body, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config['api_key']}",
    })
    resp = urllib.request.urlopen(req, timeout=30)
    data = json.loads(resp.read())
    return data["choices"][0]["message"]["content"]


# --- Backend: Gemini ---

def call_gemini(config, prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{config['model']}:generateContent?key={config['api_key']}"
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 4096},
    }).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=30)
    data = json.loads(resp.read())
    return data["candidates"][0]["content"]["parts"][0]["text"]


# --- Backend: OpenAI ---

def call_openai(config, prompt):
    url = f"{config['url']}/chat/completions"
    body = json.dumps({
        "model": config["model"],
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 4096,
    }).encode()
    req = urllib.request.Request(url, data=body, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config['api_key']}",
    })
    resp = urllib.request.urlopen(req, timeout=30)
    data = json.loads(resp.read())
    return data["choices"][0]["message"]["content"]


BACKENDS = {
    "ollama": call_ollama,
    "groq": call_groq,
    "gemini": call_gemini,
    "openai": call_openai,
}


class LLMHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/sentencia":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            data = json.loads(body)
            sentencia_base = data.get("sentenciaBase", "").strip()
            argumentos = data.get("argumentos", [])
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        if not sentencia_base:
            self.send_error(400, "sentenciaBase requerida")
            return

        try:
            config = load_config()
        except Exception as e:
            self._send_error(500, f"Error loading config: {e}")
            return

        provider = config.get("provider", "ollama")
        backend = BACKENDS.get(provider)

        if not backend:
            self._send_error(400, f"Proveedor desconocido: {provider}")
            return

        print(f"[LLM] Provider: {provider}, model: {config.get(provider, {}).get('model', '?')}", file=sys.stderr)
        print(f"[LLM] Argumentos: {len(argumentos)}, sentenciaBase: {len(sentencia_base)} chars", file=sys.stderr)

        try:
            prompt = build_prompt(sentencia_base, argumentos)
            provider_config = config.get(provider, {})
            response = backend(provider_config, prompt)
            print(f"[LLM] Response: {len(response)} chars", file=sys.stderr)
            self._send_json({"sentencia": response.strip()})
        except urllib.error.HTTPError as e:
            body_err = e.read().decode(errors="replace")[:300]
            print(f"[LLM] HTTP error {e.code}: {body_err}", file=sys.stderr)
            self._send_error(502, f"LLM error ({e.code})")
        except urllib.error.URLError as e:
            print(f"[LLM] Connection error: {e.reason}", file=sys.stderr)
            self._send_error(502, f"No se pudo conectar al LLM: {e.reason}")
        except Exception as e:
            print(f"[LLM] Error: {e}", file=sys.stderr)
            self._send_error(500, str(e)[:200])

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _send_json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, code, msg):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        body = json.dumps({"error": msg}, ensure_ascii=False).encode("utf-8")
        self.wfile.write(body)

    def log_message(self, format, *args):
        print(f"[LLM] {args[0]}", file=sys.stderr)


if __name__ == "__main__":
    config = load_config()
    provider = config.get("provider", "ollama")
    model = config.get(provider, {}).get("model", "?")
    print(f"LLM Server on port {PORT}")
    print(f"Provider: {provider} | Model: {model}")
    server = http.server.HTTPServer(("0.0.0.0", PORT), LLMHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
