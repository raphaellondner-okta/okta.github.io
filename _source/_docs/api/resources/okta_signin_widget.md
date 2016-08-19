---
layout: docs_page
title: Okta Sign-In Widget
excerpt: Easily add Okta Sign-in capabilities to your website.
---

## Overview

The Okta Sign-In Widget is a JavaScript widget from Okta that gives you a customizable login experience that authenticates users on any web site.

This page contains detailed reference information you can use to customize your sign-in widget.
Basic instructions for creating a sign-in widget are available in [Okta Sign-In Widget](../../guides/okta_sign-in_widget.html). 

Prerequisites from the basic guide include: 

* Use [a supported browser](https://support.okta.com/help/articles/Knowledge_Article/24532952-Platforms---Browser-and-OS-Support).
* [Create an Okta Developer Edition org](../../guides/okta_sign-in_widget.html#creating-an-okta-organization) if you don't already have one.
* [Configure your Okta org to support CORS](../getting_started/enabling_cors.html) before testing the Okta Sign-In Widget.

### Example of a Customized Sign-In Widget

> Okta Sign-In Widget documentation uses the domain name acme. Other Okta developer content uses <em>your-domain</em>.

~~~ javascript
// Initialize
var oktaSignIn = new OktaSignIn({
  baseUrl: 'https://acme.okta.com',
  features: {
    rememberMe: true,
    rememberDevice: true,
    smsRecovery: true,
    multiOptionalFactorEnroll: true
  },
  labels: {
    'primaryauth.title': 'Partner login',
    'help': 'Click here for more help'
  },
  transformUsername: function(username) {
    var suffix = '@acme.com';
    return (username.indexOf(suffix) !== -1) ? username : (username + suffix);
  }
});

// Render the widget if there is no active session
oktaSignIn.session.exists(function (exists) {
  if (exists) {
    // showHomePage();
    return;
  }

  // Show the sign-in widget
  oktaSignIn.renderEl(
    { el: '#sign-in-container' },
    // Success callback (invoked on successful authentication)
    function (res) {
      if (res.status === 'SUCCESS') {
        // showHomePageForUser(res.user);
      }
    },
    // Failure callback (invoked if the authentication is unsuccessful
    // or if there is a failure on authentication)
    function (err) {
      // handleErrors(err);
    }
  );
});
~~~

## Configuration Options

 Property       | Description                              |  Type    |  Required    | Default
--------------  | ---------------------------------------  | ------   | -----------  | -------
`baseUrl`       | The base URL for your Okta organization. (e.g., `https://acme.okta.com` and `https://acme.oktapreview.com`).  |String    | Yes          | None
`recoveryToken` | Bootstrap the widget in the recovery flow (e.g., Unlock Account or Forgot Password). | String    | No           | None
`stateToken`    | Bootstrap the widget in a specific flow (e.g., Enroll MFA or MFA challenge). | String    | No           | None
`logo`          | Logo to use in the widget (e.g., `https://acme.com/assets/logo/acme-logo.png`). | String    | No           | `Okta logo`
`username`      | Bootstrap the widget with a username i.e., pre-fill the username in the widget. | String    | No           | None
`transformUsername` | Transform the username before sending the request. The function is passed the username and the operation as parameters. [Example](#transformusername-example) | Function   | No           | None    
`features`      | Options to enable or disable a feature in the widget. [Option list](#features-options) [Example](#features-example) | Object | No           | None
`helpLinks`     | Options to configure alternate help links in the widget. [Option list](#helplinks-options) [Example](#helplinks-example)   | Object | No           | None
`labels`        | Options to localize labels in the widget. [Option list](#labels-options) | Object | No           | None

### Configuration Examples and Option Details

The following sections provide examples and option details for the last four configuration options.

#### transformUsername Example

~~~ javascript
    transformUsername: function (username, op) {
      var suffix = '@acme.com';

      // op can be PRIMARY_AUTH, FORGOT_PASSWORD or UNLOCK_ACCOUNT
      if (_.contains['FORGOT_PASSWORD', 'UNLOCK_ACCOUNT'], op) {
        return (username.indexOf(suffix) !== -1) ? username : (username + suffix);
      }
    }
~~~

#### features Example

~~~ javascript
    features: {
      rememberMe: true,
      rememberDevice: false,
      selfServiceUnlock: true,
      multiOptionalFactorEnroll: true
    }
~~~
    
#### features Options

Enable or disable widget functionality with the following options for `features`:
    
-   `rememberMe` `(default: true)`
    Display a checkbox to enable "Remember me" functionality at login.
     
-   `rememberDevice` `(default: true)` 
    Display a checkbox to enable "Trust this device" functionality in MFA required flow.
     
-   `rememberDeviceAlways` `(default: false)`
    Default the "Trust this device" checkbox to `true`.
    
-   `autoPush` `(default: false)`
    Display a checkbox to enable "Send push automatically" functionality in the MFA required flow.
        
-   `smsRecovery` `(default: false)`       
    Allow users with a configured mobile phone number to recover their password using an SMS message.
    
-   `selfServiceUnlock` `(default: false)`
    Display the "Unlock Account" link to allow users to unlock their accounts.
    
-   `multiOptionalFactorEnroll` `(default: false)`
    Allow users the option to enroll in multiple optional factors.
    
-   `router` `(default: false)`
    Update the browser location bar with a route on navigation.
    
#### helpLinks Example    

~~~ javascript
    helpLinks: {
      help: 'https://acme.com/custom/help',
      forgotPassword: 'https://acme.com/custom/forgotpassword',
      unlock: 'https://acme.com/custom/unlock',
      custom: [{
        text: 'Acme IT Support Page',
        href: 'https://acme.com/custom/itsupport'
      },
      {
        text: 'About Acme',
        href: 'https://acme.com/custom/about'
      }]
    }
~~~

#### helpLinks Options

Enable help links with the following options:
    
- `help`
   Custom link `href` for the 'Help' link.
   
- `forgotPassword`
   Custom link `href` for the 'Forgot Password' link.
   
- `unlock`
   Custom link `href` for the 'Unlock Account' link.
   
- `custom`
   Array of custom link objects. Each custom link object must have `text` and `href` properties.

- `helpSupportNumber`
  Option to display a Help/Support phone number if the user does not have access to email.
  
#### labels Options

The full list of labels are in these two files:
 
 * [Login Properties](https://github.com/okta/okta-signin-widget/blob/master/node_modules/%40okta/i18n/dist/properties/login.properties)
 * [Country Properties](https://github.com/okta/okta-signin-widget/blob/master/node_modules/%40okta/i18n/dist/properties/country.properties)

The following labels are among the most frequently used:

- `primaryauth.title`
   Title for your widget page.

- `primaryauth.username`
   Label for the username box.

- `primaryauth.username.tooltip`
   The tooltip that appears when the user hovers over the username box.

- `primaryauth.password`
   Label for the password box.

- `primaryauth.password.tooltip`
   The tooltip that appears when the user hovers over the password box.

Some labels contain "Okta." You may want to supply a different value for those labels.

### OIDC Options

Options for the [OpenID Connect](/docs/api/resources/oidc.html#request-parameters) authentication flow.
This flow is required for social authentication, and requires OAuth client registration with Okta.
For instructions, see [Social Authentication](/docs/api/resources/social_authentication.html).

#### Example OIDC flow

~~~ javascript
var oktaSignIn = new OktaSignIn({
  baseUrl: 'https://acme.okta.com',
  features: {
    rememberDevice: false,
  },
  // OIDC options
  clientId: 'GHtf9iJdr60A9IYrR0jw',
  redirectUri: 'https://acme.com/oauth2/callback/home',
  authScheme: 'OAUTH2',
  authParams: {
    responseType: 'id_token',
    responseMode: 'okta_post_message',
    scope: [
      'openid',
      'email',
      'profile',
      'address',
      'phone'
    ]
  },
  idpDisplay: 'PRIMARY',
  idps: [{
    'type': 'GOOGLE',
    'id': '0oaaix1twko0jyKik0g4'
  }, {
    'type': 'FACEBOOK',
    'id': '0oar25ZnMM5LrpY1O0g3'
  }, {
    'type': 'LINKEDIN',
    'id': '0oaaix1twko0jyKik0g4'
  }]
});

oktaSignIn.renderEl({
    el: '#sign-in-container'
  },
  function (res) {
    // res.idToken - id_token generated
    // res.claims - decoded id_token information
  },
  function (err) {
    // handleErrors(err);
  });
~~~

#### OIDC Parameters

 Property       | Description                              |  Type    |  Required    | Default
--------------  | ---------------------------------------  | ------   | -----------  | -------
 `clientId`     | [Client Id](oauth-clients) pre-registered with Okta for OIDC authentication flow. | String | Yes | None
 `redirectUri`  | Callback location to send the authorization code to. This must be pre-registered as part of client registration. | String | Yes | `window.location.href`
 `idps`         | External Identity Providers to use in OIDC authentication. Supported Identity providers - `GOOGLE`, `FACEBOOK` and `LINKEDIN`. Each IdP needs to be passed an object with `id` and `type`. | Array | No | `[]` 
 `idpDisplay`   | Display order for External Identity providers. `PRIMARY` to display external IdPs as primary, and `SECONDARY` to display Okta as the primary IdP. | String | No | `SECONDARY`
 `oAuthTimeout` | Timeout for OIDC authentication flow requests. | Number | No | `120000`
 `authScheme`   | Authentication scheme for OIDC authentication. | String | Yes | `OAUTH2`
 `authParams`   | Authentication parameters for OIDC. [List](#authParams-parameters) |See [List](#authParams-parameters) |See [List](#authParams-parameters) | See [List](#authParams-parameters)
 
##### Parameters for authParams

You can use any of the following parameters for `authParams`.

 authParams Parameter       | Description                              |  Type    |  Required    | Default   | Valid Values
--------------------------  | ---------------------------------------  | ------   | -----------  | -------   | ----------------
`display`                   | Specify how to display authentication UI. | String  | No           | `none` (for Okta) and `popup` (External Idp) | `none`, `popup`, `page`
`responseMode`              | Specify how the authorization response should be returned. | String | Yes | `okta_post_message` | `query`, `fragment`, `form_post`, `okta_post_message`
`responseType`              | Specify the response type for OIDC authentication. The authorization code returned can later be exchanged for Access token or Refresh token. | String | Yes | `id_token` | `code`, `token`, `id_token`
`scope`                     | Specify what information to make available in the `id_token`. `openid` is required. | Array | Yes | `['openid', 'email']` | `openid`, `email`, `profile`, `address`, `phone`    

## Render the widget

`.renderEl()` 

Render function for the sign-in widget. The function must be called with an `options` object containing any of the configuration options, a `success` callback function and a `failure` callback function. 
The options object must have an `el` property, usually an HTML DOM element `id` or `selector`, which becomes the container element for the widget DOM.

#### Example
~~~ javascript
var oktaSignIn = new OktaSignIn({
  baseUrl: 'https://acme.okta.com'
});

oktaSignIn.renderEl({
    el: '#sign-in-container',
    features: {
      rememberDevice: false,
    },
    labels: {
      'primaryauth.title': 'Partner login',
      'help': 'Click here for more help'
    },
    helpLinks: {
      'help': 'https://acme.com/custom/help'
    }
  },
  function (res) {
    if (res.status === 'SUCCESS') {
      // Success callback
      res.session.setCookieAndRedirect('https://acme.com/home');
    }
  },
  function (err) {
    // Error callback
    alert(err.message);
  });
~~~

##### Parameters

Name                  |   Type    |   Required    | Description
--------------------- | --------  | ------------  | -----------
options               | Object    | Yes           | Configuration options for the widget. `el` is required.
successCallback       | Function  | Yes           | Success callback to invoke on successful authentication.
failureCallback       | Function  | Yes           | Failure callback to invoke on unsuccessful authentication.

## Session Management

Manage your Okta session with session functions in the Sign-in widget SDK.

#### Check for an existing session

`.session.exists()` 

Check if there is an active session.

##### Example
~~~ javascript
oktaSignIn.session.exists(function (exists) {
  if (exists) {
    // There is an active session
  } else {
    // No active session found
  }
});
~~~

##### Parameters

Name                  |   Type    |   Required    | Description
--------------------- | --------  | ------------  | -----------
callback              | Function  | Yes           | Callback function. The function is passed a boolean value.

#### Get the session

`.session.get()` 

Get the active session information.

##### Example
~~~ javascript
oktaSignIn.session.get(function (res) {
  if (res.status !== 'INACTIVE') {
    /**
     * res.status - 'ACTIVE'
     * res.session - session object
     * res.user - user object
     */
  } else {
    // There is no active session. Show the login flow.
    oktaSignIn.renderEl(options, successFn, errorFn);
  }
});
~~~

##### Parameters

Name                  |   Type    |   Required    | Description
--------------------- | --------  | ------------  | -----------
callback              | Function  | Yes           | Callback function. The function is passed an object with status, session, user information if there is an active session and `{status: 'INACTIVE'}` if there is none.

#### Refresh the session

`.session.refresh()` 

Refresh the current session by extending its lifetime. This can be used as a keep-alive operation.

##### Example
~~~ javascript
oktaSignIn.session.refresh(function (res) {
  if (res.status === 'INACTIVE') {
    // There is no active session to refresh
  } else {
    // The session now has an extended lifetime
    
    /**
     * res.status - 'ACTIVE'
     * res.session - session object
     * res.user - user object
     */
  }
});
~~~

##### Parameters

Name                  |   Type    |   Required    | Description
--------------------- | --------  | ------------  | -----------
callback              | Function  | Yes           | Callback function. The function is passed an object with status, session, user information if there is an active session and `{status: 'INACTIVE'}` if there is none.

#### Close the session

`.session.close()` 

Close the active session. Same as `.signOut()`

##### Example
~~~ javascript
oktaSignIn.session.close(function () {
  // User is now logged out
});
~~~

##### Parameters

Name                  |   Type    |   Required    | Description
--------------------- | --------  | ------------  | -----------
callback              | Function  | Yes           | Callback function to invoke after closing the session. The function is invoked with an error message if the operation was not successful.

#### Sign-out the user

`.signOut()` 

Sign-out the current signed-in user. Shorthand for `.session.close()`

##### Example
~~~ javascript
oktaSignIn.signOut(function () {
  // User is now logged out
});
~~~

##### Parameters

Name                  |   Type    |   Required    | Description
--------------------- | --------  | ------------  | -----------
callback              | Function  | Yes           | Callback function to invoke after signing out the user. The function is invoked with an error message if the operation was not successful.

## Token Management

Manage your ID tokens with the Sign-in Widget SDK.

#### Refresh an id token

`.idToken.refresh()`
 
Refresh the `id_token` by extending its lifetime.

##### Example
~~~ javascript
oktaSignIn.idToken.refresh(token, function (newToken) {
  // New id_token with extended lifetime
});
~~~

##### Parameters

Name                  |   Type    |   Required    | Description
--------------------- | --------  | ------------  | -----------
token                 | String    | Yes           | `id_token` to refresh
callback              | Function  | Yes           | Callback function. The function is passed a new `id_token` if the operation was successful and an error message if it was not.
options               | Object    | No            | OIDC options
