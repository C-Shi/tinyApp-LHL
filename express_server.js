// Require modules
const express = require('express');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const time = require('express-timestamp');
// middleware object for all helper function inside a different module
const middleware = require('./middleware');

// config global const
const PORT = process.env.PORT || 8080; // add process.env.PORT for deployment purpose
const app = express();
// sample database
const urlDatabase = {
  b2xVn2: {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'j1Dn4r',
    visits: 0,
    visitor: [],
    createdAt: '2012-04-05',
  },
  '7xgF3d': {
    longURL: 'http://www.google.com',
    userID: 'lds35r',
    visits: 0,
    visitor: [],
    createdAt: '2018-05-05',
  },
  '6yGl9B': {
    longURL: 'http://www.cheng-shi.xyz',
    userID: 'lds35r',
    visits: 0,
    visitor: [],
    createdAt: '2018-08-17',
  },
};
const users = {
  j1Dn4r: {
    id: 'j1Dn4r',
    email: 'hello@hello.com',
    password: bcrypt.hashSync('hello', 10),
  },
  lds35r: {
    id: 'lds35r',
    email: 'home@home.com',
    password: bcrypt.hashSync('home', 10),
  },
};


// config environment || set middleware
app.set('view engine', 'ejs');
app.use(express.static('public/'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(time.init);
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['Lijing is the best'],
}));

//  **************** get request *******************
// requrest to home page
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// request for login form
app.get('/login', (req, res) => {
  // block user from log in multiple time
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('_login');
  }
});

// request for url list
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: middleware.cookieFinder(req.session.user_id, users),
  };
  res.render('urls_index', templateVars);
});

// request for new url form
app.get('/urls/new', (req, res) => {
  if (req.session.user_id) {
    const templateVars = {
      user: middleware.cookieFinder(req.session.user_id, users),
    };
    res.render('urls_new.ejs', templateVars);
  } else {
    res.redirect('/login');
  }
});

// request for detail/edit url page
app.get('/urls/:id', (req, res) => {
  if (!(req.params.id in urlDatabase)) {
    res.statusCode = 404;
    const err = {
      code: 404,
      message: 'Page Not Found! This URL seems not exist',
    };
    res.render('_error', err);
  }
  if (!req.session.user_id) {
    res.redirect('/login');
  }
  if (!middleware.urlOwnershipValidator(req.session.user_id, req.params.id, urlDatabase)) {
    res.statusCode = 403;
    const err = {
      code: 403,
      message: 'You Do Not Own this URL. Do Not Try to Bypass',
    };
    res.render('_error', err);
  }
  const templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase,
    user: middleware.cookieFinder(req.session.user_id, users),
  };
  res.render('urls_show', templateVars);
});

// request to access through shorten url
app.get('/u/:shortURL', (req, res) => {
  const { shortURL } = req.params;
  // check if short url actually exist
  if (!urlDatabase[shortURL]) {
    res.statusCode = 404;
    const err = {
      code: 404,
      message: 'What are you looking for? This page does not exist',
    };
    res.render('_error', err);
  }

  const { longURL } = urlDatabase[shortURL];
  if (longURL) {
    urlDatabase[shortURL].visits += 1;

    /* unique visitor logics
      1. if no user logged in, treat as visitor, create a session cookie visitor_id for every visit
      2. if user logged in, compare if this user's user_id is already exist in the visitor history
      3. session cookie visitor_id will only appy to visitor, for user, will use user_id instead
    */
    if (!req.session.user_id) {
      req.session.visitor_id = middleware.generateRandomString();
      const visitorInfo = {
        visitor_id: req.session.visitor_id,
        timestamp: req.timestamp,
      };
      urlDatabase[shortURL].visitor.push(visitorInfo);
    } else if (!urlDatabase[shortURL].visitor.find(v => v.visitor_id === req.session.user_id)) {
      const visitorInfo = {
        visitor_id: req.session.user_id,
        timestamp: req.timestamp,
      };
      urlDatabase[shortURL].visitor.push(visitorInfo);
    }
    res.redirect(longURL);
  } else {
    res.send('Cannot find');
  }
});

// request for register form
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('_register');
  }
});

