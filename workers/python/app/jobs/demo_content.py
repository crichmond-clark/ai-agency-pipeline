from app.llm import LlmNotConfigured, generate_structured_object
from app.schemas import DemoContent, DemoContentRequest


SYSTEM_PROMPT = """
You generate safe structured homepage content for local home-services businesses.
Return JSON only matching the requested schema.
Rules:
- Write for the business's local customers, not for a designer reviewing a website.
- Use verified facts and generic industry language only.
- Do not present assumptions as factual claims.
- Do not use the words demo, mockup, concept, template, generated, layout, website, homepage, page, lead data, or business profile outside footer_disclaimer.
- No testimonials, reviews, ratings, certification badges, team claims, before/after claims, emergency/24-7 claims, guarantees, warranties, free-estimate claims, or scraped image/logo references.
- The footer_disclaimer must clearly say the site is unofficial and for demonstration purposes.
""".strip()


def generate_demo_content(request: DemoContentRequest) -> DemoContent:
    try:
        return generate_structured_object(
            schema=DemoContent,
            task_name="demo_content",
            system_prompt=SYSTEM_PROMPT,
            user_payload={
                "lead": request.lead.model_dump(),
                "business_profile": request.profile.model_dump(),
                "json_schema": DemoContent.model_json_schema(),
            },
            ai_config=request.ai_config,
        )
    except LlmNotConfigured:
        return deterministic_demo_content(request)


def deterministic_demo_content(request: DemoContentRequest) -> DemoContent:
    lead = request.lead
    profile = request.profile
    business_name = lead.business_name or "Your Local Service Team"
    city = lead.city or "your area"
    first_service = profile.services[0].name if profile.services else "local services"

    return DemoContent(
        hero={
            "eyebrow": "Local home services",
            "headline": f"Reliable {first_service.lower()} help in {city}",
            "subheadline": f"Contact {business_name} to talk through {first_service.lower()} work, service details, and next steps in {city}.",
            "cta": "Request a quote",
        },
        services=[{"title": first_service, "description": f"Help with {first_service.lower()} enquiries for homes and local properties in {city}."}],
        why_choose_us=["Straightforward contact details", "Clear information about local services", "A simple way to discuss the job before booking"],
        service_area=f"Serving {city} and nearby communities.",
        contact_cta={"headline": "Need help with a local job?", "body": "Call or send an enquiry with the service needed, location, and any useful details.", "button_label": "Send enquiry"},
        footer_disclaimer="Unofficial demonstration page for review purposes only. This site is not endorsed by the business shown.",
    )
