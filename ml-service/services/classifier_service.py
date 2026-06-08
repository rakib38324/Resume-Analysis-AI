import asyncio
import os
import re
from typing import List, Tuple, Dict
import numpy as np

# Job role definitions with their key indicator terms
JOB_ROLE_INDICATORS = {
    "Software Engineer": [
        "software", "engineering", "algorithms", "data structures", "system design",
        "object oriented", "unit testing", "ci/cd", "backend", "api", "microservices",
    ],
    "Machine Learning Engineer": [
        "machine learning", "ml", "deep learning", "neural networks", "model training",
        "model deployment", "mlops", "tensorflow", "pytorch", "scikit-learn", "feature engineering",
    ],
    "Data Scientist": [
        "data science", "statistics", "hypothesis testing", "regression", "classification",
        "clustering", "pandas", "numpy", "matplotlib", "seaborn", "jupyter", "r programming",
        "data analysis", "insights", "predictive modeling",
    ],
    "Data Analyst": [
        "data analyst", "sql", "excel", "tableau", "power bi", "reporting", "dashboards",
        "business intelligence", "kpi", "data visualization", "pivot tables",
    ],
    "DevOps Engineer": [
        "devops", "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible",
        "ci/cd", "jenkins", "monitoring", "infrastructure", "linux", "bash",
    ],
    "Full Stack Developer": [
        "full stack", "frontend", "backend", "react", "vue", "angular", "nodejs",
        "html", "css", "javascript", "typescript", "rest api", "database",
    ],
    "Frontend Developer": [
        "frontend", "ui", "ux", "react", "vue", "angular", "html", "css",
        "javascript", "responsive design", "accessibility", "web performance",
    ],
    "Backend Developer": [
        "backend", "server", "api", "nodejs", "django", "flask", "spring", "laravel",
        "database", "postgresql", "mongodb", "redis", "authentication", "authorization",
    ],
    "Cybersecurity Analyst": [
        "cybersecurity", "security", "penetration testing", "ethical hacking", "soc",
        "incident response", "vulnerability", "firewall", "intrusion detection", "siem",
    ],
    "Cloud Architect": [
        "cloud", "aws", "azure", "gcp", "architecture", "scalability", "serverless",
        "lambda", "s3", "ec2", "cost optimization", "cloud native",
    ],
}

class ClassifierService:
    def __init__(self):
        self.initialized = False

    async def initialize(self):
        """Initialize the classifier (load pre-trained model if available)."""
        model_path = "models/classifier.joblib"
        if os.path.exists(model_path):
            import joblib
            loop = asyncio.get_event_loop()
            self.model = await loop.run_in_executor(None, joblib.load, model_path)
            print("✅ Loaded pre-trained classifier.")
        else:
            print("ℹ️  No pre-trained classifier found. Using rule-based classifier.")
            self.model = None
        self.initialized = True

    def predict_role(self, text: str) -> Tuple[str, float, List[Dict]]:
        """
        Predict the most suitable job role for the given resume text.
        Returns: (predicted_role, confidence, alternative_roles)
        """
        text_lower = text.lower()

        if self.model is not None:
            return self._ml_predict(text_lower)
        else:
            return self._rule_based_predict(text_lower)

    def _rule_based_predict(self, text_lower: str) -> Tuple[str, float, List[Dict]]:
        """Score each role by keyword overlap with resume text."""
        scores = {}
        for role, keywords in JOB_ROLE_INDICATORS.items():
            matches = sum(1 for kw in keywords if kw in text_lower)
            scores[role] = matches / len(keywords)

        if not scores or max(scores.values()) == 0:
            return "Software Engineer", 0.3, []

        sorted_roles = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_role, top_score = sorted_roles[0]

        # Normalize confidence to 0-1 range
        total = sum(s for _, s in sorted_roles[:3]) or 1
        confidence = round(top_score / total, 3)

        alternatives = [
            {"role": role, "confidence": round(score / total, 3)}
            for role, score in sorted_roles[1:4]
            if score > 0
        ]

        return top_role, confidence, alternatives

    def _ml_predict(self, text_lower: str) -> Tuple[str, float, List[Dict]]:
        """Use pre-trained ML model for prediction."""
        try:
            probas = self.model.predict_proba([text_lower])[0]
            classes = self.model.classes_
            idx = np.argmax(probas)
            top_role = classes[idx]
            confidence = float(probas[idx])

            sorted_idx = np.argsort(probas)[::-1]
            alternatives = [
                {"role": classes[i], "confidence": float(probas[i])}
                for i in sorted_idx[1:4]
                if float(probas[i]) > 0.05
            ]
            return top_role, confidence, alternatives
        except Exception as e:
            print(f"ML prediction failed, falling back: {e}")
            return self._rule_based_predict(text_lower)

    def identify_missing_skills(self, text_lower: str, predicted_role: str) -> List[str]:
        """Identify important skills for the predicted role that are missing from the resume."""
        role_keywords = JOB_ROLE_INDICATORS.get(predicted_role, [])
        missing = [kw for kw in role_keywords if kw not in text_lower]
        return missing[:8]  # top 8 missing skills
