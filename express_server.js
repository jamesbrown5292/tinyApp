//Import packages for cookies, body parsing, method override, bcrypt, set date email and random string function and set view engine and session cookie
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const express = require("express");
const methodOverride = require('method-override')
const bcrypt = require("bcrypt");
const helpers = require("./helpers");
const date = require('date-and-time');
const app = express();
const emailLookup = helpers.emailLookup;
const generateRandomString = helpers.generateRandomString;
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({name: 'Session', keys: ['user_id']}));

const PORT = 8080; // default port 8080

/*Empty url database and users object. Url database structured as follows:
{
  "ck6sk3": {
    longURL: "www.example.com" 
    userID: sdjd8e, 
    fav: false, 
    visitCount: 0, 
    uniqueVisits: [], 
    visitTimes: [],
    dateCreated: 
  }
}

Users object structured as follows: 

  {
    "sjd73k": {
      id: "sjd73k", 
      email: "example@email.com,""
      hashedPassword: aslsaksalasdk83292023i23jhf
    }
  }

*/
const urlDatabase = {};
const users = {};


//Use middleware to create a visitor id cookie if the request doesnt aready have
app.use((req, res, next) => {
  if (!req.session.user_id) {
    req.session.user_id = generateRandomString();
  }
  next();
});

//Redirect requests to "/" to the login page if user is not logged in, or to the urls page if they are
app.get("/", (req, res) => {
  const userIDCookie = req.session.user_id;
  if (!users[userIDCookie]) {
    res.redirect("/login");
  } else {
    res.redirect("/urls")
  }
});

//listen on the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


//add a route handler for /urls. Check that the user_id matches the session cookie. If not, redirect to login, otherwise...
//...pass the original list of urls and an filtered list of URLS to the urls_index ejs. The filtered list will be rendered to the user's index page
app.get("/urls", (req, res) => {
  const userIDCookie = req.session.user_id;
  const filteredUsers = {};
  if (!users[userIDCookie]) {
    res.redirect("/login");
  } else {
    for (let url in urlDatabase) {
      let userID = urlDatabase[url]['userID'];
      if (userID === userIDCookie ) {
        filteredUsers[url] = url
      }
    }
    const templateVars = { urls: filteredUsers, user: users[userIDCookie], unfilteredURL: urlDatabase };
    res.render('urls_index', templateVars);
  }
});

//handle new short URL being created in the urls_new page
app.post("/urls", (req, res) => {
  const creationDate = date.format(new Date(), 'MMM D YYYY hh:mm [UTC]', true)
  const randomURL = generateRandomString();
  const shortURL = randomURL
  const longURL = req.body.longURL;
  const userID = req.session.user_id
  urlDatabase[shortURL] = {longURL, 
    userID, 
    fav: false, 
    visitCount: 0, 
    uniqueVisits: [], 
    visitTimes: [],
    dateCreated: creationDate 
  };    
  res.redirect(`/urls/${shortURL}`); //redirects to the new url page
});

//BONUS FEAUTRE!!!! Favourite button - toggles a t/f value on the urlDB. Click again to untoggle.
//Favourites are saved between sessions.
app.put("/:shortURL/fav", (req, res) => {
  const userIDCookie = req.session.user_id;
  if (!users[userIDCookie]) {
    res.redirect("/login");
  } else {
    const shortURL = req.params.shortURL
    req.session.fav = shortURL;
    urlDatabase[shortURL]['fav'] = true;
    res.redirect("/urls");
  }
});
//Handle unfavouritizing 
app.put("/:shortURL/unfav", (req, res) => {
  const userIDCookie = req.session.user_id;
  if (userIDCookie !== users[userIDCookie].id) {
    res.redirect("/login");
  } else {
    const shortURL = req.params.shortURL
    req.session.fav = shortURL;
    urlDatabase[shortURL]['fav'] = false;
    res.redirect("/urls");
  }
});

//Unique page to send users who are logged in but try to access the views page of a url they don't own 
app.get("/urls/noshow", (req, res) => {
  const currentUserID = req.session.user_id;
  const templateVars = {  user: users[currentUserID]  };

  res.render("urls_noshow", templateVars);
});

