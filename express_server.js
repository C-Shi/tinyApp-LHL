var express = require("express");
const cookieParser = require('cookie-parser')
var app = express();
const bodyParser = require('body-parser');
var PORT = 8080; // default port 8080

//config environment
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// global object for long-short url pairs
var urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "j1Dn4r"
  },
  '7xgF3d': {
    longURL: "http://www.google.com",
    userID: "lds35r"
  }
};

// global object for user info
const users = {
  'j1Dn4r': {
    id: 'j1Dn4r',
    email: 'hello@hello.com',
    password: 'hello'
  },
  'lds35r': {
    id: 'lds35r',
    email: 'home@home.com',
    password: 'home'
  }
}

//  **************** get request *******************

app.get("/", (req, res) => {
  res.redirect('/urls');
});

// render login form
app.get('/login', (req, res) => {
  res.render('_login');
})

app.get("/urls", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    user: cookieValidator(req.cookies.user_id, users)
  };
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  if (cookieValidator(req.cookies.user_id, users)){
    let templateVars = {
      user: cookieValidator(req.cookies.user_id, users)
    }
    res.render('urls_new.ejs', templateVars);
  }else {
    res.redirect('/login');
  }
})

app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase,
    user: cookieValidator(req.cookies.user_id, users)
  };
  res.render('urls_show', templateVars);
})

app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  if (longURL) {
    res.redirect(longURL);
  }else {
    res.send('Cannot find');
  }
})

// register route - render form
app.get('/register', (req, res) => {
  res.render('_register');
})

//  *********** post request *************

// add new url
app.post('/urls', (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL].longURL = `http://${req.body.longURL}`;
  res.redirect(`/urls/${shortURL}`)
})

//update url
app.post('/urls/:id', (req, res) => {
  let updateURL = req.body.longURL;
  // if user is not logged in, redirect to login
  if (!cookieValidator(req.cookies.user_id, users)){
    res.redirect('/login');
  } else if (urlOwnershipValidator(req.cookies.user_id, req.params.id, urlDatabase)){
    // handover to urlOwnershipValidator to check if this user own this url
    urlDatabase[req.params.id].longURL = `http://${updateURL}`;
    res.redirect('/urls');
  } else {
    res.send('You do not own this url');
  }
})

// delete existing url
app.post('/urls/:id/delete', (req, res) => {
  // give user correct info whether they are not login, or they do not own the url
  // hiding the button is not the perfect way as a post request can be sent from curl or postman
  if (!cookieValidator(req.cookies.user_id, users)){
    res.redirect('/login');
  }else if (urlOwnershipValidator(req.cookies.user_id, req.params.id, urlDatabase)){
    let shortURL = req.params.id;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }else {
    res.send('You do not own this url');
  }
})

// login route
app.post('/login', (req, res) => {
  let thisUser = {
    email: req.body.email,
    password: req.body.password
  }
  let validUser = loginValidator(thisUser, users);
  // hand over to loginValidator to check if this login is valid
  if (validUser){
    let cookie = validUser.id;
    // express will send back the username as cookie via res.cookie()
    res.cookie('user_id', cookie);
    res.redirect('/');
  } else {
    res.statusCode = 403;
    res.send(res.statusCode);
  }
})

// logout route
app.post('/logout', (req, res) => {
  // this will clear out the cookies named 'user_id'
  res.clearCookie('user_id');
  res.redirect('/urls');
})

// register route - post user
app.post('/register', (req, res) => {
  let userID = generateRandomString();
  let newUser = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  }
  // registration error will be handled by a separate function - registrationValidator
  if(registrationValidator(newUser)){
    users[userID] = newUser;
    res.cookie('user_id', userID);
    res.redirect('/urls');
  }else {
    res.statusCode = 400;
    res.send(res.statusCode);
  }
})


// listen route
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// temporary function 
function generateRandomString() {
  const str = '0123456789qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM';
  let random = '';
  for (let i = 0; i < 6; i++){
    random += str[Math.floor(Math.random() * str.length)]
  }
  return random;
}

function registrationValidator(newUser){
  // reject registration if no email or password provide
  if (!newUser.email || !newUser.password) return false;
  // reject registration if email has already exist
  for (user in users){
    if (users[user].email === newUser.email) return false;
  }
  return true;
}

// this function will valide the ownership of a url
function urlOwnershipValidator (userCookie, shortURL, database) {
  for (url in database){
    if(database[url].userID === userCookie && url === shortURL) return true;
  }
  return false;
}

// this function check if there is a currently logged in user
function cookieValidator (cookie, users) {
  if (cookie in users) {
    return users[cookie];
  }
  return undefined;
} 

function loginValidator(thisUser, users){
  // pass login if email and password match
  for (user in users){
    if (users[user].email === thisUser.email && users[user].password === thisUser.password) {
      return users[user]; // this will return not only 'true' value, but also actual user that contains info
    }
  }
  // reject login if: 1. user not found (including submit empty form), 2: email or password does not match
  return false;
}