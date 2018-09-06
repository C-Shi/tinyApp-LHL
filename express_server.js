var express = require("express");
const methodOverride = require('method-override');
var app = express();
const bodyParser = require('body-parser');
var PORT = 8080; // default port 8080
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');
var time = require('express-timestamp')


//config environment
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(time.init);
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['Lijing is the best'],
}))

// global object for long-short url pairs
var urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "j1Dn4r",
    visits: 0,
    visitor: []
  },
  '7xgF3d': {
    longURL: "http://www.google.com",
    userID: "lds35r",
    visits: 0,
    visitor: []
  }
};

// global object for user info
const users = {
  'j1Dn4r': {
    id: 'j1Dn4r',
    email: 'hello@hello.com',
    password: bcrypt.hashSync('hello', 10)
  },
  'lds35r': {
    id: 'lds35r',
    email: 'home@home.com',
    password: bcrypt.hashSync('home', 10)
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
    user: cookieValidator(req.session.user_id, users)
  };
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  if (cookieValidator(req.session.user_id, users)){
    let templateVars = {
      user: cookieValidator(req.session.user_id, users)
    }
    res.render('urls_new.ejs', templateVars);
  }else {
    res.redirect('/login');
  }
})

app.get('/urls/:id', (req, res) => {
  if(!cookieValidator(req.session.user_id, users)){
    res.redirect('/login');
  }
  if (!urlOwnershipValidator(req.session.user_id, req.params.id, urlDatabase)){
    res.statusCode = 403;
    res.send('You Do Not Own this URL. Do Not Try to Bypass');
  }
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase,
    user: cookieValidator(req.session.user_id, users)
  };
  res.render('urls_show', templateVars);
})

app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  if (longURL) {
    urlDatabase[shortURL].visits++;

    /* unique visitor logics
      1. if no user logged in, treat as visitor, create a session cookie visitor_id for every visit
      2. if user logged in, compare if this user's user_id is already exist in the visitor history
      3. session cookie visitor_id will only appy to visitor, for user, will use user_id instead
    */
    if (!req.session.user_id){
      req.session.visitor_id = generateRandomString();
        const visitorInfo = {
          visitor_id: req.session.visitor_id,
          timestamp: req.timestamp
        }
        urlDatabase[shortURL].visitor.push(visitorInfo);
    }else if(!urlDatabase[shortURL].visitor.find((visitor) => {
      return visitor.visitor_id === req.session.user_id
    })){
      const visitorInfo = {
        visitor_id: req.session.user_id,
        timestamp: req.timestamp
      };
      urlDatabase[shortURL].visitor.push(visitorInfo);
    }

    console.log(urlDatabase[shortURL].visitor);
    res.redirect(longURL);
  } else {
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
  if (cookieValidator(req.session.user_id, users)){
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: `http://${req.body.longURL}`,
      userID: req.session.user_id
    }
    res.redirect(`/urls/${shortURL}`)
  }else {
    res.send('/login');
  }
})

//update url
app.put('/urls/:id', (req, res) => {
  let updateURL = req.body.longURL;
  // if user is not logged in, redirect to login
  if (!cookieValidator(req.session.user_id, users)){
    res.redirect('/login');
  } else if (urlOwnershipValidator(req.session.user_id, req.params.id, urlDatabase)){
    // handover to urlOwnershipValidator to check if this user own this url
    urlDatabase[req.params.id].longURL = `http://${updateURL}`;
    res.redirect('/urls');
  } else {
    res.send('You do not own this url');
  }
})

// delete existing url
app.delete('/urls/:id/delete', (req, res) => {
  // give user correct info whether they are not login, or they do not own the url
  // hiding the button is not the perfect way as a post request can be sent from curl or postman
  if (!cookieValidator(req.session.user_id, users)){
    res.redirect('/login');
  }else if (urlOwnershipValidator(req.session.user_id, req.params.id, urlDatabase)){
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
    // express will send back the username as cookie via session
    req.session.user_id = cookie;
    res.redirect('/');
  } else {
    res.statusCode = 403;
    res.send(res.statusCode);
  }
})

// logout route
app.post('/logout', (req, res) => {
  // set req.session to null to destroy all the cookie
  req.session = null;
  res.redirect('/urls');
})

// register route - post user
app.post('/register', (req, res) => {
  let userID = generateRandomString();
  let newUser = {
    id: userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  }
  // registration error will be handled by a separate function - registrationValidator
  if(registrationValidator(newUser)){
    users[userID] = newUser;
    req.session.user_id = userID;
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
    if (users[user].email === thisUser.email && bcrypt.compareSync(thisUser.password, users[user].password)) {
      return users[user]; // this will return not only 'true' value, but also actual user that contains info
    }
  }
  // reject login if: 1. user not found (including submit empty form), 2: email or password does not match
  return false;
}