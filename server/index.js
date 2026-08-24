require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const db = require("./db");
const routes = require("./routes");

const app = express();

const PORT =
  process.env.PORT || 5000;

const uploadsDir =
  path.join(
    __dirname,
    "..",
    "uploads"
  );

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());

app.use(
  express.json()
);

app.use(
  express.static(
    path.join(
      __dirname,
      "..",
      "public"
    )
  )
);

app.use(
  "/api",
  routes
);

async function start() {

  await db.initDatabase();

  app.listen(
    PORT,
    () => {
      console.log(
        `Shortlist running at http://localhost:${PORT}`
      );
    }
  );
}

start().catch(error => {
  console.error(
    "Could not start application:",
    error
  );

  process.exit(1);
});