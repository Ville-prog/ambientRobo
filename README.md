# ambientRobo

A personal passion project born from a love of ambient and techno music. Describe a sound, a mood, or a feeling in plain text and ambientRobo generates and plays it live in the browser using [Strudel](https://strudel.cc/), a JavaScript live coding language for music.

Open source under the MIT License.

---

## Live demo

TODO

---

## How it works

1. Type s a description into the text field, e.g. `ambient track with harmonizing drones`.
2. The prompt and conversation history are sent to a FastAPI backend.
3. The backend forwards the request to [Groq](https://groq.com/), a cloud inference service running **Llama 3.3 70B**.
4. The model returns a pattern written in [Strudel](https://strudel.cc/), a JavaScript live coding DSL for music.
5. The pattern is evaluated and played directly in the browser via the Strudel Web API.


The conversation is stateful: each new prompt is sent with previous exchanges as context, so you can iterate on the result with follow-up prompts like `make it slower`, `add more reverb`, or `switch to a minor key`.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Uvicorn |
| LLM inference | Groq API (Llama 3.3 70B) |
| Frontend | Vanilla JS, HTML, CSS |
| Audio engine | Strudel Web (`@strudel/web`) |
| Visualizer | Canvas 2D, Web Audio API |
| CI | GitHub Actions (pytest + Jest) |
| Hosting | Railway (single service) |

---

## Project structure

```
ambientRobo/
├── backend/
│   ├── main.py             # FastAPI app: /generate, /samples-manifest, static file serving
│   ├── system_prompt.py    # LLM system prompt with Strudel syntax and style rules
│   ├── samples/            # Custom audio sample banks
│   ├── tests/
│   │   ├── test_generate.py
│   │   └── test_manifest.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── app.js              # Prompt submission, history, Strudel evaluation
│   ├── visualizer.js       # Audio-responsive flow field visualizer
│   ├── utils.js            # Shared utilities
│   ├── style.css
│   └── tests/
│       └── utils.test.js
├── .github/
    └── workflows/
        └── ci.yml          # Backend (pytest + ruff) and frontend (Jest) CI

```

---

## Acknowledgements

Strudel documentation and prompt examples adapted from [strudel-llm-docs](https://github.com/calvinw/strudel-llm-docs) by calvinw, licensed under MIT.

Flow field visualizer adapted from [Frank's Laboratory](https://codepen.io/franksLaboratory) on CodePen.

Audio samples sourced from:
- [Dough-Amen](https://github.com/Bubobubobubobubo/Dough-Amen) and [Dough-Juj](https://github.com/Bubobubobubobubo/Dough-Juj) by Bubobubobubobubo
- [Dirt-Samples](https://github.com/tidalcycles/Dirt-Samples) by the TidalCycles project