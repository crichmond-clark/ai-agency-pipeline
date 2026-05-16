from fastapi import FastAPI

from app.jobs.demo_content import generate_demo_content
from app.jobs.profile import generate_business_profile
from app.jobs.qa import review_demo_page
from app.schemas import AiQaReport, BusinessProfile, DemoContent, DemoContentRequest, ProfileRequest, QaRequest

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


@app.post("/qa", response_model=AiQaReport)
def qa(request: QaRequest) -> AiQaReport:
    return review_demo_page(request)
