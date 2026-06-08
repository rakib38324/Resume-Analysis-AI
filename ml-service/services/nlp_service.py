import re
import asyncio
from typing import Dict, List, Tuple
import spacy
from spacy.matcher import PhraseMatcher

# ---------------------------------------------------------------------------
# Skill dictionaries
# ---------------------------------------------------------------------------
TECHNICAL_SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "kotlin", "swift",
    "react", "vue", "angular", "nextjs", "nodejs", "express", "django", "flask", "fastapi",
    "spring boot", "laravel", "rails", "asp.net",
    "mongodb", "postgresql", "mysql", "sqlite", "redis", "elasticsearch",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible", "jenkins",
    "machine learning", "deep learning", "neural networks", "computer vision", "nlp",
    "tensorflow", "pytorch", "scikit-learn", "keras", "pandas", "numpy", "matplotlib",
    "sql", "nosql", "graphql", "rest api", "microservices", "ci/cd", "git",
    "html", "css", "tailwind", "bootstrap", "sass", "webpack",
    "linux", "bash", "powershell", "shell scripting",
]

SOFT_SKILLS = [
    "communication", "leadership", "teamwork", "problem solving", "critical thinking",
    "time management", "adaptability", "creativity", "collaboration", "presentation",
    "project management", "mentoring", "attention to detail", "analytical thinking",
]

TOOL_SKILLS = [
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "trello",
    "figma", "photoshop", "illustrator", "vs code", "intellij", "pycharm",
    "postman", "swagger", "slack", "notion", "excel", "tableau", "power bi",
]

# Resume section keywords
SECTION_KEYWORDS = {
    "contactInfo": ["email", "phone", "linkedin", "github", "address", "mobile"],
    "summary": ["summary", "objective", "profile", "about", "overview"],
    "experience": ["experience", "work history", "employment", "career", "professional background"],
    "education": ["education", "academic", "degree", "university", "college", "bachelor", "master", "phd"],
    "skills": ["skills", "technical skills", "competencies", "expertise", "proficiencies"],
    "projects": ["projects", "portfolio", "personal projects", "academic projects"],
    "certifications": ["certifications", "certificates", "credentials", "licenses", "awards"],
}

# ATS bad patterns
ATS_BAD_PATTERNS = [
    (r"<.*?>", "HTML tags detected"),
    (r"[^\x00-\x7F]+", "Non-ASCII characters"),
]

