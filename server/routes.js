const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

const db = require("./db");

const {
  getRawText,
  getContactDetails
} = require("./parseResume");

const {
  parseResume,
  matchCandidate
} = require("./matcher");

const router = express.Router();

const upload = multer({
  dest: path.join(
    __dirname,
    "..",
    "uploads"
  )
});

function newId() {
  return crypto.randomUUID();
}

router.post("/jobs", (req, res) => {
  const {
    title,
    description
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      error:
        "Job title and description are required."
    });
  }

  const id = newId();

  db.run(
    `
    INSERT INTO jobs
    (id, title, description)
    VALUES (?, ?, ?)
    `,
    [
      id,
      title.trim(),
      description.trim()
    ]
  );

  res.json({
    id,
    title: title.trim()
  });
});

router.get("/jobs", (req, res) => {
  const jobs = db.all(`
    SELECT
      id,
      title,
      created_at
    FROM jobs
    ORDER BY created_at DESC
  `);

  res.json(jobs);
});

router.post(
  "/candidates",
  upload.single("resume"),
  async (req, res) => {

    if (!req.file) {
      return res.status(400).json({
        error:
          "Please upload a resume."
      });
    }

    try {

      const rawText =
        await getRawText(
          req.file.path,
          req.file.mimetype
        );

      if (!rawText.trim()) {
        return res.status(400).json({
          error:
            "No readable text was found."
        });
      }

      const contact =
  getContactDetails(rawText);

// Prevent duplicate resumes
const existing = db.get(
  `
  SELECT *
  FROM candidates
  WHERE email = ?
     OR filename = ?
  LIMIT 1
  `,
  [
    contact.email,
    req.file.originalname
  ]
);

if (existing) {
  return res.json({
    id: existing.id,
    name: existing.name || existing.filename,
    email: existing.email,
    phone: existing.phone,
    skills: JSON.parse(existing.skills || "[]"),
    experience: JSON.parse(existing.experience || "[]"),
    education: JSON.parse(existing.education || "[]"),
    experience_years: existing.experience_years || 0,
    message: "Candidate already exists."
  });
}

const structured =
  await parseResume(rawText);

      const id = newId();

      db.run(
        `
        INSERT INTO candidates (
          id,
          filename,
          name,
          email,
          phone,
          skills,
          experience,
          education,
          experience_years,
          raw_text
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          req.file.originalname,
          structured.name || null,
          contact.email,
          contact.phone,
          JSON.stringify(
            structured.skills || []
          ),
          JSON.stringify(
            structured.experience || []
          ),
          JSON.stringify(
            structured.education || []
          ),
          Number(
            structured.experience_years || 0
          ),
          rawText
        ]
      );

      res.json({
        id,
        name:
          structured.name ||
          req.file.originalname,
        email: contact.email,
        phone: contact.phone,
        skills:
          structured.skills || [],
        experience:
          structured.experience || [],
        education:
          structured.education || [],
        experience_years:
          structured.experience_years || 0
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Could not process the resume.",
        details: error.message
      });
    }
  }
);

router.get("/candidates", (req, res) => {

  const rows = db.all(`
    SELECT *
    FROM candidates
    ORDER BY created_at DESC
  `);

  const candidates =
    rows.map(row => ({
      ...row,

      skills:
        JSON.parse(
          row.skills || "[]"
        ),

      experience:
        JSON.parse(
          row.experience || "[]"
        ),

      education:
        JSON.parse(
          row.education || "[]"
        )
    }));

  res.json(candidates);
});

router.post(
  "/match/:jobId",
  async (req, res) => {

    const job =
      db.get(
        `
        SELECT *
        FROM jobs
        WHERE id = ?
        `,
        [req.params.jobId]
      );

    if (!job) {
      return res.status(404).json({
        error: "Job not found."
      });
    }

    const candidates =
      db.all(`
        SELECT *
        FROM candidates
      `);

    if (!candidates.length) {
      return res.json({
        job: job.title,
        shortlist: []
      });
    }

    const shortlist = [];

    for (const candidate of candidates) {

      const profile = {
        name: candidate.name,

        skills:
          JSON.parse(
            candidate.skills || "[]"
          ),

        experience:
          JSON.parse(
            candidate.experience || "[]"
          ),

        education:
          JSON.parse(
            candidate.education || "[]"
          ),

        experience_years:
          candidate.experience_years
      };

      try {

        const result =
          await matchCandidate(
            profile,
            job.description
          );

        db.run(
          `
          INSERT INTO matches (
            id,
            candidate_id,
            job_id,
            score,
            summary,
            matched_skills,
            missing_skills,
            strengths,
            concerns
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            newId(),
            candidate.id,
            job.id,
            result.score,
            result.summary,
            JSON.stringify(
              result.matched_skills || []
            ),
            JSON.stringify(
              result.missing_skills || []
            ),
            JSON.stringify(
              result.strengths || []
            ),
            JSON.stringify(
              result.concerns || []
            )
          ]
        );

        shortlist.push({
          candidateId:
            candidate.id,

          candidateName:
            candidate.name ||
            candidate.filename,

          email:
            candidate.email,

          score:
            result.score,

          summary:
            result.summary,

          matched_skills:
            result.matched_skills || [],

          missing_skills:
            result.missing_skills || [],

          strengths:
            result.strengths || [],

          concerns:
            result.concerns || []
        });

      } catch (error) {

        console.error(
          `Match failed for ${candidate.id}:`,
          error.message
        );
      }
    }

    shortlist.sort(
      (a, b) =>
        b.score - a.score
    );

    res.json({
      job: job.title,
      shortlist
    });
  }
);

module.exports = router;