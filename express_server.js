var express = require("express");
var app = express();
const bodyParser = require('body-parser');
var PORT = 8080; // default port 8080

//config environment
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send('HOME');
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new.ejs');
})

app.post('/urls', (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = `http://${req.body.longURL}`;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`)
})

app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase
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