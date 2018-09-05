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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// global object for user info
const users = {
  'j1Dn4r': {
    id: 'j1Dn4r',
    email: 'hello@example.com',
    password: '800300'
  },
}

//  **************** get request *******************

app.get("/", (req, res) => {
  res.send('HOME');
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
  let templateVars = {
    user: cookieValidator(req.cookies.user_id, users)
  }
  res.render('urls_new.ejs', templateVars);
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
  let longURL = urlDatabase[shortURL];
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
  urlDatabase[shortURL] = `http://${req.body.longURL}`;
  res.redirect(`/urls/${shortURL}`)
})

//update url
app.post('/urls/:id', (req, res) => {
  let updateURL = req.body.longURL;
  urlDatabase[req.params.id] = `http://${updateURL}`;
  res.redirect('/urls');
})

// delete existing url
app.post('/urls/:id/delete', (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
})

// login route
app.post('/login', (req, res) => {
  // username will be sent through html form
  let cookie = req.body.username;
  // express will send back the username as cookie via res.cookie()
  res.cookie('username', cookie);
  res.redirect('/urls');
})

// logout route
app.post('/logout', (req, res) => {
  // this will clear out the cookies named 'username'
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

function cookieValidator (cookie, users) {
  if (cookie in users) {
    return users[cookie];
  }
  return undefined;
} 