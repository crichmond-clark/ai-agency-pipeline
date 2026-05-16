# Python service owns OpenAI calls

The Python AI Service owns OpenAI calls for generation and QA, while the Payload application owns app state, approvals, rendering, and email sending. Keeping prompts, model configuration, retry behaviour, and AI logging behind one service boundary avoids split-brain AI logic and makes future queue-backed workers easier to introduce.
