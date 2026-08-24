const {
  GoogleGenAI
} = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.6-flash";


function cleanJson(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}


async function askGemini(prompt) {

  const maxAttempts = 4;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {

    try {

      const response =
        await ai.models.generateContent({
          model: MODEL,
          contents: prompt
        });

      return cleanJson(response.text);

    } catch (error) {

      const status =
        error.status ||
        error.code;

      if (
        status !== 503 ||
        attempt === maxAttempts
      ) {
        throw error;
      }

      const waitTime =
        attempt * 2000;

      console.log(
        `Gemini temporarily unavailable. Retrying in ${waitTime / 1000}s...`
      );

      await new Promise(resolve =>
        setTimeout(resolve, waitTime)
      );
    }
  }
}


/*
==================================================
RESUME PARSING
==================================================
*/

async function parseResume(resumeText) {

  const prompt = `

You are helping organize resumes
for a recruiter.

Read the resume carefully.

Extract ONLY information that is
actually present.

NEVER invent information.

Return ONLY valid JSON.

Use exactly this format:

{
  "name": null,
  "skills": [],
  "experience": [
    {
      "company": "",
      "role": "",
      "duration": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "year": ""
    }
  ],
  "experience_years": 0
}

Rules:

- Only include skills explicitly
  supported by the resume.
- Do not assume skills.
- Do not invent work experience.
- Include internships when clearly mentioned.
- Include projects when clearly mentioned.
- If professional experience is absent,
  experience_years should be 0.

Resume:

"""
${resumeText.slice(0, 15000)}
"""

`;

  const raw =
    await askGemini(prompt);

  return JSON.parse(raw);
}


/*
==================================================
CANDIDATE MATCHING
==================================================
*/

async function matchCandidate(
  candidate,
  jobDescription
) {

  const prompt = `

You are assisting a recruiter with
first-pass candidate screening.

Compare the candidate with the job description.

Do NOT invent information.

Your task is to evaluate the candidate
and return evidence for four scoring areas.

==================================================
SCORING AREAS
==================================================

1. REQUIRED SKILLS
Maximum: 50 points

Identify the important technical skills
required by the job.

Divide the 50 points across the important
required skills.

Give points only for skills clearly
supported by the candidate.

For consistency:

- Identify the important required skills.
- Give approximately equal weight to each
  important required skill.
- If there are 4 equally important skills,
  each skill is worth approximately 12.5 points.
- Award points only when the candidate
  clearly demonstrates that skill.
- Do not award points for skills that are
  merely assumed.

2. RELEVANT EXPERIENCE
Maximum: 20 points

Consider professional experience and
internships relevant to the role.

If there is no relevant professional
experience or internship, give 0 points.

3. EDUCATION
Maximum: 10 points

Give points when the candidate's education
is relevant to the role.

4. PRACTICAL / PROJECT EXPERIENCE
Maximum: 20 points

Look for projects, internships,
applications, implementations or other
evidence that the candidate has actually
used relevant skills.

==================================================
IMPORTANT
==================================================

You MUST return numeric points for each
category.

The points must never exceed:

skill_points: 50
experience_points: 20
education_points: 10
project_points: 20

The backend will calculate the final score.

DO NOT calculate or invent a final score.

Use only information contained in the
candidate profile and job description.

Do not reward a candidate simply because
they are a student.

Do not assume that knowing a programming
language means they have professional
experience.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Use exactly this structure:

{
  "skill_points": 0,
  "experience_points": 0,
  "education_points": 0,
  "project_points": 0,
  "summary": "",
  "matched_skills": [],
  "missing_skills": [],
  "strengths": [],
  "concerns": []
}

Rules:

- All point values must be numbers.
- Never exceed the maximum for a category.
- Point values must be whole numbers or decimals.
- matched_skills must contain only skills
  supported by the candidate.
- missing_skills must contain important
  job requirements not supported by the
  candidate.
- strengths should contain useful evidence.
- concerns should contain important gaps.
- Do not invent experience.
- Do not assume missing information.
- Do not treat missing information as proof
  that the candidate does not have the skill.
- If something is not mentioned, describe it
  as "not demonstrated" rather than inventing
  a negative claim.

Candidate:

${JSON.stringify(
  candidate,
  null,
  2
)}

Job description:

"""
${jobDescription.slice(0, 8000)}
"""

`;

  const raw =
    await askGemini(prompt);

  const result =
    JSON.parse(raw);


  /*
  ================================================
  BACKEND VALIDATION
  ================================================
  */

  const skillPoints =
    Math.max(
      0,
      Math.min(
        50,
        Number(result.skill_points) || 0
      )
    );

  const experiencePoints =
    Math.max(
      0,
      Math.min(
        20,
        Number(result.experience_points) || 0
      )
    );

  const educationPoints =
    Math.max(
      0,
      Math.min(
        10,
        Number(result.education_points) || 0
      )
    );

  const projectPoints =
    Math.max(
      0,
      Math.min(
        20,
        Number(result.project_points) || 0
      )
    );


  /*
  ================================================
  FINAL SCORE CALCULATED BY OUR APPLICATION
  ================================================
  */

  const totalPoints =
    skillPoints +
    experiencePoints +
    educationPoints +
    projectPoints;


  let score;

  if (totalPoints >= 90) {
    score = 10;

  } else if (totalPoints >= 80) {
    score = 9;

  } else if (totalPoints >= 70) {
    score = 8;

  } else if (totalPoints >= 60) {
    score = 7;

  } else if (totalPoints >= 50) {
    score = 6;

  } else if (totalPoints >= 40) {
    score = 5;

  } else if (totalPoints >= 30) {
    score = 4;

  } else if (totalPoints >= 20) {
    score = 3;

  } else if (totalPoints >= 10) {
    score = 2;

  } else {
    score = 1;
  }


  /*
  ================================================
  RETURN RESULT
  ================================================
  */

  return {

    score,

    score_breakdown: {

      skill_points:
        skillPoints,

      experience_points:
        experiencePoints,

      education_points:
        educationPoints,

      project_points:
        projectPoints,

      total_points:
        totalPoints
    },

    summary:
      result.summary || "",

    matched_skills:
      Array.isArray(
        result.matched_skills
      )
        ? result.matched_skills
        : [],

    missing_skills:
      Array.isArray(
        result.missing_skills
      )
        ? result.missing_skills
        : [],

    strengths:
      Array.isArray(
        result.strengths
      )
        ? result.strengths
        : [],

    concerns:
      Array.isArray(
        result.concerns
      )
        ? result.concerns
        : []
  };
}


module.exports = {
  parseResume,
  matchCandidate
};