from pydantic import BaseModel, Field
from typing import Any, Literal


class LeadInput(BaseModel):
    business_name: str | None = None
    city: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    website_url: str | None = None
    website_status: str | None = None
    source_payload: dict[str, Any] | None = None


class AiConfig(BaseModel):
    provider: str | None = None
    model: str | None = None


class ProfileRequest(BaseModel):
    lead: LeadInput
    ai_config: AiConfig | None = None


class Service(BaseModel):
    name: str


class VerifiedFact(BaseModel):
    fact: str
    source: str | None = None


class Assumption(BaseModel):
    assumption: str


class MissingInformation(BaseModel):
    item: str


class BusinessProfile(BaseModel):
    industry: str
    services: list[Service] = Field(default_factory=list)
    verified_facts: list[VerifiedFact] = Field(default_factory=list)
    assumptions: list[Assumption] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1)
    missing_information: list[MissingInformation] = Field(default_factory=list)
    raw_profile: dict[str, Any] | None = None


class DemoContentRequest(BaseModel):
    lead: LeadInput
    profile: BusinessProfile
    ai_config: AiConfig | None = None


class Hero(BaseModel):
    eyebrow: str
    headline: str
    subheadline: str
    cta: str


class DemoService(BaseModel):
    title: str
    description: str


class ContactCta(BaseModel):
    headline: str
    body: str
    button_label: str


class DemoContent(BaseModel):
    hero: Hero
    services: list[DemoService] = Field(min_length=1)
    why_choose_us: list[str] = Field(min_length=1)
    service_area: str
    contact_cta: ContactCta
    footer_disclaimer: str


class QaRequest(BaseModel):
    demo_url: str
    content: DemoContent
    ai_config: AiConfig | None = None


class QaFinding(BaseModel):
    severity: Literal["info", "warning", "error"]
    message: str


class AiQaReport(BaseModel):
    status: Literal["passed", "failed"]
    findings: list[QaFinding] = Field(default_factory=list)
    summary: str


class OutreachDraftRequest(BaseModel):
    lead: LeadInput
    demo_url: str
    ai_config: AiConfig | None = None


class OutreachDraft(BaseModel):
    subject: str
    body: str
    safety_notes: str


class ModelCatalogRequest(BaseModel):
    provider: str


class ModelCatalogResponse(BaseModel):
    provider: str
    models: list[str]
    warning: str | None = None
