from app.schemas import BusinessProfile, ProfileRequest


def generate_business_profile(request: ProfileRequest) -> BusinessProfile:
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
