# Python AI service before queued workers

The MVP uses a Python FastAPI AI Service with explicit HTTP endpoints for bounded AI jobs before introducing queue-backed workers. This keeps the first implementation simpler while preserving the architectural boundary between the Payload application and AI processing; queued AI Workers can be added later when retries, batching, or long-running jobs justify the extra infrastructure.
