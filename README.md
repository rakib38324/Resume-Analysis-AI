# ResumeAI — Intelligent Resume Analysis SaaS Platform

A full-stack SaaS application built with the **MERN stack** (MongoDB, Express.js, React.js, Node.js) and a custom **Python FastAPI ML service**. All AI/NLP is self-developed — no third-party AI APIs.

---

## 📁 Project Structure

```
resumeai/
├── frontend/          # React + Vite + Tailwind CSS
├── backend/           # Node.js + Express.js REST API
└── ml-service/        # Python FastAPI ML & NLP engine
```

---

## 🛠 Tech Stack

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| Frontend     | React 18, Vite, Tailwind CSS, Recharts      |
| Backend      | Node.js, Express.js, MongoDB Atlas          |
| ML Service   | Python, FastAPI, spaCy, scikit-learn        |
| Auth         | JWT (jsonwebtoken + bcryptjs)               |
| File Storage | Cloudinary                                  |
| Payments     | Stripe                                      |
| Dev          | Nodemon, Uvicorn (hot reload)               |

---

## ⚙️ Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- **MongoDB Atlas** account (or local MongoDB)
- **Cloudinary** account (free tier works)
- **Stripe** account (test mode)

---

## 🚀 Setup & Installation

### 1. Clone and install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# → Fill in your .env values

# Frontend
cd ../frontend
npm install
cp .env.example .env
# → Set VITE_API_URL=http://localhost:5000/api

# ML Service
cd ../ml-service
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Configure environment variables

**backend/.env**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
ML_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Run all three services

Open **3 terminal windows**:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → Running on http://localhost:5000

# Terminal 2 — ML Service
cd ml-service
source venv/bin/activate
source venv/Scripts/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# → Running on http://localhost:8000

# Terminal 3 — Frontend
cd frontend
npm run dev
# → Running on http://localhost:5173
```

---

## 🔑 Key API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/upload` | Upload PDF/DOCX |
| GET  | `/api/resumes` | List user's resumes |
| DELETE | `/api/resumes/:id` | Delete resume |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/analyze` | Analyze a resume |
| GET  | `/api/analysis` | List analyses |
| GET  | `/api/analysis/:id` | Get analysis detail |
| GET  | `/api/analysis/stats` | Score trends |

### Job Matching (Premium)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/job-match` | Match resume vs JD |
| GET  | `/api/job-match` | List matches |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/subscriptions/status` | Current plan |
| POST | `/api/subscriptions/checkout` | Start Stripe checkout |
| POST | `/api/subscriptions/portal` | Billing portal |

### ML Service (internal)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze` | Full resume analysis |
| POST | `/job-match` | Resume vs JD matching |
| GET  | `/health` | Health check |

---

## 🤖 ML Components

### Skill Extraction
Uses spaCy `PhraseMatcher` with curated dictionaries of 60+ technical skills, soft skills, and tools. Extracts all matched skills from resume text.

### Role Classification
Rule-based scoring against 10 job role profiles (keyword overlap). Optionally loads a pre-trained `sklearn` model from `ml-service/models/classifier.joblib` if present.

### ATS Scoring
Checks keyword density, word count, special character issues, table/image problems, and missing critical sections.

### Job Matching
Combines skill overlap scoring with semantic similarity via **Sentence Transformers** (`all-MiniLM-L6-v2`) and keyword intersection for a weighted overall match score.

### Training a Custom Classifier (Optional)

```python
# ml-service/train_classifier.py
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

# Load your labeled resume dataset
# X = list of resume texts, y = list of job role labels
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1,2))),
    ('clf', LogisticRegression(max_iter=1000))
])
pipeline.fit(X, y)
joblib.dump(pipeline, 'models/classifier.joblib')
print("Classifier saved.")
```

---

## 💳 Stripe Setup

1. Create a product "ResumeAI Premium" in Stripe dashboard
2. Create a recurring price ($12/month)
3. Copy the `price_...` ID to `STRIPE_PREMIUM_PRICE_ID`
4. Set up webhook pointing to `https://yourdomain/api/webhooks/stripe`
5. Listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

For local webhook testing:
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

---

## 📦 Production Deployment

### Backend (e.g. Railway, Render, VPS)
```bash
cd backend
npm start
```
Set `NODE_ENV=production` and all env vars in your deployment platform.

### ML Service (e.g. Railway, Fly.io, VPS)
```bash
cd ml-service
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend (e.g. Vercel, Netlify)
```bash
cd frontend
npm run build
# Deploy the dist/ folder
```
Set `VITE_API_URL` to your production backend URL.

---

## 📋 Subscription Plans

| Feature | Free | Premium |
|---------|------|---------|
| Resume analyses/month | 3 | Unlimited |
| ATS scoring | ✅ | ✅ |
| Skill extraction | ✅ | ✅ |
| Role prediction | ✅ | ✅ |
| Job matching | ❌ | ✅ |
| Advanced recommendations | ❌ | ✅ |
| PDF reports | ❌ | ✅ |

---

## 🏗 Architecture Overview

```
Browser (React)
    ↕ HTTPS / REST
Node.js + Express (port 5000)
    ↕ JWT Auth
MongoDB Atlas (users, resumes, analyses, job matches)
    ↕ Cloudinary (file storage)
    ↕ Internal HTTP
Python FastAPI ML Service (port 8000)
    ↳ spaCy NLP
    ↳ scikit-learn classifier
    ↳ sentence-transformers (job matching)
    ↕ Stripe (webhooks)
```

---

## 📄 License

MIT — built for educational and portfolio purposes.
