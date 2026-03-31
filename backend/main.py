"""
main.py

FastAPI backend for ambientRobo. Exposes a /generate endpoint that forwards
user prompts and conversation history to the Groq LLM API and returns Strudel code.

Requires: system_prompt.py (SYSTEM_PROMPT) and API key.

Author: Ville Laaksoaho
"""

import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from groq import Groq
from pydantic import BaseModel
from system_prompt import SYSTEM_PROMPT

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLES_DIR = "samples"
AUDIO_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac"}

app.mount("/samples", StaticFiles(directory=SAMPLES_DIR), name="samples")


@app.get("/samples-manifest")
def samples_manifest():
    manifest = {}
    for entry in sorted(os.listdir(SAMPLES_DIR)):
        entry_path = os.path.join(SAMPLES_DIR, entry)
        if not os.path.isdir(entry_path):
            continue
        # Check if entry contains audio files directly (e.g. vocalChops)
        direct_files = sorted(
            f"http://localhost:8000/samples/{entry}/{f}"
            for f in os.listdir(entry_path)
            if os.path.splitext(f)[1].lower() in AUDIO_EXTENSIONS
        )
        if direct_files:
            manifest[entry] = direct_files
            continue
        # Otherwise walk one level deeper (e.g. drums/bd, drums/hh)
        for folder in sorted(os.listdir(entry_path)):
            folder_path = os.path.join(entry_path, folder)
            if not os.path.isdir(folder_path):
                continue
            files = sorted(
                f"http://localhost:8000/samples/{entry}/{folder}/{f}"
                for f in os.listdir(folder_path)
                if os.path.splitext(f)[1].lower() in AUDIO_EXTENSIONS
            )
            if files:
                manifest[folder] = files
    return manifest


class Message(BaseModel):
    role: str
    content: str


class PromptRequest(BaseModel):
    prompt: str
    history: List[Message] = []


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate")
async def generate(request: PromptRequest):
    """
    Generate a Strudel pattern from a user prompt using the Groq LLM API.

    Args:
        request (PromptRequest): The user prompt and optional conversation history.

    Returns:
        dict: A dict with a single key ``result`` containing the raw LLM response text.

    Raises:
        HTTPException: 400 if the prompt is blank.
    """
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    messages = (
        [{"role": "system", "content": SYSTEM_PROMPT}]
        + [{"role": m.role, "content": m.content} for m in request.history]
        + [{"role": "user", "content": request.prompt}]
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
    )
    return {"result": response.choices[0].message.content}
