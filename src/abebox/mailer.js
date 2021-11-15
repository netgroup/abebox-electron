const nodemailer = require("nodemailer");

const send_mail = function(sender, receiver, server_url) {
  const transporter = nodemailer.createTransport({
    service: sender.service, //e.g. "gmail"
    auth: {
      user: sender.mail,
      pass: sender.password,
    },
  });
  const invite_string =
    "" +
    sender.mail +
    "invited you to download ABEBox! You can download it from the following link " +
    server_url +
    "/" +
    receiver.token;
  const mailOptions = {
    from: sender.mail,
    to: receiver.mail,
    subject: "ABEBox invitation",
    html: "<h1>Welcome</h1><p>" + invite_string + "</p>",
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = {
  send_mail,
};
