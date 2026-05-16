from fastapi import FastAPI

from app.jobs.demo_content import generate_demo_content
from app.jobs.profile import generate_business_profile
from app.schemas import BusinessProfile, DemoContent, DemoContentRequest, ProfileRequest

app = FastAPI(title="AI Demo Pipeline Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/profile", response_model=BusinessProfile)
def profile(request: ProfileRequest) -> BusinessProfile:
    return generate_business_profile(request)


@app.post("/demo-content", response_model=DemoContent)
def demo_content(request: DemoContentRequest) -> DemoContent:
    return generate_demo_content(request)
