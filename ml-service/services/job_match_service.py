import re
from typing import List, Dict, Set
from sentence_transformers import SentenceTransformer, util
import numpy as np

# Common skills for matching
ALL_SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "go", "rust",
    "react", "vue", "angular", "nodejs", "django", "flask", "fastapi",
    "mongodb", "postgresql", "mysql", "redis", "aws", "azure", "gcp",
    "docker", "kubernetes", "tensorflow", "pytorch", "scikit-learn",
    "sql", "rest api", "graphql", "git", "linux", "ci/cd", "agile",
    "machine learning", "deep learning", "data analysis", "project management",
    "communication", "leadership", "teamwork", "problem solving",
]

class JobMatchService:
    _model = None  # Singleton model

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        if cls._model is None:
            print("🔄 Loading sentence-transformers model...")
            cls._model = SentenceTransformer("all-MiniLM-L6-v2")
            print("✅ Sentence-transformers model loaded.")
        return cls._model

    def extract_keywords(self, text: str) -> Set[str]:
        """Extract skill keywords from text."""
        text_lower = text.lower()
        return {skill for skill in ALL_SKILLS if skill in text_lower}

    def compute_semantic_similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts using sentence embeddings."""
        try:
            model = self.get_model()
            embeddings = model.encode([text1[:2000], text2[:2000]], convert_to_tensor=True)
            similarity = util.cos_sim(embeddings[0], embeddings[1]).item()
            return max(0.0, min(1.0, float(similarity)))
        except Exception as e:
            print(f"Semantic similarity error: {e}")
            return 0.5

    def match(self, resume_text: str, job_description: str, job_title: str) -> Dict:
        """Full job matching analysis."""
        resume_skills = self.extract_keywords(resume_text)
        jd_skills = self.extract_keywords(job_description)

        matched_skills = list(resume_skills & jd_skills)
        missing_skills = list(jd_skills - resume_skills)

        # Skills match score
        skills_match = (
            round((len(matched_skills) / max(len(jd_skills), 1)) * 100, 1)
            if jd_skills else 50.0
        )

        # Semantic similarity (overall content match)
        semantic_score = self.compute_semantic_similarity(resume_text, job_description)
        semantic_pct = round(semantic_score * 100, 1)

        # Education match (simple heuristic)
        edu_keywords = ["bachelor", "master", "phd", "degree", "graduate"]
        edu_match = 100.0 if any(kw in resume_text.lower() for kw in edu_keywords) else 60.0

        # Experience match (look for years of experience)
        exp_required = re.search(r'(\d+)\+?\s*years?\s+(?:of\s+)?experience', job_description.lower())
        exp_present = re.search(r'(\d+)\+?\s*years?\s+(?:of\s+)?experience', resume_text.lower())
        if exp_required and exp_present:
            req_yrs = int(exp_required.group(1))
            has_yrs = int(exp_present.group(1))
            exp_match = min(100.0, (has_yrs / req_yrs) * 100) if req_yrs else 80.0
        else:
            exp_match = 75.0

        # Keyword match
        resume_words = set(resume_text.lower().split())
        jd_words = set(job_description.lower().split())
        common_words = resume_words & jd_words
        keywords_match = round((len(common_words) / max(len(jd_words), 1)) * 100, 1)

        # Weighted overall
        overall = round(
            skills_match * 0.35
            + semantic_pct * 0.30
            + exp_match * 0.20
            + edu_match * 0.10
            + keywords_match * 0.05,
            1
        )

        recommendations = self._generate_recommendations(
            matched_skills, missing_skills, overall, skills_match
        )

        summary = (
            f"Your resume is a {overall:.0f}% match for the {job_title} position. "
            f"You match {len(matched_skills)} of {len(jd_skills)} required skills. "
        )
        if overall >= 75:
            summary += "Your profile is a strong fit — consider applying."
        elif overall >= 50:
            summary += "You're a moderate fit. Address the missing skills to strengthen your application."
        else:
            summary += "Consider building the missing skills before applying."

        return {
            "overall_match": overall,
            "skills_match": skills_match,
            "experience_match": round(exp_match, 1),
            "education_match": round(edu_match, 1),
            "keywords_match": keywords_match,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills[:10],
            "matched_keywords": list(common_words)[:15],
            "missing_keywords": list(jd_words - resume_words)[:15],
            "recommendations": recommendations,
            "summary": summary,
        }

    def _generate_recommendations(
        self, matched: List, missing: List, overall: float, skills_match: float
    ) -> List[str]:
        recs = []
        if missing:
            recs.append(f"Develop these key skills for this role: {', '.join(missing[:5])}.")
        if skills_match < 50:
            recs.append("Tailor your resume by adding keywords from the job description.")
        if overall < 60:
            recs.append("Consider gaining more relevant experience through personal projects or certifications.")
        recs.append("Customize your professional summary to align with this specific role.")
        recs.append("Use the exact job title terminology the employer uses in your resume.")
        return recs
