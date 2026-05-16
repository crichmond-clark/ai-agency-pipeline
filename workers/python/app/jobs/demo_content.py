from app.llm import LlmNotConfigured, generate_structured_object
from app.schemas import DemoContent, DemoContentRequest


SYSTEM_PROMPT = """
You generate safe structured demo homepage content for unofficial local-business concept mockups.
Return JSON only matching the requested schema.
Rules:
- Use verified facts and generic industry language only.
- Do not present assumptions as factual claims.
- No testimonials, reviews, ratings, certification badges, team claims, before/after claims, or scraped image/logo references.
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
            "eyebrow": "Concept homepage mockup",
            "headline": f"A clearer online home for {business_name}",
            "subheadline": f"A simple, modern homepage concept for a {first_service.lower()} provider serving {city}.",
            "cta": "Request a quote",
        },
        services=[{"title": first_service, "description": "Clear service information written from verified lead data and generic industry language."}],
        why_choose_us=["Easy-to-scan service information", "Clear contact prompts", "Local service-area messaging"],
        service_area=f"Serving {city} and nearby communities.",
        contact_cta={"headline": "Ready to discuss your project?", "body": "Use this section to invite visitors to call or send an enquiry.", "button_label": "Get in touch"},
        footer_disclaimer="Unofficial concept mockup for demonstration purposes only. This site is not endorsed by the business shown.",
    )
