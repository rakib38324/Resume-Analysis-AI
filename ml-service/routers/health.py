from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "resumeai-ml-service",
        "timestamp": datetime.utcnow().isoformat(),
    }
