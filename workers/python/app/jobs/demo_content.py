from app.schemas import DemoContent, DemoContentRequest


def generate_demo_content(request: DemoContentRequest) -> DemoContent:
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