//Redirect requests fromvalid short URL to the respective longUrl, increment the url's counter and edit its visitor data arrays for rendering 
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userIDCookie = req.session.user_id
  urlDatabase[shortURL]['visitCount'] ++;
  //if it's a unique visit, log it
  if (!urlDatabase[shortURL]['uniqueVisits'].includes(userIDCookie)) {
    urlDatabase[shortURL]['uniqueVisits'].push(userIDCookie);
    const visitTime = date.format(new Date(), 'MMM D YYYY hh:mm [UTC]', true)
    urlDatabase[shortURL]['visitTimes'].push(visitTime);
  };
  //Prepend "http://" to urls that do now include www. (handles a error caused by URLs without www at the start)
  if (urlDatabase[shortURL]) {
    const formattedLongURL = urlDatabase[shortURL]['longURL'].substring(0, 4) !== 'http' ? `http://${urlDatabase[shortURL]['longURL']}` : urlDatabase[shortURL]['longURL'];
    res.redirect(formattedLongURL);
  } else {
    res.status(400).send('We do not recognize that TinyURL')
  }
});

//Delete a url entry from the database. Users can only delete their own entries.
app.delete("/urls/:shortURL", (req, res) => {
  const userIDCookie = req.session.user_id;
  if (!users[userIDCookie]) {
    res.redirect("/login");
  } else {
  const { shortURL } = req.params;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
  }
});

//Get the new urls page - verify that the user is logged in before they can access and redirect them if not
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!users[userID]) {
    res.redirect("/login");
  } else {
    let templateVars = { user: users[userID]};
    res.render("urls_new", templateVars);
  }
});

//Route to show the short url feature page where users can edit the url and view analytics
//only owners can view this page. Logged in non-owners are sent to a non-ownership page
app.get("/urls/:shortURL", (req, res) => {
  const currentUserID = req.session.user_id; 
  const shortURL = req.params.shortURL;
  //If the current user isn't registered/logged in
  if (!users[currentUserID]) {
    res.redirect("/login");
  //if the database doesn't contain the short URL
  } else if (!urlDatabase[shortURL]) {
    res.redirect("/urls")
    //if they are not the registered owner on the url database
  } else if (urlDatabase[shortURL]['userID'] !== currentUserID) {
    res.redirect("/urls/noshow");
  } else {
    //all good, they can view
    const templateVars = { 
      shortURL, 
      longURL: urlDatabase[shortURL].longURL,
      user: users[currentUserID],
      visitCount: urlDatabase[shortURL].visitCount,
      uniqueVisits: urlDatabase[shortURL].uniqueVisits, 
      visitTimes: urlDatabase[shortURL].visitTimes,
      dateCreated: urlDatabase[shortURL].dateCreated
    };
    res.render("urls_show", templateVars);
  }
});



//Route handler for updating the long URL associated with a specific short URL
app.put("/urls/:shortURL", (req, res) => {
  const updatedLongURL = req.body.updatedLongURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL]['longURL'] = updatedLongURL;
  res.redirect("/urls");
});

//Route handler for logging out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


//Route for getting the register page. 
app.get("/register", (req, res) => {
  res.render("register", users);
});

//Post request to handle new user registeration and various errors for invalid input: email/password undefined, email already in use.
//Redirect back to urls index page if registration is successful
app.post("/register", (req, res) => {
  let id = generateRandomString();
  let email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!email || !password) {
    return res.status(400).send('Email or password cannot be empty!');
  } else if (emailLookup(email, users)) {
    return res.status(400).send('Sorry, that email/password combination is invalid!');
  } else {
    users[id] = {
      id, 
      email, 
      hashedPassword
    };
    req.session.user_id = id;
    res.redirect("/urls");
  }
});


//Get user log in page
app.get("/login", (req, res) => {
  const templateVars = {user: null};
  res.render("login", templateVars);

});

//Handle log in attempt. Compare hashed password to records for authentication. 
//Look up user hashed pass with email lookupfunction, return error message if credentials don't match.
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //retrieve user in DB with email;
  const userID = emailLookup(email, users);
  if (userID) {
    const user = users[userID]
    let passCompare = bcrypt.compareSync(password, user.hashedPassword);
    if (passCompare) {
      req.session.user_id = users[userID].id;
      const templateVars = { user };
      res.redirect("/urls");
    } else {
      res.send("Login credentials incorrect");
    }
  } else {
    res.send("Login credentials incorrect");
  }
});