from app.schemas import OutreachDraft, OutreachDraftRequest


def generate_outreach_draft(request: OutreachDraftRequest) -> OutreachDraft:
    lead = request.lead
    business_name = lead.business_name or "your business"
    city_line = f" in {lead.city}" if lead.city else ""

    return OutreachDraft(
        subject=f"Quick website mockup for {business_name}",
        body=(
            f"Hi,\n\nI noticed {business_name}{city_line} and put together a short unofficial homepage concept here:\n"
            f"{request.demo_url}\n\n"
            "It is only a private demonstration mockup, not a published site or anything claiming to represent you. "
            "If useful, I can adapt it into a proper website with your real services, wording, and photos.\n\n"
            "Would you be open to me sending over a few ideas?\n"
        ),
        safety_notes="Draft avoids fake claims, states the demo is unofficial, and asks for permission before further discussion.",
    )
