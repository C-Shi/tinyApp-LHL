# TinyApp
This is a full-stack web application built on NodeJS with Express framework. TinyApp allows user to create, read, update and delete their own short URL and share with the publics. User password and hashed so user's info is highly protected

## Final Porject Demo
This App is hosted on [tinyApp](https://tinyapp-cs-lhl.herokuapp.com/)

* Your will not be able to directly visit tinyApp.ca/u/<SHORT URL>
* Instead use tinyapp-cs-lhl.herokuapp.com/u/<SHORT URL>

For testing purpose, this app has a build-in account
  - Email: home@home.com
  - Password: home
  - Please take an advantage of this 'fake' account for a quick experience

![index](./docs/index.png)
![login](./docs/login.png)
![register](./docs/register.png)
![user](./docs/user.png)
![update](./docs/update.png)

## Dependencies
* "bcrypt": "^3.0.0",
* "body-parser": "^1.18.3",
* "cookie-parser": "^1.4.3",
* "cookie-session": "^2.0.0-beta.3",
* "ejs": "^2.6.1",
* "express": "^4.16.3",
* "express-timestamp": "^0.1.4",
* "method-override": "^3.0.0"

## Get Started
* Clone this repository, make sure your have node and npm install
* Install all dependencies on your local machine from command line
```
npm install
```
* Run in development environment from command line
```
node express_server.js
```
* Register a new user and getting started !

## Unsolved Bugs
* User will be able to create multiple shortURL to the same long URL which take up space
* Everytime a un-registered / un-logged user visit an URL, it will consider a unique visit regardless of his/her IP
* If a user update an existing URL to a new address, Visits history will not be reset
