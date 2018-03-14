# Connect Session Firestore

[![Travis](https://img.shields.io/travis/benweier/connect-session-firestore.svg?maxAge=2592000&style=flat-square)](https://travis-ci.org/benweier/connect-session-firestore)
[![Codecov](https://img.shields.io/codecov/c/github/benweier/connect-session-firestore.svg?maxAge=2592000&style=flat-square)](https://codecov.io/gh/benweier/connect-session-firestore)
[![Greenkeeper badge](https://img.shields.io/badge/greenkeeper-enabled-brightgreen.svg?style=flat-square)](https://greenkeeper.io/)

`connect-session-firestore` is a Connect/Express compatible session store backed by the [Firebase SDK](https://firebase.google.com/docs/admin/setup).

## Installation

`firebase-admin` must be added as a peer dependency, or you're gonna have a bad time.

    $ npm install firebase-admin connect-session-firestore --save

## Options

  - `database` A pre-initialized Firebase Cloud Firestore app.
  - `sessions` (optional) A document reference string for session storage. (defaults to "sessions")
  - `reapInterval` (optional) How often expired sessions should be cleaned up (defaults to 21600000) (6 hours in milliseconds)
  - `reapCallback` (optional) A callback function to execute whenever a session clean up occurs

## Usage

Initialize `firebase-admin` database and pass the instance to `FirestoreStore`. Connecting to the database requires a credential cert via a JSON file from the [Firebase IAM & Admin Console](https://console.firebase.google.com/iam-admin/projects).

* [Connect](http://senchalabs.github.io/connect)

```js
const connect = require('connect');
const FirestoreStore = require('connect-session-firestore')(connect);
const firebase = require('firebase-admin');
const ref = firebase.initializeApp({
  credential: firebase.credential.cert('path/to/serviceAccountCredentials.json'),
  databaseURL: 'https://databaseName.firebaseio.com'
});

connect()
  .use(connect.cookieParser())
  .use(connect.session({
    store: new FirestoreStore({
      database: ref.firestore()
    }),
    secret: 'keyboard cat'
  }));
```

* [Express](http://expressjs.com)

  **NOTE:** In Express 4 `express-session` must be passed to the function `connect-session-firestore` exports in order to extend `express-session.Store`:

```js
const express = require('express');
const session = require('express-session');
const FirestoreStore = require('connect-session-firestore')(session);
const firebase = require('firebase-admin');
const ref = firebase.initializeApp({
  credential: firebase.credential.cert('path/to/serviceAccountCredentials.json'),
  databaseURL: 'https://databaseName.firebaseio.com'
});

express()
  .use(session({
    store: new FirestoreStore({
      database: ref.firestore()
    }),
    secret: 'keyboard cat'
    resave: true,
    saveUninitialized: true
  }));
```

## Tests

To run tests against `connect-session-firestore` you will need your own Firebase Database app available.

Checkout the repo locally and create two files in the project root:
- .env
- serviceAccountCredentials.json

With the content:

*.env*
```
FIREBASE_SERVICE_ACCOUNT=./serviceAccountCredentials.json
FIREBASE_DATABASE_URL=https://[databaseName].firebaseio.com
```

*serviceAccountCredentials.json*
```
{
  "type": "service_account",
  "project_id": "",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": ""
}
```

Install the dev dependencies:

    $ npm install

Run the tests:

    $ npm test

## License

`connect-session-firestore` is licensed under the [MIT license](https://github.com/benweier/connect-session-firestore/blob/master/LICENSE).
