# Shortlist

A lightweight resume screening application that helps recruiters
organise a large set of resumes against a particular job description.

The system extracts useful candidate information from resumes and
uses an LLM to compare that information with the requirements of a role.

## What it does

1. Accepts PDF, DOCX and TXT resumes.
2. Extracts readable text from the resume.
3. Uses Gemini to structure:
   - skills
   - experience
   - education
   - total experience
4. Stores candidate information in SQLite.
5. Stores job descriptions.
6. Compares candidates against a selected job.
7. Produces a 1–10 fit score.
8. Shows why the candidate matched.
9. Shows matched and missing skills.
10. Stores screening results.

## Architecture

Browser
    |
    v
Express API
    |
    +---- Resume parser
    |
    +---- Gemini
    |
    +---- SQLite database
    |
    v
Screening results

## Technology

- Node.js
- Express
- Gemini API
- sql.js / SQLite
- PDF parsing
- DOCX parsing
- HTML/CSS/JavaScript

## LLM usage

The application uses two separate LLM tasks.

### Resume extraction

The first prompt converts unstructured resume text into a
consistent candidate profile.

The model is explicitly instructed not to invent information.

### Candidate matching

The second prompt compares the structured candidate profile
with the job description.

It produces:

- score
- summary
- matched skills
- missing skills
- strengths
- concerns

## Why use an LLM?

Traditional keyword matching can miss semantic relationships.

For example, a resume may describe an experience without using
exactly the same wording as the job description.

An LLM allows the application to consider the meaning of the
candidate's experience rather than only matching exact words.

## Limitations

This is a first-pass screening tool and should not make the final
hiring decision.

Possible issues include:

- incorrect information extraction
- ambiguous resumes
- inconsistent job descriptions
- LLM scoring variation
- bias in source resumes or job descriptions

The score should therefore be treated as a recommendation for
human review rather than a final hiring decision.

## Future improvements

- recruiter-adjustable scoring criteria
- duplicate resume detection
- candidate search and filtering
- bulk resume upload
- interview notes
- audit history
- authentication
- production database
- evaluation dataset for measuring screening accuracy