class NLPService:
    def __init__(self):
        self.nlp = None
        self.tech_matcher = None
        self.soft_matcher = None
        self.tool_matcher = None

    async def initialize(self):
        """Load spaCy model and build matchers."""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._load_models)

    def _load_models(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Fallback: blank English model
            self.nlp = spacy.blank("en")
            print("⚠️  Using blank spaCy model. Run: python -m spacy download en_core_web_sm")

        self.tech_matcher = self._build_matcher(TECHNICAL_SKILLS)
        self.soft_matcher = self._build_matcher(SOFT_SKILLS)
        self.tool_matcher = self._build_matcher(TOOL_SKILLS)

    def _build_matcher(self, skills: List[str]) -> PhraseMatcher:
        matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        patterns = [self.nlp.make_doc(s) for s in skills]
        matcher.add("SKILLS", patterns)
        return matcher

    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        """Extract technical, soft, and tool skills from resume text."""
        doc = self.nlp(text[:50000])  # cap for performance

        tech = set()
        soft = set()
        tools = set()

        for _, start, end in self.tech_matcher(doc):
            tech.add(doc[start:end].text.lower())
        for _, start, end in self.soft_matcher(doc):
            soft.add(doc[start:end].text.lower())
        for _, start, end in self.tool_matcher(doc):
            tools.add(doc[start:end].text.lower())

        return {
            "technical": sorted(list(tech)),
            "soft": sorted(list(soft)),
            "tools": sorted(list(tools)),
        }

    def detect_sections(self, text: str) -> Dict[str, Dict]:
        """Detect which resume sections are present."""
        text_lower = text.lower()
        result = {}

        for section, keywords in SECTION_KEYWORDS.items():
            present = any(kw in text_lower for kw in keywords)
            # Basic scoring: presence = 50, length bonus up to 50
            score = 0
            if present:
                score = 50
                # Find content length near section
                for kw in keywords:
                    idx = text_lower.find(kw)
                    if idx != -1:
                        nearby = text[idx: idx + 500]
                        score = min(100, 50 + len(nearby.split()) // 5)
                        break
            result[section] = {"present": present, "score": score}

        return result

    def check_ats_compatibility(self, text: str) -> Dict:
        """Check for common ATS compatibility issues."""
        issues = []
        text_lower = text.lower()

        for pattern, issue in ATS_BAD_PATTERNS:
            if re.search(pattern, text):
                issues.append(issue)

        # Check length
        word_count = len(text.split())
        if word_count < 200:
            issues.append("Resume appears too short (under 200 words)")
        if word_count > 1200:
            issues.append("Resume may be too long for ATS (over 1200 words)")

        # Keyword density (rough)
        skill_count = sum(1 for s in TECHNICAL_SKILLS if s in text_lower)
        keyword_density = min(100.0, (skill_count / max(len(TECHNICAL_SKILLS), 1)) * 100)

        # Check for common formatting issues
        has_tables = bool(re.search(r'\|\s+\|', text))
        has_images = "image" in text_lower or "photo" in text_lower

        return {
            "formatting_issues": issues,
            "keyword_density": round(keyword_density, 1),
            "word_count": word_count,
            "table_issues": has_tables,
            "image_issues": has_images,
            "font_issues": False,  # Can't detect from text alone
        }

    def compute_content_score(self, text: str, sections: Dict, skills: Dict) -> float:
        """Score the content quality of the resume."""
        score = 0.0

        # Section presence (40 pts)
        critical = ["experience", "education", "skills", "contactInfo"]
        for s in critical:
            if sections.get(s, {}).get("present"):
                score += 10

        # Skills richness (20 pts)
        total_skills = len(skills["technical"]) + len(skills["soft"]) + len(skills["tools"])
        score += min(20, total_skills * 1.5)

        # Quantified achievements (20 pts) — look for numbers/percentages
        numbers = re.findall(r'\b\d+[\%\+]?\b', text)
        score += min(20, len(numbers) * 2)

        # Action verbs (20 pts)
        action_verbs = ["developed", "led", "designed", "implemented", "managed", "built",
                        "improved", "increased", "reduced", "delivered", "created", "optimized"]
        av_count = sum(1 for v in action_verbs if v in text.lower())
        score += min(20, av_count * 3)

        return round(min(100, score), 1)

    def generate_recommendations(
        self, sections: Dict, skills: Dict, ats_details: Dict, content_score: float
    ) -> List[Dict]:
        """Generate actionable improvement recommendations."""
        recs = []

        missing_sections = [s for s, v in sections.items() if not v.get("present")]
        if "summary" in missing_sections:
            recs.append({"priority": "high", "category": "Content", "suggestion": "Add a professional summary (3-4 sentences) at the top of your resume."})
        if "contactInfo" in missing_sections:
            recs.append({"priority": "high", "category": "Contact", "suggestion": "Ensure your name, email, phone, and LinkedIn URL are clearly visible."})
        if "projects" in missing_sections:
            recs.append({"priority": "medium", "category": "Content", "suggestion": "Add a Projects section to showcase real-world work and personal initiatives."})

        if len(skills["technical"]) < 5:
            recs.append({"priority": "high", "category": "Skills", "suggestion": "Expand your technical skills section with specific technologies, frameworks, and tools."})

        if ats_details.get("keyword_density", 0) < 20:
            recs.append({"priority": "high", "category": "ATS", "suggestion": "Include more industry-relevant keywords to improve ATS ranking."})

        if ats_details.get("formatting_issues"):
            for issue in ats_details["formatting_issues"]:
                recs.append({"priority": "medium", "category": "Formatting", "suggestion": f"Fix: {issue}"})

        if content_score < 60:
            recs.append({"priority": "medium", "category": "Content", "suggestion": "Add quantified achievements (e.g., 'Improved performance by 30%') to make impact tangible."})

        return recs[:10]  # cap at 10

    def identify_strengths_weaknesses(
        self, sections: Dict, skills: Dict, content_score: float, ats_score: float
    ) -> Tuple[List[str], List[str]]:
        strengths = []
        weaknesses = []

        if len(skills["technical"]) >= 8:
            strengths.append("Strong technical skill set with diverse expertise.")
        if sections.get("experience", {}).get("present"):
            strengths.append("Work experience section is present and detailed.")
        if sections.get("education", {}).get("present"):
            strengths.append("Educational background is clearly presented.")
        if sections.get("projects", {}).get("present"):
            strengths.append("Projects section demonstrates hands-on experience.")
        if ats_score >= 70:
            strengths.append("Good ATS compatibility with strong keyword coverage.")

        if not sections.get("summary", {}).get("present"):
            weaknesses.append("Missing professional summary section.")
        if len(skills["soft"]) < 3:
            weaknesses.append("Limited soft skills mentioned.")
        if ats_score < 50:
            weaknesses.append("Low ATS score — resume may not pass automated screening.")
        if content_score < 50:
            weaknesses.append("Content could be strengthened with more quantified results.")

        return strengths[:5], weaknesses[:5]
