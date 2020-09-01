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
  res.send(urlDatabase);
});
//send some additional html in the response to a different URI
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
//add a route handler for /urls
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase};
  res.render('urls_index', templateVars);
});

//add a route handler for /urls__show
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]}; //question - where is it pulling params from? what does the request object look like?
  res.render("urls_show", templateVars);
});