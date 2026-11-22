/**
 * MancioTech AI services contact form — Google Apps Script backend.
 * Deploy as a Web App: Execute as "Me"; Who has access: "Anyone".
 * The visitor's browser POSTs a native HTML form to the /exec URL.
 * The HTML response sends an acknowledgement back to manciotech.net.
 *
 * IMPORTANT: The web-app URL is public. Validate, rate limit and monitor for spam.
 * Do not place OAuth tokens, passwords or customer documents here.
 */
var RECIPIENT_EMAIL = "andrea@manciotech.net";
var ALLOWED_SITE = "https://manciotech.net";
var SOURCE_NAME = "manciotech.net";
var MIN_MESSAGE_LENGTH = 20;
var MAX_MESSAGE_LENGTH = 4000;

function doPost(e) {
  var fields = (e && e.parameter) || {};
  var requestId = String(fields.requestId || "").slice(0, 100);
  // Avoid reflecting untrusted HTML or arbitrary messages into the response.
  if (!/^[a-z0-9-]{8,90}$/.test(requestId)) {
    requestId = "";
  }
  try {
    var name = String(fields.name || "").trim();
    var email = String(fields.email || "").trim();
    var company = String(fields.company || "").trim();
    var topic = String(fields.topic || "").trim();
    var message = String(fields.message || "").trim();

    if (String(fields.website || "").trim()) {
      return respond_(requestId, false, "Invalid request");
    }
    if (String(fields.source || "") !== SOURCE_NAME || fields.consent !== "yes" ||
        name.length < 1 || name.length > 120 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 240 ||
        company.length > 150 || topic.length > 120 ||
        message.length < MIN_MESSAGE_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
      return respond_(requestId, false, "Please check the form fields and consent.");
    }

    // Basic rate limiting by email (not an anti-abuse guarantee for public endpoints).
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email.toLowerCase());
    var cacheKey = "contact-" + Utilities.base64EncodeWebSafe(digest).slice(0, 48);
    var cache = CacheService.getScriptCache();
    if (cache.get(cacheKey)) {
      return respond_(requestId, false, "Please wait a minute before sending another message.");
    }
    if (MailApp.getRemainingDailyQuota() < 1) {
      return respond_(requestId, false, "The contact form is temporarily unavailable. Please try later.");
    }
    cache.put(cacheKey, "1", 60);

    var subject = "MancioTech · richiesta servizi AI";
    var plainText = [
      "New request from manciotech.net",
      "",
      "Name: " + name,
      "Email: " + email,
      "Company: " + (company || "—"),
      "Service: " + topic,
      "",
      "Problem:",
      message,
      "",
      "Privacy: Visitor explicitly consented to forwarding this request."
    ].join("\n");

    MailApp.sendEmail({
      to: RECIPIENT_EMAIL,
      subject: subject,
      body: plainText,
      replyTo: email,
      name: "MancioTech contact form"
    });
    return respond_(requestId, true, "");
  } catch (err) {
    console.error("Failed to process contact submission: " + String(err));
    return respond_(requestId, false, "Unable to send your request right now. Please try again later.");
  }
}

/**
 * Native HTML form POSTs don't require CORS. Response is an HTML page inside
 * the hidden iframe; it notifies the existing React page using postMessage.
 */
function respond_(requestId, success, message) {
  var response = {
    source: "manciotech-apps-script",
    requestId: requestId,
    success: success,
    message: message
  };
  var payload = JSON.stringify(response).replace(/</g, "\\u003c");
  var html = "<!doctype html><html><head><meta charset='utf-8'></head><body>" +
    "<script>window.top.postMessage(" + payload + ", " + JSON.stringify(ALLOWED_SITE) + ");</script>" +
    "</body></html>";
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
