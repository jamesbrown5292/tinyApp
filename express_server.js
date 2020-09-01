const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
//store urls to access
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
  //loop from 1-6
  //generate a random number between (48 - 90 excluding 58 - 64), get char code from this number
  let retString = "";
  while (retString.length < 6) {
    let raNum = Math.random() * (90 - 49) + 48;
    if (raNum >= 58 && raNum <= 64) {
      continue;
    } else {
      let addChar = String.fromCharCode(raNum);
      retString += addChar;
    }
  }
  return retString.toLowerCase();
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
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
//handle data being posted from the new page
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

//add a route for creating a new tiny url
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
//add a route handler for /urls__show
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]}; //question - where is it pulling params from? what does the request object look like?
  res.render("urls_show", templateVars);
});
