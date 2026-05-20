import os
import secrets

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.jobs.demo_content import generate_demo_content
from app.jobs.outreach import generate_outreach_draft
from app.jobs.profile import generate_business_profile
from app.jobs.qa import review_demo_page
from app.llm import ProviderError, refresh_model_catalog
from app.schemas import AiQaReport, BusinessProfile, DemoContent, DemoContentRequest, ModelCatalogRequest, ModelCatalogResponse, OutreachDraft, OutreachDraftRequest, ProfileRequest, QaRequest

app = FastAPI(title="AI Demo Pipeline Service")
service_token_scheme = HTTPBearer(auto_error=False)


def require_service_token(credentials: HTTPAuthorizationCredentials | None = Depends(service_token_scheme)) -> None:
    expected_token = os.getenv("AI_SERVICE_TOKEN")
    supplied_token = credentials.credentials if credentials else ""
    if not expected_token or not supplied_token or not secrets.compare_digest(supplied_token, expected_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


@app.exception_handler(ProviderError)
def provider_error_handler(_: Request, exc: ProviderError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"category": exc.category, "message": str(exc)})


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/profile", response_model=BusinessProfile, dependencies=[Depends(require_service_token)])
def profile(request: ProfileRequest) -> BusinessProfile:
    return generate_business_profile(request)


@app.post("/demo-content", response_model=DemoContent, dependencies=[Depends(require_service_token)])
def demo_content(request: DemoContentRequest) -> DemoContent:
    return generate_demo_content(request)


@app.post("/qa", response_model=AiQaReport, dependencies=[Depends(require_service_token)])
def qa(request: QaRequest) -> AiQaReport:
    return review_demo_page(request)


@app.post("/outreach-draft", response_model=OutreachDraft, dependencies=[Depends(require_service_token)])
def outreach_draft(request: OutreachDraftRequest) -> OutreachDraft:
    return generate_outreach_draft(request)


@app.post("/models/refresh", response_model=ModelCatalogResponse, dependencies=[Depends(require_service_token)])
def models_refresh(request: ModelCatalogRequest) -> ModelCatalogResponse:
    return ModelCatalogResponse(provider=request.provider, models=refresh_model_catalog(request.provider))
