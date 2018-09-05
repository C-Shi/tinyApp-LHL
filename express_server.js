var express = require("express");
const cookieParser = require('cookie-parser')
var app = express();
const bodyParser = require('body-parser');
var PORT = 8080; // default port 8080

//config environment
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// get request

app.get("/", (req, res) => {
  res.send('HOME');
});

app.get("/urls", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    username: req.cookies.username
  };
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    username: req.cookies.username
  }
  res.render('urls_new.ejs', templateVars);
})

app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase,
    username: req.cookies.username
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

//  *********** post request *************

// add new url
app.post('/urls', (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = `http://${req.body.longURL}`;
  console.log(urlDatabase);
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
  res.clearCookie('username');
  res.redirect('/urls');
})

// listen route
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// temporary function 
function generateRandomString() {
  const str = '0123456789qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM';
  let shortURL = '';
  for (let i = 0; i < 6; i++){
    shortURL += str[Math.floor(Math.random() * str.length)]
  }

  return shortURL;
}