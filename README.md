# ambientRobo

AI-powered ambient and techno pattern generator. Describe a sound in plain text and the app generates and plays it live in the browser.

## How it works

User prompts are sent to [Groq](https://groq.com/), a cloud inference service running the Llama 3.3 70B language model. The model returns a pattern written in [Strudel](https://strudel.cc/), a JavaScript-based live coding language for music. The pattern is evaluated directly in the browser via the Strudel Web API, and an audio-reactive flow field visualizer responds to the output in real time.

## Acknowledgements

Strudel documentation and prompt examples adapted from [strudel-llm-docs](https://github.com/calvinw/strudel-llm-docs) by calvinw, licensed under MIT.

Flow field and particle curve visualizers adapted from [Frank's Laboratory](https://codepen.io/franksLaboratory) on CodePen.