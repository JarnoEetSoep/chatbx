[![Website](https://img.shields.io/badge/Website-up-success.svg)](https://chatbx.herokuapp.com) ![Node version](https://img.shields.io/badge/Node%20version-8.10.0-fe4242.svg) ![NPM version](https://img.shields.io/badge/NPM%20version-6.7.0-fe4242.svg) [![GitHub issues](https://img.shields.io/github/issues/JarnoEetSoep/chatbx.svg)](https://gitHub.com/JarnoEetSoep/chatbx/issues/)
# chatbx

## Chat:
It's hosted free at [Heroku](https://heroku.com). You can find the chat over [here](https://chatbx.herokuapp.com).
<br>

## If you want to improve this project:
There are some environment variables:

Name | Usage | Optional | Value
---- | :---: | -------- | -----
at_heroku | If set, node won't set up a https server | True | Any
mongoURI | If set, this is the MongoDB URI, if not set, it tries to connect to a local MongoDB server | True | URI
saltRounds | Salt rounds for bcrypt | False | Integer
SECRET_<br>KEY_BASE | Secret for cookies | False | String