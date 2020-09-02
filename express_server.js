const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
//store urls to access
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "eed4f9": "https://www.merriam-webster.com/"
};

let users = {};

const generateRandomString = () => {
  //loop from 1-6
  //generate a random number between (48 - 90 excluding 58 - 64), get char code from this number
  let retString = "";
  while (retString.length < 6) {
    let raNum = Math.ceil(Math.random() * (90 - 49) + 48);
    if (raNum >= 58 && raNum <= 64) {
      continue;
    } else {
      let addChar = String.fromCharCode(raNum);
      retString += addChar;
    }
  }
  return retString.toLowerCase();
};
let cookieParser = require('cookie-parser');
app.use(cookieParser());
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
  let email = users.email;
  let templateVars = { urls: urlDatabase, users: users, email: email};
  res.render('urls_index', templateVars);
});

//handle data being posted from the new page and redirect user to new page
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let randUrl = generateRandomString();
  urlDatabase[randUrl] = req.body.longURL; //persists the url data
  res.redirect(`/urls/${randUrl}`); //redirects to the new page
});

//redirect requests to /u/:shortUrl to the respective longUrl
app.get("/u/:shortURL", (req, res) => {
  res.redirect(`${urlDatabase[req.params.shortURL]}`);
});

//add a route to remove a url resource
app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//add a route for creating a new tiny url
app.get("/urls/new", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies.username};
  res.render("urls_new");
});

//add a route handler for /urls__show
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies.username};
  //console.log("Logging long URL", longURL);
  res.render("urls_show", templateVars);
});

//add a handler for updating a long URL
app.post("/urls/:shortURL", (req, res) => {
  let updatedLongURL = req.body.updatedLongURL;
  let shortURL = req.params.shortURL;
  urlDatabase[shortURL] = updatedLongURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let username = req.body.username;
  res.cookie("username", username);
  //console.log(req.cookies);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("register", users);
})

app.post("/register", (req, res) => {
  let id = generateRandomString()
  let email = req.body.email;
  let password = req.body.password;
  users = {id, email, password};
  res.cookie("user_id", id);
  res.redirect("/urls")
})