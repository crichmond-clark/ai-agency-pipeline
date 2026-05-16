from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.jobs.demo_content import generate_demo_content
from app.jobs.outreach import generate_outreach_draft
from app.jobs.profile import generate_business_profile
from app.jobs.qa import review_demo_page
from app.llm import ProviderError, refresh_model_catalog
from app.schemas import AiQaReport, BusinessProfile, DemoContent, DemoContentRequest, ModelCatalogRequest, ModelCatalogResponse, OutreachDraft, OutreachDraftRequest, ProfileRequest, QaRequest

app = FastAPI(title="AI Demo Pipeline Service")


@app.exception_handler(ProviderError)
def provider_error_handler(_: Request, exc: ProviderError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"category": exc.category, "message": str(exc)})


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


@app.post("/outreach-draft", response_model=OutreachDraft)
def outreach_draft(request: OutreachDraftRequest) -> OutreachDraft:
    return generate_outreach_draft(request)


@app.post("/models/refresh", response_model=ModelCatalogResponse)
def models_refresh(request: ModelCatalogRequest) -> ModelCatalogResponse:
    return ModelCatalogResponse(provider=request.provider, models=refresh_model_catalog(request.provider))
