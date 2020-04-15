# Keratin AuthN

Keratin AuthN is an authentication service that keeps you in control of the experience without forcing you to be an expert in web security.

This gem provides utilities to help integrate with the backend of a NodeJS application. You will also
need a client for your frontend, such as [keratin/authn-js](https://github.com/keratin/authn-js).

[![Gitter](https://badges.gitter.im/keratin/authn-server.svg)](https://gitter.im/keratin/authn-server?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Build Status](https://travis-ci.org/keratin/authn-node.svg?branch=master)](https://travis-ci.org/keratin/authn-rb)

## Installation

```
yarn add authn-node
```

## Usage

```js
import AuthN from "authn-node";

const authn = new AuthN({
  // The AUTHN_URL of your Keratin AuthN server. This will be used to verify tokens created by AuthN,
  // and will also be used for API calls unless `adminURL` is also set (see below).
  issuer: "https://authn.myapp.com",

  // The domains of your application (no protocol). These domain should be listed in the APP_DOMAINS of
  // your Keratin AuthN server.
  audiences: ["myapp.com"],

  // OPTIONAL: Send private API calls to AuthN using private network routing. This can be necessary
  // if your environment has a firewall to limit public endpoints.
  adminURL: "https://authn.internal.dns/",

  // Credentials for AuthN's private endpoints. These will be used to execute admin actions using the
  // `Keratin.authn` client provided by this library.
  //
  // TIP: make them extra secure in production!
  username: "secret",
  password: "secret",

  // OPTIONAL: Specify how long keys should remain cached in the keychain, in minutes.
  keychainTTL: 60, // minutes
});
```

### Reading the Session

Use `Keratin::AuthN.subject_from(params[:authn])` to fetch an `account_id` from the session if and
only if the session is valid.

### Modifying Accounts

Unimplemented in this release.

### Example

You should store the token in a cookie or header (the [keratin/authn-js](https://github.com/keratin/authn-js)
integration can do this automatically) and continue using it to verify a logged-in session:

```js
// your token may be in a cookie or a header, depending on your client configuration.
const token = req
  .get("authorization")
  .replace(/Bearer/, "")
  .trim();

// subjectFrom will return an AuthN account ID that you can use to identify the user.
const accountID = authn.subjectFrom(token);

// create a user during signup with the accountID
User.create({ name, email, accountID });

// use the accountID to find the current user later
User.find({ accountID });
```

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/keratin/authn-node. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.
