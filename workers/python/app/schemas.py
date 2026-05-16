from pydantic import BaseModel, Field
from typing import Any


class LeadInput(BaseModel):
    business_name: str | None = None
    city: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    website_url: str | None = None
    website_status: str | None = None
    source_payload: dict[str, Any] | None = None


class ProfileRequest(BaseModel):
    lead: LeadInput


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


class QaFinding(BaseModel):
    severity: str
    message: str


class AiQaReport(BaseModel):
    status: str
    findings: list[QaFinding] = Field(default_factory=list)
    summary: str


class OutreachDraftRequest(BaseModel):
    lead: LeadInput
    demo_url: str


class OutreachDraft(BaseModel):
    subject: str
    body: str
    safety_notes: str
