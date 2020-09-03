
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const express = require("express");
const bcrypt = require('bcrypt');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({name: 'Session', keys: ['user_id', 'fav']}))
const PORT = 8080; // default port 8080
//store urls to access

const urlDatabase = {};
const users = {};

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
//set the express view engine to ejs otherwise its default will be jade

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
  const userIDCookie = req.session.user_id;
  const filteredUsers = {};
  if (!userIDCookie) {
    res.redirect("/login");
  } else {
    for (let url in urlDatabase) {
      let userID = urlDatabase[url]['userID'];
      if (userID === userIDCookie ) {
        //can't delete the database or websites not saved between sessions 
        filteredUsers[url] = url
      }
    }
    //urls needs to be filtered here to only include ones wtith user_id
    const templateVars = { urls: filteredUsers, user: users[userIDCookie], unfilteredURL: urlDatabase };
    res.render('urls_index', templateVars);
  }
});

//handle new short URL being posted from the new page and redirect user to new page
app.post("/urls", (req, res) => {
  const randURL = generateRandomString();
  const shortURL = randURL
  const longURL = req.body.longURL;
  const userID = req.session.user_id
  urlDatabase[shortURL] = {longURL, userID }; //persists the url data
  res.redirect(`/urls/${shortURL}`); //redirects to the new page
});

//handle favourite button being pressed
//save fav cookie at url entry 
app.post("/:shortURL/fav", (req, res) => {
  const userIDCookie = req.session.user_id;
  if (!userIDCookie) {
    res.redirect("/login");
  } else {
    const shortURL = req.params.shortURL
    req.session.fav = shortURL;
    urlDatabase[shortURL]['fav'] = true;
    res.redirect("/urls");
  }
});

app.post("/:shortURL/unfav", (req, res) => {
  const userIDCookie = req.session.user_id;
  if (!userIDCookie) {
    res.redirect("/login");
  } else {
    const shortURL = req.params.shortURL
    req.session.fav = shortURL;
    urlDatabase[shortURL]['fav'] = false;
    res.redirect("/urls");
  }
});

//redirect requests to /u/:shortUrl to the respective longUrl
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  //if we have this entry in the database
  if (urlDatabase[shortURL]) {
    const formattedLongURL = urlDatabase[shortURL]['longURL'].substring(0, 4) !== 'http' ? `http://${urlDatabase[shortURL]['longURL']}` : urlDatabase[shortURL]['longURL'];
    res.redirect(formattedLongURL);
  } else {
    res.status(400).send('We do not recognize that TinyUrl')
  }
});

//add a route to remove a url resource
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.redirect("/login");
  } else {
  const { shortURL } = req.params;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
  }
});

//add a route for creating a new tiny url
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.redirect("/login");
  } else {
    let templateVars = { user: users[userID]};
    res.render("urls_new", templateVars);
  }
});

//add a route handler for /urls__show
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.redirect("/login");
  } else {
    const shortURL = req.params.shortURL;
    const templateVars = { 
      shortURL, 
      longURL: urlDatabase[shortURL].longURL,
      user: users[userID]
    };
    res.render("urls_show", templateVars);
  }
});

//add a handler for updating a long URL
app.post("/urls/:shortURL", (req, res) => {
  const updatedLongURL = req.body.updatedLongURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL]['longURL'] = updatedLongURL;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("register", users);
});

const emailLookup = (emailAddress, database) => {
  for (let userId in database) {
    const user = database[userId];
    if (user.email === emailAddress) {
      return user;
    }
  }
  return false;
};

app.post("/register", (req, res) => {
  let id = generateRandomString();
  let email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  //res.send error 400 if password empty or email empty
  //email lookup finds email in userobj
  if (!email || !password) {
    return res.status(400).send('Email or password cannot be empty!');
  } else if (emailLookup(email, users)) {
    return res.status(400).send('Sorry, that email/password combination is invalid!');
  } else {
    users[id] = {id, email, hashedPassword};
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {user: null};
  res.render("login", templateVars);

});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //retrieve user in DB with email;
  const user = emailLookup(email, users);
  if (user) {
    let passCompare = bcrypt.compareSync(password, user.hashedPassword);
    if (passCompare) {
      req.session.user_id = user.id;
      const templateVars = { user };
      res.redirect("/urls");
    } else {
      res.send("Login credentials incorrect");
    }
  } else {
    res.send("Login credentials incorrect");
  }
});