from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from routers import analysis, job_match, health
from services.nlp_service import NLPService
from services.classifier_service import ClassifierService

# Global service instances
nlp_service = NLPService()
classifier_service = ClassifierService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup."""
    print("🔄 Loading NLP models...")
    await nlp_service.initialize()
    await classifier_service.initialize()
    print("✅ ML Service ready.")
    yield
    print("🛑 Shutting down ML Service.")

app = FastAPI(
    title="ResumeAI ML Service",
    description="NLP and ML engine for resume analysis, classification, and job matching",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inject services into app state
app.state.nlp_service = nlp_service
app.state.classifier_service = classifier_service

# Routers
app.include_router(health.router)
app.include_router(analysis.router)
app.include_router(job_match.router)

# if __name__ == "__main__":
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
