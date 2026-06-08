from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from services.nlp_service import NLPService
from services.classifier_service import ClassifierService

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str
    resume_id: str = ""

@router.post("/analyze")
async def analyze_resume(body: AnalyzeRequest, request: Request):
    if len(body.text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Resume text too short for analysis.")

    nlp: NLPService = request.app.state.nlp_service
    clf: ClassifierService = request.app.state.classifier_service

    text = body.text

    # Run all analyses
    skills = nlp.extract_skills(text)
    sections = nlp.detect_sections(text)
    ats_details = nlp.check_ats_compatibility(text)
    content_score = nlp.compute_content_score(text, sections, skills)
    recommendations = nlp.generate_recommendations(sections, skills, ats_details, content_score)
    strengths, weaknesses = nlp.identify_strengths_weaknesses(sections, skills, content_score, 0)

    predicted_role, confidence, alt_roles = clf.predict_role(text)
    missing_skills = clf.identify_missing_skills(text.lower(), predicted_role)

    # ATS score
    issue_penalty = len(ats_details["formatting_issues"]) * 10
    ats_score = max(0, min(100, 60 + ats_details["keyword_density"] * 0.4 - issue_penalty))

    # Formatting score
    formatting_score = max(0, 100 - issue_penalty)

    # Overall weighted score
    overall_score = round(
        content_score * 0.40
        + ats_score * 0.35
        + formatting_score * 0.25,
        1
    )

    return {
        "overall_score": overall_score,
        "ats_score": round(ats_score, 1),
        "content_score": content_score,
        "formatting_score": round(formatting_score, 1),
        "predicted_role": predicted_role,
        "role_confidence": round(confidence * 100, 1),
        "alternative_roles": alt_roles,
        "skills": skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "sections": sections,
        "ats_details": {
            "keyword_density": ats_details["keyword_density"],
            "formatting_issues": ats_details["formatting_issues"],
            "font_issues": ats_details["font_issues"],
            "table_issues": ats_details["table_issues"],
            "image_issues": ats_details["image_issues"],
        },
    }
