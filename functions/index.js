/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// Contact form submission handler
exports.contactForm = onRequest(async (request, response) => {
  // Enable CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const {name, business, email, phone, package, message} = request.body;

    // Basic validation
    if (!name || !business || !email || !package) {
      response.status(400).json({error: "Missing required fields"});
      return;
    }

    // Save to Firestore (this will trigger the email function)
    const admin = require("firebase-admin");
    if (!admin.apps.length) {
      admin.initializeApp();
    }

    const db = admin.firestore();
    const submission = {
      name,
      business,
      email,
      phone: phone || "",
      package,
      message: message || "",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "new",
    };

    await db.collection("contactSubmissions").add(submission);

    logger.info("Contact form submitted", {submission});

    response.status(200).json({
      success: true,
      message: "Thank you! We'll get back to you within 24 hours.",
    });
  } catch (error) {
    logger.error("Error processing contact form:", error);
    response.status(500).json({error: "Internal server error"});
  }
});

// Send email notification when form is submitted
exports.sendEmailNotification = onDocumentCreated("contactSubmissions/{docId}", async (event) => {
  const submission = event.data.data();
  const docId = event.params.docId;

  logger.info("New contact submission received", {docId, submission});

  // Here you would integrate with an email service like SendGrid, Mailgun, or Nodemailer
  // For now, we'll just log the submission
  logger.info("Email notification would be sent for:", {
    to: "your-email@example.com",
    subject: `New Website Inquiry from ${
      submission.business
    }`,
    body: `
      New inquiry received:

      Name: ${submission.name}
      Business: ${submission.business}
      Email: ${submission.email}
      Phone: ${submission.phone || "Not provided"}
      Package: ${submission.package}
      Message: ${submission.message || "No message"}

      Timestamp: ${submission.timestamp}
    `,
  });

  return null;
});
