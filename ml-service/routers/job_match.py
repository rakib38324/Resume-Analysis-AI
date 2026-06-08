from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.job_match_service import JobMatchService

router = APIRouter()
job_match_service = JobMatchService()

class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str
    job_title: str = "the position"

@router.post("/job-match")
async def match_job(body: JobMatchRequest):
    if len(body.resume_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Resume text too short.")
    if len(body.job_description.strip()) < 50:
        raise HTTPException(status_code=422, detail="Job description too short.")

    result = job_match_service.match(
        body.resume_text,
        body.job_description,
        body.job_title,
    )
    return result
