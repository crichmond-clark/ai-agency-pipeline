# Service-to-service AI authentication

The Python AI Service requires a shared bearer token on all generation, QA, outreach, and model-refresh endpoints. The Payload/Next app sends `Authorization: Bearer ${AI_SERVICE_TOKEN}` from server-side code only, and `/health` remains unauthenticated for local and hosting health checks.

This is the MVP service-auth mechanism because it is simple, environment-driven, and keeps AI provider calls unavailable to anonymous callers if the FastAPI service is accidentally reachable. Provider API keys still remain in environment variables and are never stored in Payload or sent to the browser. Stronger network controls, OAuth, or mTLS can replace the shared token later if the service boundary becomes multi-tenant or more widely exposed.
