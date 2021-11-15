const https = require("https");

const send_token = function(token_data) {
  const data = new TextEncoder().encode(JSON.stringify(token_data));

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/users",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };

  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    res.on("data", (d) => {
      console.log(d);
      process.stdout.write(d);
    });
  });
  req.on("error", (error) => {
    console.error(error);
  });
  req.write(data);
  req.end();
};

const get_token = function(token_hash) {
  
    const options = {
    hostname: "localhost",
    port: 3000,
    path: `/users/${token_hash}`,
    method: "GET",
  };

  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });
  req.on("error", (error) => {
    console.error(error);
  });
  req.end();

};

module.exports = {
  send_token,
  get_token,
};