// request for visitor log
app.get('/urls/:id/visitor', (req, res) => {
  if (!(req.params.id in urlDatabase)) {
    res.statusCode = 404;
    const err = {
      code: 404,
      message: 'What are you talking about? I don\'t find this URL',
    };
    res.render('_error', err);
  }
  if (!req.session.user_id) {
    res.redirect('/login');
  }
  if (!middleware.urlOwnershipValidator(req.session.user_id, req.params.id, urlDatabase)) {
    res.statusCode = 403;
    const err = {
      code: 403,
      message: 'You Do Not Own this URL. Do Not Try to Bypass',
    };
    res.render('_error', err);
  }
  const templateVars = {
    shortURL: req.params.id,
    url: urlDatabase[req.params.id],
    user: middleware.cookieFinder(req.session.user_id, users),
  };
  res.render('urls_visitor', templateVars);
});

//  *********** post request *************
// add new url
app.post('/urls', (req, res) => {
  if (req.session.user_id) {
    const shortURL = middleware.generateRandomString();
    const URLregex = /^http/;
    const longURL = (URLregex.test(req.body.longURL)) ? req.body.longURL : `http://${req.body.longURL}`;
    urlDatabase[shortURL] = {
      longURL,
      userID: req.session.user_id,
      visits: 0,
      visitor: [],
      createdAt: req.timestamp.format('YYYY-MM-DD'),
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect('/login');
  }
});

// update url
app.put('/urls/:id', (req, res) => {
  // if user is not logged in, redirect to login
  if (!req.session.user_id) {
    res.redirect('/login');
  } else if (middleware.urlOwnershipValidator(req.session.user_id, req.params.id, urlDatabase)) {
    // handover to urlOwnershipValidator to check if this user own this url
    const URLregex = /^http/;
    const longURL = (URLregex.test(req.body.longURL)) ? req.body.longURL : `http://${req.body.longURL}`;
    urlDatabase[req.params.id].longURL = longURL;
    urlDatabase[req.params.id].createdAt = req.timestamp.format('YYYY-MM-DD');
    res.redirect('/urls');
  } else {
    res.statusCode = 403;
    const err = {
      code: 403,
      message: 'You do not own this url',
    };
    res.render('_error', err);
  }
});

// delete existing url
app.delete('/urls/:id/delete', (req, res) => {
  // give user correct info whether they are not login, or they do not own the url
  // hiding the button is not the perfect way as a post request can be sent from curl or postman
  if (!req.session.user_id) {
    res.redirect('/login');
  } else if (middleware.urlOwnershipValidator(req.session.user_id, req.params.id, urlDatabase)) {
    const shortURL = req.params.id;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.statusCode = 403;
    const err = {
      code: 403,
      message: 'You do not own this url',
    };
    res.render('_error', err);
  }
});

// login route
app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    const err = {
      code: 403,
      message: 'Email and Password cannot be blank',
    };
    res.render('_error', err);
  }
  // block user from log in multiple time
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  const thisUser = {
    email: req.body.email,
    password: req.body.password,
  };
  const validUser = middleware.loginValidator(thisUser, users);
  // hand over to loginValidator to check if this login is valid
  if (validUser) {
    const cookie = validUser.id;
    // express will send back the username as cookie via session
    req.session.user_id = cookie;
    res.redirect('/');
  } else {
    res.statusCode = 403;
    const err = {
      code: 403,
      message: 'Your login is invalid!',
    };
    res.render('_error', err);
  }
});

// logout route
app.post('/logout', (req, res) => {
  // set req.session to null to destroy all the cookie
  req.session = null;
  res.redirect('/urls');
});

// register route - post user
app.post('/register', (req, res) => {
  const userID = middleware.generateRandomString();
  if (!req.body.email || !req.body.password) {
    const err = {
      code: 403,
      message: 'Email and Password cannot be blank',
    };
    res.render('_error', err);
  }
  const newUser = {
    id: userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
  };
  // registration error will be handled by a separate function - registrationValidator
  if (middleware.registrationValidator(newUser, users)) {
    users[userID] = newUser;
    req.session.user_id = userID;
    res.redirect('/urls');
  } else {
    res.statusCode = 400;
    const err = {
      code: 400,
      message: 'Hey! This email exist! Please login',
    };
    res.render('_error', err);
  }
});

// apply 404 handler to all unknow routing - Always at last
app.get('*', (req, res) => {
  const err = {
    code: 404,
    message: 'Invalid URL',
  };
  res.render('_error', err);
});


// listen route
app.listen(PORT);
