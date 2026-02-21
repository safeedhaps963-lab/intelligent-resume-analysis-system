# 🧠 Intelligent Resume Analysis & Recommendation System

A full-stack application for AI-powered resume analysis, ATS score prediction, and smart job recommendations.

## 🚀 Quick Start in VS Code

### Step 1: Open Project
```bash
# Open VS Code in the project root
code .
```

### Step 2: Install VS Code Extensions (Recommended)
- **Python** - Microsoft
- **Pylance** - Microsoft  
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **MongoDB for VS Code**
- **Thunder Client** (for API testing)

### Step 3: Start Backend (Terminal 1)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_lg
python run.py
```
Backend runs on: http://localhost:5000

### Step 4: Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm start
```
Frontend runs on: http://localhost:3000

### Step 5: View Demo
Open `index.html` in your browser to see the interactive demo.

---

## 📁 Project Structure

```
intelligent-resume-system/
│
├── backend/                          # Flask Backend
│   ├── app/
│   │   ├── __init__.py              # Flask app factory
│   │   ├── config.py                # Configuration settings
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py              # User model
│   │   │   ├── resume.py            # Resume model
│   │   │   └── job.py               # Job model
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Authentication routes
│   │   │   ├── resume.py            # Resume analysis routes
│   │   │   ├── builder.py           # Resume builder routes
│   │   │   └── jobs.py              # Job recommendation routes
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── nlp_analyzer.py      # NLP skill extraction
│   │   │   ├── ats_scorer.py        # ATS scoring algorithm
│   │   │   ├── job_matcher.py       # Job matching algorithm
│   │   │   └── resume_generator.py  # Resume PDF generation
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── pdf_parser.py        # PDF parsing utility
│   │       └── helpers.py           # Helper functions
│   ├── requirements.txt             # Python dependencies
│   ├── run.py                       # Application entry point
│   └── .env                         # Environment variables
│
├── frontend/                         # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── ResumeAnalyzer/
│   │   │   │   ├── ResumeUploader.jsx
│   │   │   │   ├── SkillsAnalysis.jsx
│   │   │   │   └── ATSScore.jsx
│   │   │   ├── ResumeBuilder/
│   │   │   │   ├── ResumeBuilder.jsx
│   │   │   │   ├── PersonalInfo.jsx
│   │   │   │   ├── Experience.jsx
│   │   │   │   ├── Education.jsx
│   │   │   │   ├── Skills.jsx
│   │   │   │   └── ResumePreview.jsx
│   │   │   ├── JobRecommendations/
│   │   │   │   ├── JobList.jsx
│   │   │   │   ├── JobCard.jsx
│   │   │   │   └── JobFilters.jsx
│   │   │   └── Common/
│   │   │       ├── Navbar.jsx
│   │   │       ├── Notifications.jsx
│   │   │       └── Loading.jsx
│   │   ├── services/
│   │   │   ├── api.js               # Axios API configuration
│   │   │   └── socket.js            # Socket.IO client
│   │   ├── context/
│   │   │   └── AppContext.jsx       # React Context
│   │   ├── hooks/
│   │   │   └── useNotifications.js  # Custom hooks
│   │   ├── App.jsx                  # Main App component
│   │   ├── index.js                 # Entry point
│   │   └── index.css                # Global styles
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md                         # This file
```

## 🚀 Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB (local or Atlas)
- VS Code

### Backend Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_lg
```

3. **Configure environment:**
```bash
# Create .env file
MONGODB_URI=mongodb://localhost:27017/resume_analyzer
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

4. **Run the server:**
```bash
python run.py
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm start
```

## 🔧 VS Code Extensions Recommended

- Python
- Pylance
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- MongoDB for VS Code
- Thunder Client (API testing)

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/resume/analyze` | Analyze resume |
| GET | `/api/resume/skills/:id` | Get extracted skills |
| POST | `/api/resume/ats-score` | Calculate ATS score |
| POST | `/api/builder/generate` | Generate resume PDF |
| GET | `/api/jobs/recommendations` | Get job matches |
| POST | `/api/jobs/apply/:id` | Apply to job |

## 🎯 Features

- ✅ AI-powered skill extraction using NLP
- ✅ ATS score prediction with detailed breakdown
- ✅ Smart resume builder with live preview
- ✅ Personalized job recommendations
- ✅ Real-time job notifications via WebSocket
- ✅ PDF/DOCX resume export

## 📄 License

MIT License