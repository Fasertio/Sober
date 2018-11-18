# Sober

## A simple and responsive social network idea

Based on a NodeJs application, this social network can help you to understand the basic mechanics used by other web application.
This web application include a login authentication, a page for the user creation and two pages where post messages.

# Requirements

Basic requirements are:

- NodeJs
- MongoDB
- A text editor

# Installing

To install Sober, you need to clone or download the repository so you must download many modules:
- 'npm install express'
- 'npm install jade'
- 'npm install debug'
- 'npm install morgan'

The other modules managed are already installed in the repository. The name of the database is Sober (is managed by Mongoose in the app.js file). If you want change the server's port you just need to go in the www.js file and change it.

After this you can modify the jade pages managed with Bootstrap library :rocket:

#### Wish list

- Upgrade authentication (is managed using passport module)
- Create a sanitization of input value
- Insert image in the messages
- Fix many bugs in the pages
- Change the page to use handlebars

