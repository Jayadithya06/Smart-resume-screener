const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

async function getRawText(filePath, mimeType) {
  const buffer = fs.readFileSync(filePath);

  if (mimeType === "application/pdf") {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      buffer
    });

    return result.value;
  }

  return buffer.toString("utf8");
}

function getContactDetails(text) {
  const emailMatch = text.match(
    /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/
  );

  const phoneMatch = text.match(
    /(?:\+91[\s-]?)?(?:\d[\s-]?){10,12}/
  );

  return {
    email: emailMatch
      ? emailMatch[0]
      : null,

    phone: phoneMatch
      ? phoneMatch[0].trim()
      : null
  };
}

module.exports = {
  getRawText,
  getContactDetails
};