const bcrypt = require('bcrypt');

module.exports = {
  generateRandomString: () => {
    const str = '0123456789qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM';
    let random = '';
    for (let i = 0; i < 6; i += 1) {
      random += str[Math.floor(Math.random() * str.length)];
    }
    return random;
  },

  registrationValidator: (newUser, users) => {
    // reject registration if no email or password provide
    if (!newUser.email || !newUser.password) return false;
    // reject registration if email has already exist
    for (const user in users) {
      if (users[user].email === newUser.email) return false;
    }
    return true;
  },
  // this function will valide the ownership of a url
  urlOwnershipValidator: (userCookie, shortURL, database) => {
    for (const url in database) {
      if (database[url].userID === userCookie && url === shortURL) return true;
    }
    return false;
  },
  // this function check find and return the correct user based on cookie
  cookieFinder: (cookie, users) => {
    if (cookie in users) {
      return users[cookie];
    }
    return undefined;
  },
  loginValidator: (thisUser, users) => {
    // pass login if email and password match
    for (const user in users) {
      if (users[user].email === thisUser.email && bcrypt.compareSync(thisUser.password, users[user].password)) {
        return users[user];
        // this will return not only 'true' value, but also actual user that contains info
      }
    }
    // reject login if:
    // 1. user not found (including submit empty form),
    // 2: email or password does not match
    return false;
  },
};
