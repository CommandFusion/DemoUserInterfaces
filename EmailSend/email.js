// Setup the defaults for your email sending here.
// Set any variable to an empty string to have no default, but do not delete any variables.

var to = "support@commandfusion.com";
var toName = "";
var from = "noreply@commandfusion.com";
var fromName = "";
var subject = "Test email from CommandFusion iViewer";
var body = "This is a test!";
var plainText = true;
var cc = "";
var bcc = "";

/*
	This script uses the SendGrid API to send emails.
	You will need to setup an account with them here:
	https://signup.sendgrid.com/

	Their API reference:
	https://sendgrid.com/docs/api-reference/

	Once you have created your account, you need to create an API key.
	Copy your API key below.

	Sending emails with SendGrid is currently free, up to 100/day.

	Note that the body of the email must not be empty!
*/

// Note this API key in the demo is NOT active and will not work. Replace it with your own API key from SendGrid.
var API_KEY = "SFQwcbS6jzoJ6rzQ3DZ5ki6ufiTy8KiuENHFhIEn7aw2d81i4G6CY78YP4uTnuKWaKP1K";

// Leave this, unless the SendGrip API url changes in future.
var API_URL = "https://api.sendgrid.com/v3/mail/send";


// Call this function from your GUI - via a command, or from a button press, etc.
// Leave out a param if you want to use the defaults above.
// eg. sendMail(); // This would use all the defaults above.
// sendMail("custom message here", "custom subject here"); // This would use default addresses, but customise the email body and subject.
function sendMail(mail_body, mail_subject, mail_to, mail_from, mail_toName, mail_fromName, mail_plainText, mail_cc, mail_bcc) {
	// Use defaults set above if any of the params are missing or empty.
	body = mail_body || body;
	subject = mail_subject || subject;
	to = mail_to || to;
	from = mail_from || from;
	// Use empty string to not use toName or fromName at all (optional)
	toName = mail_toName == undefined ? toName : mail_toName;
	fromName = mail_fromName == undefined ? fromName : mail_fromName;
	plainText = mail_plainText == undefined ? plainText : mail_plainText;

	cc = mail_cc == undefined ? cc : mail_cc;
	bcc = mail_bcc == undefined ? bcc : mail_bcc;

	var headers = {
		"Authorization": "Bearer " + API_KEY,
		"Content-Type": "application/json"
	};

	var requestBody = {
		"personalizations": [{
			"to": [{"email": to, "name": toName}],
		}],
		"from": {"email": from, "name": fromName},
		"subject": subject,
		"content": [{
			"type": (plainText ? "text/plain" : "text/html"),
			"value": body
		}]
	};

	if (cc) {
		requestBody["personalizations"][0]["cc"] = [{"email": cc}];
	}

	if (bcc) {
		requestBody["personalizations"][0]["bcc"] = [{"email": bcc}];
	}

	CF.request(API_URL, "POST", headers, JSON.stringify(requestBody), function (status, headers, body) {
		// Use the iViewer debugger to read the response data below if your emails dont seem to be working
		CF.log("Mail Send Response: " + status);
		CF.logObject(headers);
		CF.logObject(body);
	});
}