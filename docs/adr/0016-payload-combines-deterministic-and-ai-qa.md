# Payload combines deterministic and AI QA

Deterministic QA lives in the Next.js/Payload application, while AI-assisted QA lives in the Python AI Service. Payload combines both results into the saved QA report and decides whether a Demo Site receives a QA Pass, because deterministic checks inspect app-owned records/rendering rules and Payload owns workflow state.
