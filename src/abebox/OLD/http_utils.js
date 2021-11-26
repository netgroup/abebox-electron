const axios = require("axios");
//const abebox_webserver = "http://localhost:3000/users";
const abebox_webserver = "http://160.80.221.149:3000/users";

const send_token = function(token_data) {
  console.log("TOKEN DATA =", token_data);
  axios
    .post(abebox_webserver, token_data)
    .then((res) => {
      console.log(`statusCode: ${res.status}`);
      console.log(res.data);
      return res.data;
    })
    .catch((error) => {
      console.error(error);
    });
};

const get_token = function(token_hash) {
  console.log("TOKEN HASH =", token_hash);
  axios
    .get(`${abebox_webserver}/${token_hash.toString("hex")}`)
    .then((res) => {
      console.log(`statusCode: ${res.status}`);
      console.log(res.data);
      return res.data; // VERIFICARE SE NULL, RIMUOVERE HEX CON .toString("utf8") E VERIFICARE SIGN
    })
    .catch((error) => {
      console.error(error);
    });
};

module.exports = {
  send_token,
  get_token,
};
