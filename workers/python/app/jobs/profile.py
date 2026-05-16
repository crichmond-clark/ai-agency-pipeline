from app.llm import LlmNotConfigured, generate_structured_object
from app.schemas import BusinessProfile, ProfileRequest


SYSTEM_PROMPT = """
You generate safe structured Business Profiles from lead data.
Return JSON only matching the requested schema.
Rules:
- Use only lead data as verified facts.
- Put plausible but unverified details in assumptions, not verified_facts.
- Do not invent ratings, testimonials, certifications, staff, photos, or awards.
- Keep confidence conservative when source data is thin.
""".strip()


def generate_business_profile(request: ProfileRequest) -> BusinessProfile:
    try:
        profile = generate_structured_object(
            schema=BusinessProfile,
            task_name="profile",
            system_prompt=SYSTEM_PROMPT,
            user_payload={"lead": request.lead.model_dump(), "json_schema": BusinessProfile.model_json_schema()},
            ai_config=request.ai_config,
        )
        profile.raw_profile = {**(profile.raw_profile or {}), "generator": "llm"}
        return profile
    except LlmNotConfigured:
        return deterministic_business_profile(request)


def deterministic_business_profile(request: ProfileRequest) -> BusinessProfile:
    lead = request.lead
    business_name = lead.business_name or "This business"
    city = lead.city or "the local area"

    verified_facts = [{"fact": f"Business name: {business_name}", "source": "lead data"}]
    if lead.city:
        verified_facts.append({"fact": f"City: {city}", "source": "lead data"})
    if lead.website_status:
        verified_facts.append({"fact": f"Website status: {lead.website_status}", "source": "lead data"})

    return BusinessProfile(
        industry="home_services",
        services=[{"name": "Local services"}],
        verified_facts=verified_facts,
        assumptions=[{"assumption": "Likely serves customers near its listed city."}],
        confidence=0.55,
        missing_information=[{"item": "Specific services offered"}, {"item": "Business differentiators"}],
        raw_profile={"generator": "deterministic-fallback"},
    )
