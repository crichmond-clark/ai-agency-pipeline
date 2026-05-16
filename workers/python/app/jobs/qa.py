from app.llm import LlmNotConfigured, generate_structured_object
from app.schemas import AiQaReport, QaRequest


SYSTEM_PROMPT = """
You review demo site content for factual, ethical, and outreach-safety risks.
Return JSON only matching the requested schema.
Mark status failed when content lacks an unofficial demonstration disclaimer or includes fake claims.
Use findings severity values: info, warning, error.
""".strip()


def review_demo_page(request: QaRequest) -> AiQaReport:
    try:
        return generate_structured_object(
            schema=AiQaReport,
            task_name="qa",
            system_prompt=SYSTEM_PROMPT,
            user_payload={"demo_url": request.demo_url, "content": request.content.model_dump(), "json_schema": AiQaReport.model_json_schema()},
        )
    except LlmNotConfigured:
        return deterministic_qa(request)


def deterministic_qa(request: QaRequest) -> AiQaReport:
    findings = []
    disclaimer = request.content.footer_disclaimer.lower()

    if "unofficial" not in disclaimer or "demonstration" not in disclaimer:
        findings.append({"severity": "error", "message": "Footer disclaimer must clearly say the demo is unofficial and for demonstration."})

    content_text = request.content.model_dump_json().lower()
    if "testimonial" in content_text or "review" in content_text:
        findings.append({"severity": "warning", "message": "Avoid testimonials, reviews, or reputation claims unless verified."})

    status = "failed" if any(finding["severity"] == "error" for finding in findings) else "passed"
    return AiQaReport(status=status, findings=findings, summary="AI QA fallback completed with safety-focused checks.")
