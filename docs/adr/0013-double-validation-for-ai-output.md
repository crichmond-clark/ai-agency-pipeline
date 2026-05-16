# Double validation for AI output

AI Service responses are validated twice: first with Pydantic inside the Python AI Service before returning, then with Zod inside the Payload application before saving or rendering. This treats AI output and cross-service responses as trust boundaries, keeps primary records valid, and avoids introducing shared schema-generation complexity in the MVP.
