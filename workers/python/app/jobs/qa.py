from app.schemas import AiQaReport, QaRequest


def review_demo_page(request: QaRequest) -> AiQaReport:
    findings = []
    disclaimer = request.content.footer_disclaimer.lower()

    if "unofficial" not in disclaimer or "demonstration" not in disclaimer:
        findings.append({"severity": "error", "message": "Footer disclaimer must clearly say the demo is unofficial and for demonstration."})

    content_text = request.content.model_dump_json().lower()
    if "testimonial" in content_text or "review" in content_text:
        findings.append({"severity": "warning", "message": "Avoid testimonials, reviews, or reputation claims unless verified."})

    status = "failed" if any(finding["severity"] == "error" for finding in findings) else "passed"
    return AiQaReport(status=status, findings=findings, summary="AI QA fallback completed with safety-focused checks.")
