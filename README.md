# Smart Resume Screener

An AI-assisted resume screening application that helps recruiters evaluate candidates against a specific job description.

## Features

- Upload PDF, DOCX, and TXT resumes
- Extract candidate skills, education, and experience
- Create and manage job descriptions
- Compare candidates against a selected job
- Generate a 1–10 fit score
- Show matched and missing skills
- Show candidate strengths and concerns
- Store candidate and screening information

## Live Demo

[Smart Resume Screener](https://smart-resume-screener-7k3r.onrender.com/)

## How It Works

```text
Resume
   ↓
Text Extraction
   ↓
Gemini AI Resume Parsing
   ↓
Candidate Profile
   ↓
Job Description
   ↓
Candidate Matching
   ↓
Fit Score & Screening Insights
```

## Scoring

| Category | Maximum Points |
|---|---:|
| Required Skills | 50 |
| Relevant Experience | 20 |
| Education | 10 |
| Practical / Project Experience | 20 |
| **Total** | **100** |

The total score is converted into a **1–10 fit score**.

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **AI:** Google Gemini API
- **Database:** SQLite / sql.js
- **Document Processing:** PDF, DOCX, TXT

## Project Structure

```text
Smart-resume-screener/
│
├── public/
│   └── index.html
│
├── server/
│   ├── db.js
│   ├── index.js
│   ├── matcher.js
│   ├── parseResume.js
│   └── routes.js
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/Jayadithya06/Smart-resume-screener.git
cd Smart-resume-screener
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the Gemini API

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Start the application

```bash
npm start
```

Open:

```text
http://localhost:5000
```

## LLM Usage

The Gemini API is used for two main tasks:

- **Resume Parsing:** Converts resume text into structured candidate information.
- **Candidate Matching:** Compares the candidate profile with the job description and identifies relevant matches and gaps.

The prompts instruct the model not to invent information that is not present in the resume.

## Limitations

- AI-generated results may not always be completely accurate.
- Poorly formatted resumes may affect information extraction.
- LLM-based scoring may have some variation.
- The system is intended for first-pass screening.
- Final hiring decisions should involve human review.

## Future Improvements

- Bulk resume upload
- Candidate filtering and ranking
- Duplicate resume detection
- Recruiter-adjustable scoring
- Authentication
- Screening history
- Production database
- Screening accuracy evaluation

## Author

**Jayadithya**