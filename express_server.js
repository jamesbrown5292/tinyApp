const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
//store urls to access
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//set the express view engine to ejs otherwise its default will be jade
app.set('view engine', 'ejs');

//handle get requests
app.get("/", (req, res) => {
  res.send("Hello!");
});
//listen on the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
//additional endpooint
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//send some additional html in the response to a different URI
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});