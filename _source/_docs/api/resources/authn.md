---
layout: docs_page
title: Authentication API
redirect_from: "/docs/api/rest/authn.html"
---

## Overview

The Okta Authentication API provides operations to authenticate users, perform multi-factor enrollment and verification, recover forgotten passwords, and unlock accounts. It can be used as a standalone API to provide the identity layer on top of your existing application, or it can be integrated with the Okta [Sessions API](sessions.html) to obtain an Okta [session cookie](/docs/examples/session_cookie.html) and access apps within Okta.

The API is targeted for developers who want to build their own end-to-end login experience to replace the built-in Okta login experience and addresses the following key scenarios:

- **Primary authentication** allows you to verify username and password credentials for a user.

- **Multifactor authentication** (MFA) strengthens the security of password-based authentication by requiring additional verification of another factor such as a temporary one-time password or an SMS passcode. The Authentication API supports user enrollment with MFA factors enabled by the administrator, as well as MFA challenges based on your **Okta Sign-On Policy**.

- **Recovery** allows users to securely reset their password if they've forgotten it, or unlock their account if it has been locked out due to excessive failed login attempts. This functionality is subject to the security policy set by the administrator.

> The [Okta Sign-In Widget](/docs/guides/okta_sign-in_widget.html) is built on this API and is recommended for quick integration if you don't have advanced use cases

### Application Types

The behavior of the Okta Authentication API varies depending on the type of your application and your org's security policies such as the **Okta Sign-On Policy**, **MFA Enrollment Policy**, or **Password Policy**.

> Policy evaluation is conditional on the [client request context](../getting_started/design_principles.html#client-request-context) such as IP address.

#### Public Application

Public applications are any application that anonymously start an authentication or recovery transaction without an API token such as the [Okta Sign-In Widget](/docs/guides/okta_sign-in_widget.html).  Public applications are aggressively rate-limited to prevent abuse and require primary authentication to be successfully completed before releasing any metadata about a user.

#### Trusted Application

Trusted applications are backend applications that act as authentication broker or login portal for your Okta organization and may start an authentication or recovery transaction with an administrator API token.  Trusted apps  may implement their own recovery flows and primary authentication process and may receive additional metadata about the user before primary authentication has successfully completed.

> Trusted web applications may need to override [client request context](../getting_started/design_principles.html#client-request-context) to forward the originating client context for the user.

## Transaction Model

The Authentication API is a *stateful* API that implements a finite state machine with [defined states](#transaction-state) and transitions.  Each authentication or recovery transaction is issued a unique [state token](#state-token) that must be passed with each subsequent request until the transaction is complete or canceled.

The Authentication API leverages the [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06) format to publish `next` and `prev` links for the current transaction state which should be used to transition the state machine.

### Authentication Transaction Model

|---------------+--------------------------------------------------------------------------------------------------------+----------------------------------------------------------------+----------+----------+-----------+-----------+------------|
| Property      | Description                                                                                            | DataType                                                       | Nullable | Readonly | MinLength | MaxLength | Validation |
| ------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | -------- | -------- | --------- | --------- | ---------- |
| stateToken    | ephemeral [token](#state-token) that encodes the current state of an authentication transaction        | String                                                         | TRUE     | TRUE     |           |           |            |
| sessionToken  | ephemeral [one-time token](#session-token) used to bootstrap an Okta session                           | String                                                         | TRUE     | TRUE     |           |           |            |
| expiresAt     | lifetime of the `stateToken` or `sessionToken` (See [Tokens](#tokens))                                 | Date                                                           | TRUE     | TRUE     |           |           |            |
| status        | current [state](#transaction-state) of the authentication transaction                                  | [Transaction State](#transaction-state)                        | FALSE    | TRUE     |           |           |            |
| relayState    | optional opaque value that is persisted for the lifetime of the authentication transaction             | String                                                         | TRUE     | TRUE     |           | 2048      |            |
| factorResult  | optional status of last verification attempt for a given factor                                        | [Factor Result](#factor-result)                                | TRUE     | TRUE     |           |           |            |
| _embedded     | [embedded resources](#embedded-resources) for the current `status`                                     | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06) | TRUE     | TRUE     |           |           |            |
| _links        | [link relations](#links-object) for the current `status`                                               | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06) | TRUE     | TRUE     |           |           |            |
|---------------+--------------------------------------------------------------------------------------------------------+----------------------------------------------------------------+----------+----------+-----------+-----------+------------|

> The `relayState` paramater is an opaque value for the transaction and processed as untrusted data which is just echoed in a response.  It is the client's responsibility to escape/encode this value before displaying in a UI such as a HTML document using [best-practices](https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet)

### Recovery Transaction Model

|---------------+--------------------------------------------------------------------------------------------------------+----------------------------------------------------------------+----------+----------+-----------+-----------+------------|
| Property      | Description                                                                                            | DataType                                                       | Nullable | Readonly | MinLength | MaxLength | Validation |
| ------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | -------- | -------- | --------- | --------- | ---------- |
| stateToken    | ephemeral [token](#state-token) that encodes the current state of a recovery transaction               | String                                                         | TRUE     | TRUE     |           |           |            |
| recoveryToken | ephemeral [one-time token](#recovery-token) for recovery transaction to be distributed to the end-user | String                                                         | TRUE     | TRUE     |           |           |            |
| expiresAt     | lifetime of the `stateToken` or `recoveryToken` (See [Tokens](#tokens))                                | Date                                                           | TRUE     | TRUE     |           |           |            |
| status        | current [state](#transaction-state) of the recovery transaction                                        | [Transaction State](#transaction-state)                        | FALSE    | TRUE     |           |           |            |
| relayState    | optional opaque value that is persisted for the lifetime of the recovery transaction                   | String                                                         | TRUE     | TRUE     |           | 2048      |            |
| factorType    | type of selected factor for the recovery transaction                                                   | `EMAIL` or `SMS`                                               | FALSE    | TRUE     |           |           |            |
| recoveryType  | type of recovery operation                                                                             | `PASSWORD` or `UNLOCK`                                         | FALSE    | TRUE     |           |           |            |
| factorResult  | optional status of last verification attempt for the `factorType`                                      | [Factor Result](#factor-result)                                | TRUE     | TRUE     |           |           |            |
| _embedded     | [embedded resources](#embedded-resources) for the current `status`                                     | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06) | TRUE     | TRUE     |           |           |            |
| _links        | [link relations](#links-object) for the current `status`                                               | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06) | TRUE     | TRUE     |           |           |            |
|---------------+--------------------------------------------------------------------------------------------------------+----------------------------------------------------------------+----------+----------+-----------+-----------+------------|

> The `relayState` paramater is an opaque value for the transaction and processed as untrusted data which is just echoed in a response.  It is the client's responsibility to escape/encode this value before displaying in a UI such as a HTML document using [best-practices](https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet)

### Transaction State

![State Model Diagram](/assets/img/auth-state-model.png "State Model Diagram")

An authentication or recovery transaction has one of the following states:

|-----------------------+----------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------|
| Value                 | Description                                                                                  | Next Action                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------|
| `PASSWORD_WARN`       | The user's password was successfully validated but is about to expire and should be changed. | POST to the `next` link relation to [change the user's password](#change-password).                            |
| `PASSWORD_EXPIRED`    | The user's password was successfully validated but is expired.                               | POST to the `next` link relation to [change the user's expired password](#change-password).                    |
| `RECOVERY`            | The user has requested a recovery token to reset their password or unlock their account.     | POST to the `next` link relation to [answer the user's recovery question](#answer-recovery-question).          |
| `RECOVERY_CHALLENGE`  | The user must verify the factor-specific recovery challenge.                                 | POST to the `verify` link relation to [verify the recovery factor](#verify-recovery-factor).                   |
| `PASSWORD_RESET`      | The user successfully answered their recovery question and must to set a new password.       | POST to the `next` link relation to [reset the user's password](#reset-password).                              |
| `LOCKED_OUT`          | The user account is locked; self-service unlock or admin unlock is required.                 | POST to the `unlock` link relation to perform a [self-service unlock](#unlock-account).                        |
| `MFA_ENROLL`          | The user must select and enroll an available factor for additional verification.             | POST to the `enroll` link relation for a specific factor to [enroll the factor](#enroll-factor).               |
| `MFA_ENROLL_ACTIVATE` | The user must activate the factor to complete enrollment.                                    | POST to the `next` link relation to [activate the factor](#activate-factor).                                   |
| `MFA_REQUIRED`        | The user must provide additional verification with a previously enrolled factor.             | POST to the `verify` link relation for a specific factor to [provide additional verification](#verify-factor). |
| `MFA_CHALLENGE`       | The user must verify the factor-specific challenge.                                          | POST to the `verify` link relation to [verify the factor](#verify-factor).                                     |
| `SUCCESS`             | The transaction has completed successfully                                                   |                                                                                                                |
|-----------------------+----------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------|

You advance the authentication or recovery transaction to the next state by posting a request with a valid [state token](#state-token) to the the `next` link relation published in the [JSON HAL links object](#links-object) for the response.

[Enrolling a factor](#enroll-factor) and [verifying a factor](#verify-factor) do not have `next` link relationships as the end-user must make a selection of which factor to enroll or verify.

> You should never assume a specific state transition or URL when navigating the [state model](#transaction-state).  Always inspect the response for `status` and dynamically follow the [published link relations](#links-object).

~~~json
{
  "_links": {
    "next": {
      "name": "activate",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/ostf2xjtDKWFPZIKYDZV/lifecycle/activate",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "skip": {
      "href": "https://your-domain.okta.com/api/v1/authn/skip",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

### Tokens

Authentication API operations will return different token types depending on the [state](#transaction-state) of the authentication or recovery transaction.

#### State Token

Ephemeral token that encodes the current state of an authentication or recovery transaction.

- The `stateToken` must be passed with every request except when verifying a `recoveryToken` that was distributed out-of-band
- The `stateToken` is only intended to be used between the web application performing end-user authentication and the Okta API. It should never distributed to the end-user via email or other out-of-band mechanism.
- The lifetime of the `stateToken` uses a sliding scale expiration algorithm that extends with every request.  Always introspect the `expiresAt` property for the transaction when making decisions based on lifetime.

> All Authentication API operations will return `401 Unauthorized` status code when you attempt to use an expired state token.

~~~http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "errorCode": "E0000011",
  "errorSummary": "Invalid token provided",
  "errorLink": "E0000011",
  "errorId": "oaeY-4G_TBUTBSZAn9n7oZCfw",
  "errorCauses": []
}
~~~

> State transitions are strictly enforced for state tokens.  You will receive a `403 Forbidden` status code if you call an Authentication API operation with a `stateToken` with an invalid [state](#transaction-state).

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "errorCode": "E0000079",
  "errorSummary": "This operation is not allowed in the current authentication state.",
  "errorLink": "E0000079",
  "errorId": "oaen9Ly_ivHQJ-STb8KiADh9w",
  "errorCauses": [
    {
      "errorSummary": "This operation is not allowed in the current authentication state."
    }
  ]
}
~~~

#### Recovery Token

One-time token issued as `recoveryToken` response parameter when a recovery transaction transitions to the `RECOVERY` status.

- The token can be exchanged for a `stateToken` to recover a user's password or unlock their account.
- Unlike the `statusToken` the `recoveryToken` should be distributed out-of-band to a user such as via email.
- The lifetime of the `recoveryToken` is managed by the organization's security policy.

The `recoveryToken` is sent via an out-of-band channel to the end-user's verified email address or SMS phone number and acts as primary authentication for the recovery transaction.

> Directly obtaining a `recoveryToken` is a highly privileged operation and should be restricted to trusted web applications.  Anyone that obtains a `recoveryToken` for a user and knows the answer to a user's recovery question can reset their password or unlock their account.

#### Session Token

One-time token issued as `sessionToken` response parameter when an authentication transaction completes with the `SUCCESS` status.

- The token can be exchanged for a session with the [Session API](sessions.html#create-session-with-session-token) or converted to a [session cookie](/docs/examples/session_cookie.html).
- The lifetime of the `sessionToken` is the same as the lifetime of a user's session and managed by the organization's security policy.

### Factor Result

The `MFA_CHALLENGE` or `RECOVERY_CHALLENGE` state can return an additional property **factorResult** that provides additional context for the last factor verification attempt.

The following table shows the possible values for this property:

|------------------------+-------------------------------------------------------------------------------------------------------------------------------------|
| factorResult           | Description                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------|
| `WAITING`              | Factor verification has started but not yet completed (e.g user hasn't answered phone call yet)                                     |
| `CANCELLED`            | Factor verification was canceled by user                                                                                            |
| `TIMEOUT`              | Unable to verify factor within the allowed time window                                                                              |
| `TIME_WINDOW_EXCEEDED` | Factor was successfully verified but outside of the computed time window.  Another verification is required in current time window. |
| `PASSCODE_REPLAYED`    | Factor was previously verified within the same time window.  User must wait another time window and retry with a new verification.  |
| `ERROR`                | Unexpected server error occurred verifying factor.                                                                                  |
|------------------------+-------------------------------------------------------------------------------------------------------------------------------------|

### Links Object

Specifies link relations (See [Web Linking](http://tools.ietf.org/html/rfc5988)) available for the current [transaction state](#transaction-state) using the [JSON Hypertext Application Language](http://tools.ietf.org/html/draft-kelly-json-hal-06) specification.  These links are used to transition the [state machine](#transaction-state) of the authentication or recovery transaction.

|--------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Link Relation Type | Description                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| next               | Transitions the  [state machine](#transaction-state) to the next state.  **Note: The `name` of the link relationship will provide a hint of the next operation required** |
| prev               | Transitions the  [state machine](#transaction-state) to the previous state.                                                                                               |
| cancel             | Cancels the current  transaction and revokes the [state token](#state-token).                                                                                             |
| skip               | Skips over the current  transaction state to the next valid [state](#transaction-state)                                                                                   |
| resend             | Resends a challenge or OTP to a device                                                                                                                                    |
|--------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

> The Links Object is **read-only**

## Embedded Resources

### User Object

A subset of [user properties](users.html#user-model) published in an authentication or recovery transaction after the user successfully completes primary authentication.

|-------------------+---------------------------------------------+-------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|
| Property          | Description                                 | DataType                                              | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ----------------- | ------------------------------------------- | ----------------------------------------------------- | -------- | ------ | -------- | --------- | ----------| ---------- |
| id                | unique key for user                         | String                                                | FALSE    | TRUE   | TRUE     |           |           |            |
| passwordChanged   | timestamp when user's password last changed | Date                                                  | TRUE     | FALSE  | TRUE     |           |           |            |
| profile           | user's profile                              | [User Profile Object](#user-profile-object)           | FALSE    | FALSE  | TRUE     |           |           |            |
| recovery_question | user's recovery question                    | [Recovery Question Object](#recovery-question-object) | TRUE     | FALSE  | TRUE     |           |           |            |
|-------------------+---------------------------------------------+-------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|

~~~json
{
 "id": "00udnlQDVLVRIVXESCMZ",
 "passwordChanged": "2015-09-08T20:14:45.000Z",
 "profile": {
    "login": "dade.murphy@example.com",
    "firstName":"Dade",
    "lastName": "Murphy",
    "locale": "en_US",
    "timeZone": "America/Los_Angeles"
 },
 "recovery_question": {
    "question": "Who's a major player in the cowboy scene?"
  }
}
~~~

#### User Profile Object

Subset of [profile properties](users.html#profile-object) for a user

|-----------+------------------------------------------------------------------------------------------------------------------------------+----------+----------+--------+----------+-----------+-----------+-----------------------------------------------------------------------|
| Property  | Description                                                                                                                  | DataType | Nullable | Unique | Readonly | MinLength | MaxLength | Validation                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------| -------- | ------ | -------- | --------- | --------- | --------------------------------------------------------------------- |
| login  | unique login for user                                                                                                     | String   | FALSE    | TRUE   | TRUE     |           |           |                                                                       |
| firstName | first name of user                                                                                                           | String   | FALSE    | FALSE  | TRUE     |           |           |                                                                       |
| lastName  | last name of user                                                                                                            | String   | FALSE    | FALSE  | TRUE     |           |           |                                                                       |
| locale    | user's default location for purposes of localizing items such as currency, date time format, numerical representations, etc. | String   | TRUE     | FALSE  | TRUE     |           |           | [RFC 5646](https://tools.ietf.org/html/rfc5646)                       |
| timeZone  | user's time zone                                                                                                             | String   | TRUE     | FALSE  | TRUE     |           |           | [IANA Time Zone database format](https://tools.ietf.org/html/rfc6557) |
|-----------+------------------------------------------------------------------------------------------------------------------------------+----------+----------+--------+----------+-----------+-----------+-----------------------------------------------------------------------|

#### Recovery Question Object

User's recovery question used for verification of a recovery transaction

|-------------------+--------------------------+ ---------+----------+--------+----------|-----------+-----------+------------|
| Property          | Description              | DataType | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ----------------- | ------------------------ | -------- | -------- | ------ | -------- | --------- | --------- | ---------- |
| question          | user's recovery question | String   | FALSE    | TRUE   | TRUE     |           |           |            |
|-------------------+--------------------------+ ---------+----------+--------+----------|-----------+-----------+------------|

### Password Policy Object

A subset of policy settings for the user's assigned password policy published during `PASSWORD_WARN`, `PASSWORD_EXPIRED`, or `PASSWORD_RESET` states

|------------+------------------------------+-----------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|
| Property   | Description                  | DataType                                                  | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ---------- | ---------------------------- | --------------------------------------------------------- | -------- | ------ | -------- | --------- | ----------| ---------- |
| expiration | password expiration settings | [Password Expiration Object](#password-expiration-object) | TRUE     | FALSE  | TRUE     |           |           |            |
| complexity | password complexity settings | [Password Complexity Object](#password-complexity-object) | FALSE    | FALSE  | TRUE     |           |           |            |
|------------+------------------------------+-----------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|

~~~json
{
  "expiration":{
    "passwordExpireDays": 0
  }, 
  "complexity": {
    "minLength": 8, 
    "minLowerCase": 1, 
    "minUpperCase": 1, 
    "minNumber": 1, 
    "minSymbol": 0, 
    "excludeUsername": "true"
    }, 
   "age":{
     "minAgeMinutes":0, 
     "historyCount":0 
    } 
}
~~~

#### Password Expiration Object

Specifies the password age requirements of the assigned password policy

|--------------------+-------------------------------------------+----------+----------+--------+----------+-----------+-----------+------------|
| Property           | Description                               | DataType | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ------------------ | ----------------------------------------- | -------- | -------- | ------ | -------- | --------- | ----------| ---------- |
| passwordExpireDays | number of days before password is expired | Number   | FALSE    | FALSE  | TRUE     |           |           |            |
|--------------------+-------------------------------------------+----------+----------+--------+----------+-----------+-----------+------------|

#### Password Complexity Object

Specifies the password complexity requirements of the assigned password policy

|--------------+------------------------------------------------------+----------+----------+--------+----------+-----------+-----------+------------|
| Property     | Description                                          | DataType | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ------------ | ---------------------------------------------------- | -------- | -------- | ------ | -------- | --------- | ----------| ---------- |
| minLength    | minimum number of characters for password            | Number   | FALSE    | FALSE  | TRUE     |           |           |            |
| minLowerCase | minimum number of lower case characters for password | Number   | FALSE    | FALSE  | TRUE     |           |           |            |
| minUpperCase | minimum number of upper case characters for password | Number   | FALSE    | FALSE  | TRUE     |           |           |            |
| minNumber    | minimum number of numeric characters for password    | Number   | FALSE    | FALSE  | TRUE     |           |           |            |
| minSymbol    | minimum number of symbol characters for password     | Number   | FALSE    | FALSE  | TRUE     |           |           |            |
| excludeUsername    | Prevents username from appearing in the password     | boolean   | FALSE    | FALSE  | TRUE     |           |           |            |
|--------------+------------------------------------------------------+----------+----------+--------+----------+-----------+-----------+------------|

#### Password Age Object

Specifies the password requirements related to password age and history

|--------------+------------------------------------------------------+----------+----------+--------+----------+-----------+-----------+------------|
| Property     | Description                                          | DataType | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ------------ | ---------------------------------------------------- | -------- | -------- | ------ | -------- | --------- | ----------| ---------- |
| minAgeMinutes    | minimum number of minutes required since the last password change            | Number   | FALSE    | FALSE  | TRUE     |           |           |            |
| historyCount |Number of previous passwords that the current password can't match | Number   | FALSE    | FALSE  | TRUE     |           |           |            |
|--------------+------------------------------------------------------+----------+----------+--------+----------+-----------+-----------+------------|

### Factor Object

A subset of [factor properties](factors.html#factor-model) published in an authentication transaction during `MFA_ENROLL`, `MFA_REQUIRED`, or `MFA_CHALLENGE` states

|----------------+-------------------------------------------------------------------------------+----------------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|
| Property       | Description                                                                   | DataType                                                       | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| -------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- | -------- | ------ | ---------| --------- | --------- | ---------- |
| id             | unique key for factor                                                         | String                                                         | TRUE     | TRUE   | TRUE     |           |           |            |
| factorType     | type of factor                                                                | [Factor Type](factors.html#factor-type)                        | FALSE    | TRUE   | TRUE     |           |           |            |
| provider       | factor provider                                                               | [Provider Type](factors.html#provider-type)                    | FALSE    | TRUE   | TRUE     |           |           |            |
| profile        | profile of a [supported factor](factors.html#supported-factors-for-providers) | [Factor Profile Object](factors.html#factor-profile-object)    | TRUE     | FALSE  | TRUE     |           |           |            |
| _embedded      | [embedded resources](#factor-embedded-resources) related to the factor        | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06) | TRUE     | FALSE  | TRUE     |           |           |            |
| _links         | [discoverable resources](#factor-links-object) for the factor                 | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06) | TRUE     | FALSE  | TRUE     |           |           |            |
|----------------+-------------------------------------------------------------------------------+----------------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|

~~~json
{
  "id": "ostfm3hPNYSOIOIVTQWY",
  "factorType": "token:software:totp",
  "provider": "OKTA",
  "profile": {
    "credentialId": "dade.murphy@example.com"
  },
  "_links": {
    "verify": {
      "href": "https://your-domain.okta.com/api/v1/authn/factors/ostfm3hPNYSOIOIVTQWY/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

#### Factor Embedded Resources

##### TOTP Factor Activation Object

TOTP factors when activated have an embedded verification object which describes the [TOTP](http://tools.ietf.org/html/rfc6238) algorithm parameters.

|----------------+---------------------------------------------------+----------------------------------------------------------------+----------|--------|----------|-----------|-----------+------------|
| Property       | Description                                       | DataType                                                       | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------- | -------- | ------ | -------- | --------- | --------- | ---------- |
| timeStep       | time-step size for TOTP                           | String                                                         | FALSE    | FALSE  | TRUE     |           |           |            |
| sharedSecret   | unique secret key for prover                      | String                                                         | FALSE    | FALSE  | TRUE     |           |           |            |
| encoding       | encoding of `sharedSecret`                        | `base32` or `base64`                                           | FALSE    | FALSE  | TRUE     |           |           |            |
| keyLength      | number of digits in an TOTP value                 | Number                                                         | FALSE    | FALSE  | TRUE     |           |           |            |
| _links         | discoverable resources related to the activation  | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06) | TRUE     | FALSE  | TRUE     |           |           |            |
|----------------+---------------------------------------------------+----------------------------------------------------------------+----------|--------|----------|-----------|-----------+------------|

~~~ json
{
  "activation": {
    "timeStep": 30,
    "sharedSecret": "HE64TMLL2IUZW2ZLB",
    "encoding": "base32",
    "keyLength": 6
  }
}
~~~

###### TOTP Activation Links Object

Specifies link relations (See [Web Linking](http://tools.ietf.org/html/rfc5988)) available for the TOTP activation object using the [JSON Hypertext Application Language](http://tools.ietf.org/html/draft-kelly-json-hal-06) specification.  This object is used for dynamic discovery of related resources and operations.

|--------------------+--------------------------------------------------------------------------|
| Link Relation Type | Description                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| qrcode             | QR code that encodes the TOTP parameters that can be used for enrollment |
|--------------------+--------------------------------------------------------------------------|

##### Phone Object

The phone object describes previously enrolled phone numbers for the `sms` factor.

|---------------+----------------------+-----------------------------------------------+----------+--------+----------+-----------+-----------+------------|
| Property      | Description          | DataType                                      | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ------------- | -------------------- | --------------------------------------------- | -------- | ------ | -------- | --------- | --------- | ---------- |
| id            | unique key for phone | String                                        | FALSE    | TRUE   | TRUE     |           |           |            |
| profile       | profile of phone     | [Phone Profile Object](#phone-profile-object) | FALSE    | FALSE  | TRUE     |           |           |            |
| status        | status of phone      | `ACTIVE` or `INACTIVE`                        | FALSE    | FALSE  | TRUE     |           |           |            |
|---------------+----------------------+-----------------------------------------------+----------+--------+----------+-----------+-----------+------------|

~~~json
{
    "id": "mbl198rKSEWOSKRIVIFT",
    "profile": {
        "phoneNumber": "+1 XXX-XXX-1337"
    },
    "status": "ACTIVE"
}
~~~

###### Phone Profile Object

|---------------+----------------------|----------+----------|--------|----------|-----------|-----------+------------|
| Property      | Description          | DataType | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ------------- | -------------------- | ---------| -------- | ------ | -------- | --------- | --------- | ---------- |
| phoneNumber   | masked phone number  | String   | FALSE    | FALSE  | TRUE     |           |           |            |
|---------------+----------------------|----------+----------|--------|----------|-----------|-----------+------------|


##### Phone Object

The phone object describes previously enrolled phone numbers for the `sms` factor.

|---------------+----------------------+-----------------------------------------------+----------+--------+----------+-----------+-----------+------------|
| Property      | Description          | DataType                                      | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ------------- | -------------------- | --------------------------------------------- | -------- | ------ | -------- | --------- | --------- | ---------- |
| id            | unique key for phone | String                                        | FALSE    | TRUE   | TRUE     |           |           |            |
| profile       | profile of phone     | [Phone Profile Object](#phone-profile-object) | FALSE    | FALSE  | TRUE     |           |           |            |
| status        | status of phone      | `ACTIVE` or `INACTIVE`                        | FALSE    | FALSE  | TRUE     |           |           |            |
|---------------+----------------------+-----------------------------------------------+----------+--------+----------+-----------+-----------+------------|

##### Push Factor Activation Object

Push factors must complete activation on the device by scanning the QR code or visiting activation link sent via email or sms.

|----------------+---------------------------------------------------+----------------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|
| Property       | Description                                       | DataType                                                       | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------- | -------- | ------ | -------- | --------- | --------- | ---------- |
| expiresAt      | lifetime of activation                            | Date                                                           | FALSE    | FALSE  | TRUE     |           |           |            |
| _links         | discoverable resources related to the activation  | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06) | FALSE    | FALSE  | TRUE     |           |           |            |
|----------------+---------------------------------------------------+----------------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|

~~~json
{
  "activation": {
    "expiresAt": "2015-11-13T07:44:22.000Z",
    "_links": {
      "send": [
        {
          "name": "email",
          "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfbtzzrjgwauUsxO0g4/lifecycle/activate/email",
          "hints": {
            "allow": [
              "POST"
            ]
          }
        },
        {
          "name": "sms",
          "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfbtzzrjgwauUsxO0g4/lifecycle/activate/sms",
          "hints": {
            "allow": [
              "POST"
            ]
          }
        }
      ],
      "qrcode": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfbtzzrjgwauUsxO0g4/qr/00Ji8qVBNJD4LmjYy1WZO2VbNqvvPdaCVua-1qjypa",
        "type": "image/png"
      }
    }
  }
}
~~~

###### Push Factor Activation Links Object

Specifies link relations (See [Web Linking](http://tools.ietf.org/html/rfc5988)) available for the push factor activation object using the [JSON Hypertext Application Language](http://tools.ietf.org/html/draft-kelly-json-hal-06) specification.  This object is used for dynamic discovery of related resources and operations.

|--------------------+------------------------------------------------------------------------------------|
| Link Relation Type | Description                                                                        |
| ------------------ | ---------------------------------------------------------------------------------- |
| qrcode             | QR code that encodes the push activation code needed for enrollment on the device  |
| send               | Sends an activation link via `email` or `sms` for users who can't scan the QR code |
|--------------------+------------------------------------------------------------------------------------|

##### Factor Links Object

Specifies link relations (See [Web Linking](http://tools.ietf.org/html/rfc5988)) available for the factor using the [JSON Hypertext Application Language](http://tools.ietf.org/html/draft-kelly-json-hal-06) specification.  This object is used for dynamic discovery of related resources and operations.

|--------------------+--------------------------------------------------------------|
| Link Relation Type | Description                                                  |
| ------------------ | -------------------------------------------------------------|
| enroll             | [Enrolls a factor](#enroll-factor)                           |
| verify             | [Verifies a factor](#verify-factor)                          |
| questions          | Lists all possible questions for the `question` factor type  |
| resend             | Resends a challenge or OTP to a device                       |
|--------------------+--------------------------------------------------------------|

> The Links Object is **read-only**

## Authentication Operations

### Primary Authentication
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn

Every authentication transaction starts with primary authentication which validates a user's primary password credential.  **Password Policy**, **MFA Policy**,  and **Sign-On Policy** is evaluated during primary authentication to determine if the user's password is expired, a factor should be enrolled, or additional verification is required.

The [transaction state](#transaction-state) of the response will depend on the user's status, group memberships and assigned policies.

- [Primary Authentication with Public Application](#primary-authentication-with-public-application)
- [Primary Authentication with Trusted Application](#primary-authentication-with-trusted-application)
- [Primary Authentication with Password Expiration Warn](#primary-authentication-with-password-expiration-warn)

> You must first enable MFA factors and assign a valid **Sign-On Policy** to a user to enroll and/or verify a MFA factor during authentication

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter   | Description                                                                                                      | Param Type | DataType                          | Required | Default | MaxLength
----------- | ---------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------- | -------- | ------- | ---------
username    | User's non-qualified short-name (e.g. dade.murphy) or unique fully-qualified login (e.g dade.murphy@example.com) | Body       | String                            | TRUE     |         |
password    | User's password credential                                                                                       | Body       | String                            | TRUE     |         |
relayState  | Optional state value that is persisted for the lifetime of the authentication transaction                        | Body       | String                            | FALSE    |         | 2048
options     | Opt-in features for the authentication transaction                                                               | Body       | [Options Object](#options-object) | FALSE    |         |
context     | Provides additional context for the authentication transaction                                                   | Body       | [Context Object](#context-object) | FALSE    |         |

##### Options Object

The authentication transaction [state machine](#transaction-state) can be modified via the following opt-in features:

|----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+----------+--------+----------+-----------+-----------+------------|
| Property                   | Description                                                                                                                                                | DataType | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | ------ | -------- | --------- | --------- | ---------- |
| multiOptionalFactorEnroll  | Transitions transaction back to `MFA_ENROLL` state after successful factor enrollment when additional optional factors are available for enrollment        | Boolean  | TRUE     | FALSE  | FALSE    |           |           |            |
| warnBeforePasswordExpired  | Transitions transaction to `PASSWORD_WARN` state before `SUCCESS` if the user's password is about to expire and within their password policy warn period   | Boolean  | TRUE     | FALSE  | FALSE    |           |           |            |
|----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+----------+--------+----------+-----------+-----------+------------|

##### Context Object

The context object allows [trusted web applications](#trusted-application) such as an external portal to pass additional context for the authentication or recovery transaction.

> Overriding context such as `deviceToken` is a highly privileged operation limited to trusted web applications and requires making authentication or recovery requests with a valid *administrator API token*.

|-------------+-------------------------------------------------------------------------+----------+----------+--------+----------+-----------+-----------+------------|
| Property    | Description                                                             | DataType | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ----------- | ----------------------------------------------------------------------- | -------- | -------- | ------ | -------- | --------- | --------- | ---------- |
| deviceToken | A globally unique ID identifying the user's client device or user agent | String   | TRUE     | FALSE  | FALSE    |           | 32        |            |
|-------------+-------------------------------------------------------------------------+----------+----------+--------+----------+-----------+-----------+------------|

> You must always pass the same `deviceToken` for a user's device with every authentication request for **per-device** or **per-session** Sign-On Policy factor challenges.  If the `deviceToken` is absent or does not match the previous `deviceToken`, the user will be challenged every-time instead of **per-device** or **per-session**.

It is recommend that you generate a UUID or GUID for each client and persist the `deviceToken` as a persistent cookie or HTML5 localStorage item scoped to your web application's origin.

#### Response Parameters
{:.api .api-response .api-response-params}

[Authentication Transaction Object](#authentication-transaction-model) with the current [state](#transaction-state) for the authentication transaction.

`401 Unauthorized` status code is returned for requests with invalid credentials or locked out accounts

~~~http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "errorCode": "E0000004",
  "errorSummary": "Authentication failed",
  "errorLink": "E0000004",
  "errorId": "oaeuHRrvMnuRga5UzpKIOhKpQ",
  "errorCauses": []
}
~~~

`403 Forbidden` status code is returned for requests with valid credentials but the user is denied access via **Sign-On Policy** or **MFA Policy**.

> Ensure the user is assigned to a valid **MFA Policy** if additional verification is required in the user's **Sign-On Policy**

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
    "errorCode": "E0000085",
    "errorSummary": "You do not have permission to access your account at this time.",
    "errorLink": "E0000085",
    "errorId": "oaeLngBsntPSj2IVcrEWcAZSA",
    "errorCauses": []
}
~~~

`429 Too Many Requests` status code may be returned when the rate-limit is exceeded

> Authentication requests are aggressively rate-limited (e.g. 1 request per username/per second) for security purposes.

~~~http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-Rate-Limit-Limit: 1
X-Rate-Limit-Remaining: 0
X-Rate-Limit-Reset: 1447534590

{
    "errorCode": "E0000047",
    "errorSummary": "API call exceeded rate limit due to too many requests.",
    "errorLink": "E0000047",
    "errorId": "oaeWaNHfOyQSES34-a2Dw6Phw",
    "errorCauses": []
}
~~~

#### Primary Authentication with Public Application

Authenticates a user with username/password credentials via a [public application](#public-application)

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "username": "dade.murphy@example.com",
  "password": "correcthorsebatterystaple",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "options": {
    "multiOptionalFactorEnroll": false,
    "warnBeforePasswordExpired": false
  }
}' "https://${org}.okta.com/api/v1/authn"
~~~

##### Response Example (Success)
{:.api .api-response .api-response-example}

Users with a valid password not assigned to a **Sign-On Policy** with additional verification requirements will successfully complete the authentication transaction.

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00Fpzf4en68pCXTsMjcX8JPMctzN2Wiw4LDOBL_9pe",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

##### Response Example (Invalid Credentials)
{:.api .api-response .api-response-example}

Primary authentication requests with an invalid `username` or `password` fail with a `401 Unauthorized` error.

~~~http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "errorCode": "E0000004",
  "errorSummary": "Authentication failed",
  "errorLink": "E0000004",
  "errorId": "oaeuHRrvMnuRga5UzpKIOhKpQ",
  "errorCauses": []
}
~~~

##### Response Example (Access Denied)
{:.api .api-response .api-response-example}

Primary authentication request has valid credentials but the user is denied access via  **Sign-On Policy** or **MFA Policy** with `403 Forbidden` error.

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
    "errorCode": "E0000085",
    "errorSummary": "You do not have permission to access your account at this time.",
    "errorLink": "E0000085",
    "errorId": "oaeLngBsntPSj2IVcrEWcAZSA",
    "errorCauses": []
}
~~~

##### Response Example (Locked Out)
{:.api .api-response .api-response-example}

Primary authentication requests for a user with `LOCKED_OUT` status is conditional on the user's password policy.  Password policies define whether to hide or show  lockout failures which disclose a valid user identifier to the caller.

###### Hide Lockout Failures (Default)

If the user's password policy is configure to **hide lockout failures**, a `401 Unauthorized` error is returned preventing information disclosure of a valid user identifier.

~~~http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "errorCode": "E0000004",
  "errorSummary": "Authentication failed",
  "errorLink": "E0000004",
  "errorId": "oaeuHRrvMnuRga5UzpKIOhKpQ",
  "errorCauses": []
}
~~~

###### Show Lockout Failures

If the user's password policy is configure to **show lockout failures**, the authentication transaction completes with `LOCKED_OUT` status.

~~~json
{
  "status": "LOCKED_OUT",
  "_links": {
    "next": {
      "name": "unlock",
      "href": "https://your-domain.okta.com/api/v1/authn/recovery/unlock",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

##### Response Example (Expired Password)
{:.api .api-response .api-response-example}

User must [change their expired password](#change-password) to complete the authentication transaction.

> Users will be challenged for MFA (`MFA_REQUIRED`) before `PASSWORD_EXPIRED` if they have an active factor enrollment

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "PASSWORD_EXPIRED",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "policy": {
      "complexity": {
        "minLength": 8,
        "minLowerCase": 1,
        "minUpperCase": 1,
        "minNumber": 1,
        "minSymbol": 0
      }
    }
  },
  "_links": {
    "next": {
      "name": "changePassword",
      "href": "https://your-domain.okta.com/api/v1/authn/credentials/change_password",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

##### Response Example (Factor Challenge)
{:.api .api-response .api-response-example}

User is assigned to a **Sign-On Policy** that requires additional verification and must [select and verify](#verify-factor) a previously enrolled [factor](#factor-object) by `id` to complete the authentication transaction.

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_REQUIRED",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factors": [
      {
        "id": "rsalhpMQVYKHZKXZJQEW",
        "factorType": "token",
        "provider": "RSA",
        "profile": {
          "credentialId": "dade.murphy@example.com"
        },
        "_links": {
          "verify": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors/rsalhpMQVYKHZKXZJQEW/verify",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      },
      {
        "id": "ostfm3hPNYSOIOIVTQWY",
        "factorType": "token:software:totp",
        "provider": "OKTA",
        "profile": {
          "credentialId": "dade.murphy@example.com"
        },
        "_links": {
          "verify": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors/ostfm3hPNYSOIOIVTQWY/verify",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      },
      {
        "id": "sms193zUBEROPBNZKPPE",
        "factorType": "sms",
        "provider": "OKTA",
        "profile": {
          "phoneNumber": "+1 XXX-XXX-1337"
        },
        "_links": {
          "verify": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors/sms193zUBEROPBNZKPPE/verify",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      },
      {
        "id": "opf3hkfocI4JTLAju0g4",
        "factorType": "push",
        "provider": "OKTA",
        "profile": {
          "credentialId": "dade.murphy@example.com",
          "deviceType": "SmartPhone_IPhone",
          "name": "Gibson",
          "platform": "IOS",
          "version": "9.0"
        },
        "_links": {
          "verify": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors/opf3hkfocI4JTLAju0g4/verify",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      }
    ]
  },
  "_links": {
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

##### Response Example (Factor Enroll)
{:.api .api-response .api-response-example}

User is assigned to a **MFA Policy** that requires enrollment during sign-on and must [select a factor to enroll](#enroll-factor) to complete the authentication transaction.

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_ENROLL",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factors": [
      {
        "factorType": "token",
        "provider": "RSA",
        "_links": {
          "enroll": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      },
      {
        "factorType": "token:software:totp",
        "provider": "OKTA",
        "_links": {
          "enroll": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      },
      {
        "factorType": "sms",
        "provider": "OKTA",
        "_links": {
          "enroll": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      }
      {
        "factorType": "push",
        "provider": "OKTA",
        "_links": {
          "enroll": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      }
    ]
  },
  "_links": {
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

#### Primary Authentication with Trusted Application

Authenticates a user via a [trusted application](#trusted-application) or proxy that overrides [client request context](../getting_started/design_principles.html#client-request-context).

> Specifying your own `deviceToken` is a highly privileged operation limited to trusted web applications and requires making authentication requests with a valid *admin API token*.

> The **public IP address** of your [trusted application](#trusted-application) must be [whitelisted as a gateway IP address](../getting_started/design_principles.html#ip-address) to forward the user agent's original IP address with the `X-Forwarded-For` HTTP header

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36" \
-H "X-Forwarded-For: 23.235.46.133" \
-d '{
  "username": "dade.murphy@example.com",
  "password": "correcthorsebatterystaple",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "options": {
    "multiOptionalFactorEnroll": false,
    "warnBeforePasswordExpired": false
  },
  "context": {
    "deviceToken": "26q43Ak9Eh04p7H6Nnx0m69JqYOrfVBY"
  }
}' "https://${org}.okta.com/api/v1/authn"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00Fpzf4en68pCXTsMjcX8JPMctzN2Wiw4LDOBL_9pe",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

#### Primary Authentication with Password Expiration Warn

Authenticates a user with a password that is about to expire.  The user should [change their password](#change-password) to complete the authentication transaction but may opt-out (skip).

> The `warnBeforePasswordExpired` option must be explicitly specified as `true` to allow the authentication transaction to transition to `PASSWORD_WARN` status.<br>
> Non-expired passwords will successfully complete the authentication transaction if this option is omitted or `false`.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "username": "dade.murphy@example.com",
  "password": "correcthorsebatterystaple",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "options": {
    "multiOptionalFactorEnroll": false,
    "warnBeforePasswordExpired": true
  }
}' "https://${org}.okta.com/api/v1/authn"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "PASSWORD_WARN",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "policy": {
      "expiration": {
        "passwordExpireDays": 5
      },
      "complexity": {
        "minLength": 8,
        "minLowerCase": 1,
        "minUpperCase": 1,
        "minNumber": 1,
        "minSymbol": 0
      }
    }
  },
  "_links": {
    "next": {
      "name": "changePassword",
      "href": "https://your-domain.okta.com/api/v1/authn/credentials/change_password",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "skip": {
      "name": "skip",
      "href": "https://your-domain.okta.com/api/v1/authn/skip",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

### Change Password
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/credentials/change_password

This operation changes a user's password by providing the existing password and the new password password for authentication transactions with either the `PASSWORD_EXPIRED` or `PASSWORD_WARN` state.

- A user *must* change their expired password for an authentication transaction with `PASSWORD_EXPIRED` status to successfully complete the transaction.
- A user *may* opt-out of changing their password (skip) when the transaction has a `PASSWORD_WARN` status

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter   | Description                                                | Param Type | DataType  | Required | Default
----------- | ---------------------------------------------------------- | ---------- | --------- | -------- |
stateToken  | [state token](#state-token) for current transaction        | Body       | String    | TRUE     |
oldPassword | User's current password that is expired or about to expire | Body       | String    | TRUE     |
newPassword | New password for user                                      | Body       | String    | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

[Authentication Transaction Object](#authentication-transaction-model) with the current [state](#transaction-state) for the authentication transaction.

If the `oldPassword` is invalid you will receive a `403 Forbidden` status code with the following error:

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "errorCode": "E0000014",
  "errorSummary": "Update of credentials failed",
  "errorLink": "E0000014",
  "errorId": "oaeYx8fd_-VQdONMI5OYcqoqw",
  "errorCauses": [
    {
      "errorSummary": "oldPassword: The credentials provided were incorrect."
    }
  ]
}
~~~

If the `newPassword` does not meet password policy requirements, you will receive a `403 Forbidden` status code with the following error:

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "errorCode": "E0000014",
  "errorSummary": "The password does meet the complexity requirements of the current password policy.",
  "errorLink": "E0000014",
  "errorId": "oaeuNNAquYEQkWFnUVG86Abbw",
  "errorCauses": [
    {
      "errorSummary": "Passwords must have at least 8 characters, a lowercase letter, an uppercase letter, a number, no parts of your username"
    }
  ]
}
~~~

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "oldPassword": "correcthorsebatterystaple",
  "newPassword": "Ch-ch-ch-ch-Changes!"
}' "https://${org}.okta.com/api/v1/authn/credentials/change_password"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00Fpzf4en68pCXTsMjcX8JPMctzN2Wiw4LDOBL_9pe",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~


### Enroll Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/factors

Enrolls a user with a [factor](factors.html#supported-factors-for-providers) assigned by their **MFA Policy**.

- [Enroll Okta Security Question Factor](#enroll-okta-security-question-factor)
- [Enroll Okta SMS Factor](#enroll-okta-sms-factor)
- [Enroll Okta Verify TOTP Factor](#enroll-okta-verify-totp-factor)
- [Enroll Okta Verify Push Factor](#enroll-okta-verify-push-factor)
- [Enroll Google Authenticator Factor](#enroll-google-authenticator-factor)
- [Enroll RSA SecurID Factor](#enroll-rsa-securid-factor)
- [Enroll Symantec VIP Factor](#enroll-symantec-vip-factor)
- [Enroll YubiKey Factor](#enroll-yubikey-factor)
- [Enroll Duo Factor](#enroll-duo-factor)

> This operation is only available for users that have not previously enrolled a factor and have transitioned to the `MFA_ENROLL` [state](#transaction-state).

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter   | Description                                                                   | Param Type  | DataType                                                     | Required | Default
----------- | ----------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------| -------- | -------
stateToken  | [state token](#state-token) for current transaction                           | Body        | String                                                       | TRUE     |
factorType  | type of factor                                                                | Body        | [Factor Type](factors.html#factor-type)                      | TRUE     |
provider    | factor provider                                                               | Body        | [Provider Type](factors.html#provider-type)                  | TRUE     |
profile     | profile of a [supported factor](factors.html#supported-factors-for-providers) | Body        | [Factor Profile Object](factors.html#factor-profile-object)  | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

[Authentication Transaction Object](#authentication-transaction-model) with the current [state](#transaction-state) for the authentication transaction.

> Some [factor types](factors.html#factor-type) require [activation](#activate-factor) to complete the enrollment process.  The [authentication transaction](#transaction-state) will transition to `MFA_ENROLL_ACTIVATE` if a factor requires activation.

#### Enroll Okta Security Question Factor
{:.api .api-operation}

Enrolls a user with the Okta `question` factor and [question profile](factors.html#question-profile).

> Security Question factor does not require activation and is `ACTIVE` after enrollment

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "factorType": "question",
  "provider": "OKTA",
  "profile": {
    "question": "disliked_food",
    "answer": "mayonnaise"
  }
}' "https://${org}.okta.com/api/v1/authn/factors"
~~~


##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00OhZsSfoCtbJTrU2XkwntfEl-jCj6ck6qcU_kA049",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~


#### Enroll Okta SMS Factor
{:.api .api-operation}

Enrolls a user with the Okta `sms` factor and a [SMS profile](factors.html#sms-profile).  A text message with an OTP is sent to the device during enrollment and must be [activated](#activate-sms-factor) by following the `next` link relation to complete the enrollment process.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "factorType": "sms",
  "provider": "OKTA",
  "profile": {
    "phoneNumber": "+1-555-415-1337"
  }
}' "https://${org}.okta.com/api/v1/authn/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

> Use the `resend` link to send another OTP if user doesn't receive the original activation SMS OTP.

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_ENROLL_ACTIVATE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factor": {
      "id": "mbl198rKSEWOSKRIVIFT",
      "factorType": "sms",
      "provider": "OKTA",
      "profile": {
        "phoneNumber": "+1 XXX-XXX-1337"
      }
    }
  },
  "_links": {
    "next": {
      "name": "activate",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/mbl198rKSEWOSKRIVIFT/lifecycle/activate",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "resend": [
      {
        "name": "sms",
        "href": "https://your-domain.okta.com/api/v1/authn/factors/mbl198rKSEWOSKRIVIFT/lifecycle/resend",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      }
    ]
  }
}
~~~

#### Enroll Okta Verify TOTP Factor
{:.api .api-operation}

Enrolls a user with the Okta `token:software:totp` factor.  The factor must be [activated](#activate-totp-factor) after enrollment by following the `next` link relation to complete the enrollment process.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "factorType": "token:software:totp",
  "provider": "OKTA"
}' "https://${org}.okta.com/api/v1/authn/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_ENROLL_ACTIVATE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factor": {
      "id": "ostf2xjtDKWFPZIKYDZV",
      "factorType": "token:software:totp",
      "provider": "OKTA",
      "profile": {
        "credentialId": "dade.murphy@example.com"
      },
      "_embedded": {
        "activation": {
          "timeStep": 30,
          "sharedSecret": "KBMTM32UJZSXQ2DW",
          "encoding": "base32",
          "keyLength": 6,
          "_links": {
            "qrcode": {
              "href": "https://your-domain.okta.com/api/v1/users/00ub0oNGTSWTBKOLGLNR/factors/ostf2xjtDKWFPZIKYDZV/qr/00Mb0zqhJQohwCDkB2wOifajAsAosEAXvDwuCmsAZs",
              "type": "image/png"
            }
          }
        }
      }
    }
  },
  "_links": {
    "next": {
      "name": "activate",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/ostf2xjtDKWFPZIKYDZV/lifecycle/activate",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

#### Enroll Okta Verify Push Factor
{:.api .api-operation}

Enrolls a user with the Okta verify `push` factor. The factor must be [activated on the device](#activate-push-factor) by scanning the QR code or visiting the activation link sent via email or sms.

> Use the published activation links to embed the QR code or distribute an activation `email` or `sms`

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "factorType": "push",
  "provider": "OKTA"
}' "https://${org}.okta.com/api/v1/authn/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_ENROLL_ACTIVATE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "factorResult": "WAITING",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factor": {
      "id": "opfh52xcuft3J4uZc0g3",
      "factorType": "push",
      "provider": "OKTA",
      "_embedded": {
        "activation": {
          "expiresAt": "2015-11-03T10:15:57.000Z",
          "_links": {
            "qrcode": {
              "href": "https://your-domain.okta.com/api/v1/users/00ub0oNGTSWTBKOLGLNR/factors/opfh52xcuft3J4uZc0g3/qr/00fukNElRS_Tz6k-CFhg3pH4KO2dj2guhmaapXWbc4",
              "type": "image/png"
            },
            "send": [
              {
                "name": "email",
                "href": "https://your-domain.okta.com/api/v1/users/00ub0oNGTSWTBKOLGLNR/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/email",
                "hints": {
                  "allow": [
                    "POST"
                  ]
                }
              },
              {
                "name": "sms",
                "href": "https://your-domain.okta.com/api/v1/users/00ub0oNGTSWTBKOLGLNR/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/sms",
                "hints": {
                  "allow": [
                    "POST"
                  ]
                }
              }
            ]
          }
        }
      }
    }
  },
  "_links": {
    "next": {
      "name": "poll",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/poll",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

#### Enroll Google Authenticator Factor
{:.api .api-operation}

Enrolls a user with the Google `token:software:totp` factor.  The factor must be [activated](#activate-totp-factor) after enrollment by following the `next` link relation to complete the enrollment process.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "factorType": "token:software:totp",
  "provider": "GOOGLE"
}' "https://${org}.okta.com/api/v1/authn/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_ENROLL_ACTIVATE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factor": {
      "id": "ostf2xjtDKWFPZIKYDZV",
      "factorType": "token:software:totp",
      "provider": "GOOGLE",
      "profile": {
        "credentialId": "dade.murphy@example.com"
      },
      "_embedded": {
        "activation": {
          "timeStep": 30,
          "sharedSecret": "KYCRM33UJZSXQ2DW",
          "encoding": "base32",
          "keyLength": 6,
          "_links": {
            "qrcode": {
              "href": "https://your-domain.okta.com/api/v1/users/00ub0oNGTSWTBKOLGLNR/factors/uftm3iHSGFQXHCUSDAND/qr/00Mb0zqhJQohwCDkB2wOifajAsAosEAXvDwuCmsAZs",
              "type": "image/png"
            }
          }
        }
      }
    }
  },
  "_links": {
    "next": {
      "name": "activate",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/uftm3iHSGFQXHCUSDAND/lifecycle/activate",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

#### Enroll RSA SecurID Factor
{:.api .api-operation}

Enrolls a user with a RSA SecurID factor and a [token profile](factors.html#token-profile).  RSA tokens must be verified with the [current pin+passcode](factors.html#factor-verification-object) as part of the enrollment request.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "factorType": "token",
  "provider": "RSA",
  "profile": {
    "credentialId": "dade.murphy@example.com"
  },
  "passCode": "5275875498"
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00OhZsSfoCtbJTrU2XkwntfEl-jCj6ck6qcU_kA049",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

#### Enroll Symantec VIP Factor
{:.api .api-operation}

Enrolls a user with a Symantec VIP factor and a [token profile](factors.html#token-profile).  Symantec tokens must be verified with the [current and next passcodes](factors.html#factor-verification-object) as part of the enrollment request.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "factorType": "token",
  "provider": "SYMANTEC",
  "profile": {
    "credentialId": "VSMT14393584"
  },
  "passCode": "875498",
  "nextPassCode": "678195"
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00OhZsSfoCtbJTrU2XkwntfEl-jCj6ck6qcU_kA049",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

#### Enroll YubiKey Factor
{:.api .api-operation}

Enrolls a user with a Yubico factor (YubiKey).  YubiKeys must be verified with the [current passcode](factors.html#factor-verification-object) as part of the enrollment request.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "factorType": "token:hardware",
  "provider": "YUBICO",
  "passCode": "cccccceukngdfgkukfctkcvfidnetljjiknckkcjulji"
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00OhZsSfoCtbJTrU2XkwntfEl-jCj6ck6qcU_kA049",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~


#### Enroll Duo Factor
{:.api .api-operation}

Enrolls a user with a Duo factor.  The enrollment process starts with an enrollment request to Okta, then continues with a Duo widget and script that handles the enrollment. At the end of the process, Duo makes a callback to Okta to complete the enrollment.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "factorType": "web",
  "provider": "DUO",
  "stateToken": "$(stateToken}"
}' "https://${org}.okta.com/api/v1/authn/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken":"00q8oewUkDwvzTKzQLNgZuZDqdpHue_e_xT89I8j4X",
  "expiresAt":"2016-07-13T13:14:52.000Z",
  "status":"MFA_ENROLL_ACTIVATE",
  "factorResult":"WAITING",
  "_embedded":{
      "user":{
          "id":"00uku2SnbUX49SAGb0g3",
          "passwordChanged":"2016-07-13T13:07:51.000Z",
          "profile":{
              "login":"first.last@gexample.com",
              "firstName":"First",
              "lastName":"Last",
              "locale":"en_US",
              "timeZone":"America/Los_Angeles"
          }
      },
      "factor":{
          "id":"dsfkucEOz3phNMdGP0g3",
          "factorType":"web",
          "provider":"DUO",
          "vendorName":"DUO",
          "profile":{
              "credentialId":"first.last@gexample.com"
          },
          "_embedded":{
              "activation":{
                  "host":"<your endpoint>.duosecurity.com",
                  "signature":"<your signature>",
                  "factorResult":"WAITING",
                  "_links":{
                      "complete":{
                          "href":"http://rain.okta1.com:1802/api/v1/authn/factors/dsfkucEOz3phNMdGP0g3/lifecycle/duoCallback",
                          "hints":{
                              "allow":[
                                  "POST"
                             ]
                          }
                      },
                      "script":{
                          "href":"http://rain.okta1.com:1802/js/sections/duo/Duo-Web-v2.js",
                          "type":"text/javascript; charset=utf-8"
                      }
                  }
              }
          }
      }
  },
  "_links":{
      "next":{
          "name":"poll",
          "href":"http://rain.okta1.com:1802/api/v1/authn/factors/dsfkucEOz3phNMdGP0g3/lifecycle/activate/poll",
          "hints":{
              "allow":[
                   "POST"
              ]
          }
      },
      "cancel":{
          "href":"http://rain.okta1.com:1802/api/v1/authn/cancel",
          "hints":{
              "allow":[
                  "POST"
              ]
          }
      },
      "prev":{
          "href":"http://rain.okta1.com:1802/api/v1/authn/previous",
          "hints":{
              "allow":[
                  "POST"
              ]
          }
      }
  }
}
~~~

##### Launch Duo WebSdk iFrame
{:.api .api-response .api-response-example}

~~~html
<script src="/js/sections/duo/Duo-Web-v2.js"></script>
<script>
  Duo.init({
    'host': '{activation.host}',
    'sig_request': '{activation.signature}',
    'post_action': '{activation._links.complete.href}'
  });
</script>
~~~

##### Poll for Duo WebSdk Activation Request Example
{:.api .api-response .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "$(stateToken}"
}' "https://${org}.okta.com/api/v1/authn/factors/${factorId}/lifecycle/activate/poll"
~~~

##### Poll for Duo WebSdk Activation Response Example
{:.api .api-response .api-response-example}

In this example we just enrolled and activated Duo but the question and SMS factors are not enrolled.

~~~json
{
    "stateToken":"00pAZpdCXV9xYTpknEqP84bObwUKFbp9_huzt8rS0y",
    "expiresAt":"2016-07-13T13:37:42.000Z",
    "status":"MFA_ENROLL",
    "_embedded":{
        "user":{
            "id":"00ukv3jVTgRjDctlX0g3",
            "passwordChanged":"2016-07-13T13:29:58.000Z",
            "profile":{
                "login":"first.last@example.com",
                "firstName":"First",
                "lastName":"Last",
                "locale":"en_US",
                "timeZone":"America/Los_Angeles"
            }
        },
        "factors":[
            {
                "factorType":"question",
                "provider":"OKTA",
                "vendorName":"OKTA",
                "_links":{
                    "questions":{
                        "href":"http://rain.okta1.com:1802/api/v1/users/00ukv3jVTgRjDctlX0g3/factors/questions",
                        "hints":{
                            "allow":[
                                "GET"
                            ]
                        }
                    },
                    "enroll":{
                        "href":"http://rain.okta1.com:1802/api/v1/authn/factors",
                        "hints":{
                            "allow":[
                                "POST"
                            ]
                        }
                    }
                },
                "status":"NOT_SETUP"
            },
            {
                "factorType":"sms",
                "provider":"OKTA",
                "vendorName":"OKTA",
                "_links":{
                    "enroll":{
                        "href":"http://rain.okta1.com:1802/api/v1/authn/factors",
                        "hints":{
                            "allow":[
                                "POST"
                            ]
                        }
                    }
                },
                "status":"NOT_SETUP"
            },
            {
                "factorType":"web",
                "provider":"DUO",
                "vendorName":"DUO",
                "_links":{
                    "enroll":{
                        "href":"http://rain.okta1.com:1802/api/v1/authn/factors",
                        "hints":{
                            "allow":[
                                "POST"
                            ]
                        }
                    }
                },
                "status":"ACTIVE"
            }
        ]
    },
    "_links":{
        "cancel":{
            "href":"http://rain.okta1.com:1802/api/v1/authn/cancel",
            "hints":{
                "allow":[
                    "POST"
                ]
            }
        },
        "skip":{
            "href":"http://rain.okta1.com:1802/api/v1/authn/skip",
            "hints":{
                "allow":[
                    "POST"
                ]
            }
        }
    }
}
~~~

### Activate Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/factors/*:fid*/lifecycle/activate</span>

The `sms` and `token:software:totp` [factor types](factors.html#factor-type) require activation to complete the enrollment process.

- [Activate TOTP Factor](#activate-totp-factor)
- [Activate SMS Factor](#activate-sms-factor)
- [Activate Push Factor](#activate-push-factor)

#### Activate TOTP Factor
{:.api .api-operation}

Activates a `token:software:totp` factor by verifying the OTP.

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                          | Param Type | DataType | Required | Default
------------ | ---------------------------------------------------- | ---------- | -------- | -------- | -------
fid          | `id` of factor returned from enrollment              | URL        | String   | TRUE     |
stateToken   | [state token](#state-token)  for current transaction | Body       | String   | TRUE     |
passCode     | OTP generated by device                              | Body       | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

[Authentication Transaction Object](#authentication-transaction-model) with the current [state](#transaction-state) for the authentication transaction.

If the passcode is invalid you will receive a `403 Forbidden` status code with the following error:

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "errorCode": "E0000068",
  "errorSummary": "Invalid Passcode/Answer",
  "errorLink": "E0000068",
  "errorId": "oaei_IfXcpnTHit_YEKGInpFw",
  "errorCauses": [
    {
      "errorSummary": "Your passcode doesn't match our records. Please try again."
    }
  ]
}
~~~

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "passCode": "123456"
}' "https://${org}.okta.com/api/v1/authn/factors/ostf1fmaMGJLMNGNLIVG/lifecycle/activate"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00Fpzf4en68pCXTsMjcX8JPMctzN2Wiw4LDOBL_9pe",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

#### Activate SMS Factor
{:.api .api-operation}

Activates a `sms` factor by verifying the OTP.  The request/response is identical to [activating a TOTP factor](#activate-totp-factor)

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
fid          | `id` of factor returned from enrollment             | URL        | String   | TRUE     |
stateToken   | [state token](#state-token) for current transaction | Body       | String   | TRUE     |
passCode     | OTP sent to mobile device                           | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

[Authentication Transaction Object](#authentication-transaction-model) with the current [state](#transaction-state) for the authentication transaction.

If the passcode is invalid you will receive a `403 Forbidden` status code with the following error:

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "errorCode": "E0000068",
  "errorSummary": "Invalid Passcode/Answer",
  "errorLink": "E0000068",
  "errorId": "oaei_IfXcpnTHit_YEKGInpFw",
  "errorCauses": [
    {
      "errorSummary": "Your passcode doesn't match our records. Please try again."
    }
  ]
}
~~~

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "passCode": "123456"
}' "https://${org}.okta.com/api/v1/authn/factors/sms1o51EADOTFXHHBXBP/lifecycle/activate"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00Fpzf4en68pCXTsMjcX8JPMctzN2Wiw4LDOBL_9pe",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

#### Activate Push Factor
{:.api .api-operation}

Activation of `push` factors are asynchronous and must be polled for completion when the `factorResult` returns a `WAITING` status.

Activations have a short lifetime (minutes) and will `TIMEOUT` if they are not completed before the `expireAt` timestamp.  Use the published `activate` link to restart the activation process if the activation is expired.

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
fid          | `id` of factor returned from enrollment             | URL        | String   | TRUE     |
stateToken   | [state token](#state-token) for current transaction | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

[Authentication Transaction Object](#authentication-transaction-model) with the current [state](#transaction-state) for the authentication transaction.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
}' "https://${org}.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate"
~~~

##### Response Example (Waiting)
{:.api .api-response .api-response-example}

> Follow the the published `next` link to keep polling for activation completion

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_ENROLL_ACTIVATE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "factorResult": "WAITING",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factor": {
      "id": "opfh52xcuft3J4uZc0g3",
      "factorType": "push",
      "provider": "OKTA",
      "_embedded": {
        "activation": {
          "expiresAt": "2015-11-03T10:15:57.000Z",
          "_links": {
            "qrcode": {
              "href": "https://your-domain.okta.com/api/v1/users/00ub0oNGTSWTBKOLGLNR/factors/opfh52xcuft3J4uZc0g3/qr/00fukNElRS_Tz6k-CFhg3pH4KO2dj2guhmaapXWbc4",
              "type": "image/png"
            },
            "send": [
              {
                "name": "email",
                "href": "https://your-domain.okta.com/api/v1/users/00ub0oNGTSWTBKOLGLNR/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/email",
                "hints": {
                  "allow": [
                    "POST"
                  ]
                }
              },
              {
                "name": "sms",
                "href": "https://your-domain.okta.com/api/v1/users/00ub0oNGTSWTBKOLGLNR/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/sms",
                "hints": {
                  "allow": [
                    "POST"
                  ]
                }
              }
            ]
          }
        }
      }
    }
  },
  "_links": {
    "next": {
      "name": "poll",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/poll",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

##### Response Example (Success)
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00Fpzf4en68pCXTsMjcX8JPMctzN2Wiw4LDOBL_9pe",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

##### Response Example (Timeout)
{:.api .api-response .api-response-example}

> Follow the the published `activate` link to restart the activation process

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_ENROLL_ACTIVATE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "factorResult": "TIMEOUT",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factor": {
      "id": "opfh52xcuft3J4uZc0g3",
      "factorType": "push",
      "provider": "OKTA",
      "_embedded": {
        "activation": {
          "factorResult": "TIMEOUT",
          "_links": {
            "activate": {
              "href": "https://your-domain.okta.com/api/v1/users/00u4vi0VX6U816Kl90g4/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate",
              "hints": {
                "allow": [
                  "POST"
                ]
              }
            },
            "send": [
              {
                "name": "email",
                "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/email",
                "hints": {
                  "allow": [
                    "POST"
                  ]
                }
              },
              {
                "name": "sms",
                "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/sms",
                "hints": {
                  "allow": [
                    "POST"
                  ]
                }
              }
            ]
          }
        }
      }
    }
  },
  "_links": {
    "next": {
      "name": "activate",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

##### Send Activation Links

An activation email or sms can be sent when when the user is unable to scan the QR code.

###### Request Example (Email)
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb"
}' "https://${org}.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/email"
~~~

###### Request Example (SMS)
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "profile": {
    "phoneNumber": "+1-555-415-1337"
  }
}' "https://${org}.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/sms"
~~~


###### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_ENROLL_ACTIVATE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "factorResult": "WAITING",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factor": {
      "id": "opfh52xcuft3J4uZc0g3",
      "factorType": "push",
      "provider": "OKTA",
      "_embedded": {
        "activation": {
          "expiresAt": "2015-11-03T10:15:57.000Z",
          "_links": {
            "qrcode": {
              "href": "https://your-domain.okta.com/api/v1/users/00ub0oNGTSWTBKOLGLNR/factors/opfh52xcuft3J4uZc0g3/qr/00fukNElRS_Tz6k-CFhg3pH4KO2dj2guhmaapXWbc4",
              "type": "image/png"
            },
            "send": [
              {
                "name": "email",
                "href": "https://your-domain.okta.com/api/v1/users/00ub0oNGTSWTBKOLGLNR/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/email",
                "hints": {
                  "allow": [
                    "POST"
                  ]
                }
              },
              {
                "name": "sms",
                "href": "https://your-domain.okta.com/api/v1/users/00ub0oNGTSWTBKOLGLNR/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/sms",
                "hints": {
                  "allow": [
                    "POST"
                  ]
                }
              }
            ]
          }
        }
      }
    }
  },
  "_links": {
    "next": {
      "name": "poll",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/lifecycle/activate/poll",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

### Verify Factor

Verifies an enrolled factor for an authentication transaction with the `MFA_REQUIRED` or `MFA_CHALLENGE` [state](#transaction-state)

- [Verify Security Question Factor](#verify-security-question-factor)
- [Verify SMS Factor](#verify-sms-factor)
- [Verify TOTP Factor](#verify-totp-factor)
- [Verify Push Factor](#verify-push-factor)
- [Verify Duo Factor](#verify-duo-factor)

#### Verify Security Question Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/factors/*:fid*/verify</span>

Verifies an answer to a `question` factor.

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
fid          | `id` of factor returned from enrollment             | URL        | String   | TRUE     |
stateToken   | [state token](#state-token) for current transaction | Body       | String   | TRUE     |
answer       | answer to security question                         | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

[Authentication Transaction Object](#authentication-transaction-model) with the current [state](#transaction-state) for the authentication transaction.

If the `answer` is invalid you will receive a `403 Forbidden` status code with the following error:

~~~json
{
  "errorCode": "E0000068",
  "errorSummary": "Invalid Passcode/Answer",
  "errorLink": "E0000068",
  "errorId": "oaei_IfXcpnTHit_YEKGInpFw",
  "errorCauses": [
    {
      "errorSummary": "Your answer doesn't match our records. Please try again."
    }
  ]
}
~~~

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "answer": "mayonnaise"
}' "https://${org}.okta.com/api/v1/authn/factors/ufs1pe3ISGKGPYKXRBKK/verify"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00ZD3Z7ixppspFljXV2t_Z6GfrYzqG7cDJ8reWo2hy",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

#### Verify SMS Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/factors/*:fid*/verify</span>

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
fid          | `id` of factor                                      | URL        | String   | TRUE     |
stateToken   | [state token](#state-token) for current transaction | Body       | String   | TRUE     |
passCode     | OTP sent to device                                  | Body       | String   | FALSE    |

> If you omit `passCode` in the request a new OTP will be sent to the device, otherwise the request will attempt to verify the `passCode`

#### Response Parameters
{:.api .api-response .api-response-params}

[Authentication Transaction Object](#authentication-transaction-model) with the current [state](#transaction-state) for the authentication transaction.

If the `passCode` is invalid you will receive a `403 Forbidden` status code with the following error:

~~~json
{
  "errorCode": "E0000068",
  "errorSummary": "Invalid Passcode/Answer",
  "errorLink": "E0000068",
  "errorId": "oaei_IfXcpnTHit_YEKGInpFw",
  "errorCauses": [
    {
      "errorSummary": "Your answer doesn't match our records. Please try again."
    }
  ]
}
~~~

##### Send SMS Challenge (OTP)

Omit `passCode` in the request to sent an OTP to the device

###### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb"
}' "https://${org}.okta.com/api/v1/authn/factors/sms193zUBEROPBNZKPPE/verify"
~~~

###### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_CHALLENGE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factor": {
      "id": "sms193zUBEROPBNZKPPE",
      "factorType": "sms",
      "provider": "OKTA",
      "profile": {
        "phoneNumber": "+1 XXX-XXX-1337"
      }
    }
  },
  "_links": {
    "next": {
      "name": "verify",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/sms193zUBEROPBNZKPPE/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "resend": [
      {
        "name": "sms",
        "href": "https://your-domain.okta.com/api/v1/authn/factors/sms193zUBEROPBNZKPPE/verify/resend",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      }
    ]
  }
}
~~~

##### Verify SMS Challenge (OTP)

Specify `passCode` in the request to verify the factor.

###### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "passCode": "657866"
}' "https://${org}.okta.com/api/v1/authn/factors/sms193zUBEROPBNZKPPE/verify"
~~~

###### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00t6IUQiVbWpMLgtmwSjMFzqykb5QcaBNtveiWlGeM",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

#### Verify TOTP Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/factors/*:fid*/verify</span>

Verifies an OTP for a `token:software:totp` factor.

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
fid          | `id` of factor                                      | URL        | String   | TRUE     |
stateToken   | [state token](#state-token) for current transaction | Body       | String   | TRUE     |
passCode     | OTP sent to device                                  | Body       | String   | FALSE    |

##### Response Parameters
{:.api .api-response .api-response-params}

[Authentication Transaction Object](#authentication-transaction-model) with the current [state](#transaction-state) for the authentication transaction.

If the passcode is invalid you will receive a `403 Forbidden` status code with the following error:

~~~json
{
  "errorCode": "E0000068",
  "errorSummary": "Invalid Passcode/Answer",
  "errorLink": "E0000068",
  "errorId": "oaei_IfXcpnTHit_YEKGInpFw",
  "errorCauses": [
    {
      "errorSummary": "Your passcode doesn't match our records. Please try again."
    }
  ]
}
~~~

###### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "passCode": "657866"
}' "https://${org}.okta.com/api/v1/authn/factors/ostfm3hPNYSOIOIVTQWY/verify"
~~~

###### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00t6IUQiVbWpMLgtmwSjMFzqykb5QcaBNtveiWlGeM",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

#### Verify Push Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/factors/*:fid*/verify</span>

Sends an asynchronous push notification (challenge) to the device for the user to approve or reject.  The `factorResult` for the transaction will have a result of `WAITING`, `SUCCESS`, `REJECTED`, or `TIMEOUT`.

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
fid          | `id` of factor returned from enrollment             | URL        | String   | TRUE     |
stateToken   | [state token](#state-token) for current transaction | Body       | String   | TRUE     |


##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb"
}' "https://${org}.okta.com/api/v1/authn/factors/ufs1pe3ISGKGPYKXRBKK/verify"
~~~

##### Response Example (Waiting)
{:.api .api-response .api-response-example}

> Keep polling authentication transactions with `WAITING` result until the challenge completes or expires.

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_CHALLENGE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "factorResult": "WAITING",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factors": {
      "id": "opfh52xcuft3J4uZc0g3",
      "factorType": "push",
      "provider": "OKTA",
      "profile": {
        "deviceType": "SmartPhone_IPhone",
        "name": "Gibson",
        "platform": "IOS",
        "version": "9.0"
      }
    }
  },
  "_links": {
    "next": {
      "name": "poll",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "resend": [
      {
        "name": "push",
        "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/verify/resend",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      }
    ]
  }
}
~~~

##### Response Example (Approved)
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00Fpzf4en68pCXTsMjcX8JPMctzN2Wiw4LDOBL_9xx",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

##### Response Example (Rejected)
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_CHALLENGE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "factorResult": "REJECTED",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factors": {
      "id": "opfh52xcuft3J4uZc0g3",
      "factorType": "push",
      "provider": "OKTA",
      "profile": {
        "deviceType": "SmartPhone_IPhone",
        "name": "Gibson",
        "platform": "IOS",
        "version": "9.0"
      }
    }
  },
  "_links": {
    "next": {
      "name": "verify",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "resend": [
      {
        "name": "push",
        "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/verify/resend",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      }
    ]
  }
}
~~~

##### Response Example (Timeout)
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_CHALLENGE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "factorResult": "WAITING",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factors": {
      "id": "opfh52xcuft3J4uZc0g3",
      "factorType": "push",
      "provider": "OKTA",
      "profile": {
        "deviceType": "SmartPhone_IPhone",
        "name": "Gibson",
        "platform": "IOS",
        "version": "9.0"
      }
    }
  },
  "_links": {
    "next": {
      "name": "verify",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "resend": [
      {
        "name": "push",
        "href": "https://your-domain.okta.com/api/v1/authn/factors/opfh52xcuft3J4uZc0g3/verify/resend",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      }
    ]
  }
}
~~~

#### Verify Duo Factor
{:.api .api-operation}

Verification of the Duo factor is implemented as an integration between the Okta API and Duo widget. Verification starts with a
request to the Okta API, then continues with a Duo widget and script that handles verification. At the end of the process, Duo
makes a callback to the Okta verification endpoint to complete the verification.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "${stateToken}"
}' "https://${org}.okta.com/api/v1/authn/factors/${factorId]/verify"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
    "stateToken":"00CzoxFVe4R2nv0hTxm32r1kayfrrOkuxcE2rfINwZ",
    "expiresAt":"2016-07-13T14:13:58.000Z",
    "status":"MFA_CHALLENGE",
    "factorResult":"WAITING",
    "_embedded":{
        "user":{
            "id":"00ukv3jVTgRjDctlX0g3",
            "passwordChanged":"2016-07-13T13:29:58.000Z",
            "profile":{
                "login":"first.last@gexample.com",
                "firstName":"First",
                "lastName":"Last",
                "locale":"en_US",
                "timeZone":"America/Los_Angeles"
            }
        },
        "factor":{
            "id":"dsfkvdLeix4WsKK5W0g3",
            "factorType":"web",
            "provider":"DUO",
            "vendorName":"DUO",
            "profile":{
                "credentialId":"first.last@example.com"
            },
            "_embedded":{
                "verification":{
                    "host":"<your endpoint>.duosecurity.com",
                    "signature":"<your signature>",
                    "factorResult":"WAITING",
                    "_links":{
                        "complete":{
                            "href":"http://rain.okta1.com:1802/api/v1/authn/factors/dsfkvdLeix4WsKK5W0g3/lifecycle/duoCallback",
                            "hints":{
                                "allow":[
                                    "POST"
                                ]
                            }
                        },
                        "script":{
                            "href":"http://rain.okta1.com:1802/js/sections/duo/Duo-Web-v2.js",
                            "type":"text/javascript; charset=utf-8"
                        }
                    }
                }
            }
        },
        "policy":{
            "allowRememberDevice":true,
            "rememberDeviceLifetimeInMinutes":15,
            "rememberDeviceByDefault":false
        }
    },
    "_links":{
        "next":{
            "name":"poll",
            "href":"http://rain.okta1.com:1802/api/v1/authn/factors/dsfkvdLeix4WsKK5W0g3/verify",
            "hints":{
                "allow":[
                    "POST"
                ]
            }
        },
        "cancel":{
            "href":"http://rain.okta1.com:1802/api/v1/authn/cancel",
            "hints":{
                "allow":[
                    "POST"
                ]
            }
        },
        "prev":{
            "href":"http://rain.okta1.com:1802/api/v1/authn/previous",
            "hints":{
                "allow":[
                    "POST"
                ]
            }
        }
    }
}
~~~

##### Launch Duo iFrame
{:.api .api-response .api-response-example}

~~~html
<script src="/js/sections/duo/Duo-Web-v2.js"></script>
<script>
  Duo.init({
    'host': '{activation.host}',
    'sig_request': '{activation.signature}',
    'post_action': '{activation._links.complete.href}'
  });
</script>
~~~

##### Request Poll Verification Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "${stateToken}"
}' "https://${org}.okta.com/api/v1/authn/factors/${factorId]/verify"
~~~

##### Response Poll Verification Example
{:.api .api-response .api-response-example}

~~~json
{
    "expiresAt":"2016-07-13T14:14:44.000Z",
    "status":"SUCCESS",
    "sessionToken":"201111XUk7La2gw5r5PV1IhU4WSd0fV6mvNYdlJoeqjuyej7S83x3Hr",
    "_embedded":{
        "user":{
            "id":"00ukv3jVTgRjDctlX0g3",
            "passwordChanged":"2016-07-13T13:29:58.000Z",
            "profile":{
                "login":"first.last@example.com",
                "firstName":"First",
                "lastName":"Last",
                "locale":"en_US",
                "timeZone":"America/Los_Angeles"
            }
        }
    }
}
~~~

## Recovery Operations

### Forgot Password
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/recovery/password</span>

Starts a new password recovery transaction for a given user and issues a [recovery token](#recovery-token) that can be used to reset a user's password.

- [Forgot Password with Email Factor](#forgot-password-with-email-factor)
- [Forgot Password with SMS Factor](#forgot-password-with-sms-factor)
- [Forgot Password with Trusted Application](#forgot-password-with-trusted-application)

> Self-service password reset (forgot password) must be permitted via the user's assigned password policy to use this operation.

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter   | Description                                                                                                      | Param Type | DataType                          | Required | Default | MaxLength
----------- | ---------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------- | -------- |-------- | ---------
username    | User's non-qualified short-name (e.g. dade.murphy) or unique fully-qualified login (e.g dade.murphy@example.com) | Body       | String                            | TRUE     |         |
factorType  | Recovery factor to use for primary authentication                                                                | Body       | `EMAIL` or `SMS`                  | FALSE    |         |
relayState  | Optional state value that is persisted for the lifetime of the recovery transaction                              | Body       | String                            | FALSE    |         | 2048

> A valid `factorType` is required for requests without an API token with admin privileges. (See [Forgot Password with Trusted Application](#forgot-password-with-trusted-application))

##### Response Parameters
{:.api .api-response .api-response-params}

###### Public Application

[Recovery Transaction Object](#recovery-transaction-model) with `RECOVERY_CHALLENGE` status for the new recovery transaction.

> You will always receive a [Recovery Transaction](#recovery-transaction-model) response even if the requested `username` is not a valid identifier to prevent information disclosure.

###### Trusted Application

[Recovery Transaction Object](#recovery-transaction-model) with an issued `recoveryToken` that can be distributed to the end-user.

You will receive a `403 Forbidden` status code if the `username` requested is not valid

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
    "errorCode": "E0000095",
    "errorSummary": "Recovery not allowed for unknown user.",
    "errorLink": "E0000095",
    "errorId": "oaetVarN2dKS6ap08dq0k4n7A",
    "errorCauses": []
}
~~~

#### Forgot Password with Email Factor

Starts a new password recovery transaction with a user identifier (`username`) and asynchronously sends a recovery email to the user's primary and secondary email address with a [recovery token](#recovery-token) that can be used to complete the transaction.

Since the recovery email is distributed out-of-band and may be viewed on a different user agent or device, this operation does not return a [state token](#state-token) and does not have a `next` link.

> Primary authentication of a user's recovery credential (e.g `EMAIL` or `SMS`) has not yet completed.
> Okta will not publish additional metadata about the user until primary authentication has successfully completed.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "username": "dade.murphy@example.com",
  "factorType": "EMAIL",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to"
}' "https://${org}.okta.com/api/v1/authn/recovery/password"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "status": "RECOVERY_CHALLENGE",
  "factorResult": "WAITING",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "factorType": "EMAIL",
  "recoveryType": "PASSWORD"
}
~~~


#### Forgot Password with SMS Factor

Starts a new password recovery transaction with a user identifier (`username`) and asynchronously sends a SMS OTP (challenge) to the user's mobile phone.  This operation will transition the recovery transaction to the `RECOVERY_CHALLENGE` state and wait for user to [verify the OTP](#verify-sms-recovery-factor).

> Primary authentication of a user's recovery credential (e.g email or SMS) has not yet completed.
> Okta will not publish additional metadata about the user until primary authentication has successfully completed.

> SMS recovery factor must be enabled via the user's assigned password policy to use this operation.

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "username": "dade.murphy@example.com",
  "factorType": "SMS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to"
}' "https://${org}.okta.com/api/v1/authn/recovery/password"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "00xdqXOE5qDXX8-PBR1bYv8AESqIEinDy3yul01tyh",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "RECOVERY_CHALLENGE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "factorType": "SMS",
  "recoveryType": "PASSWORD",
  "_links": {
    "next": {
      "name": "verify",
      "href": "https://your-domain.okta.com/api/v1/authn/recovery/factors/SMS/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "resend": {
      "name": "sms",
      "href": "https://your-domain.okta.com/api/v1/authn/recovery/factors/SMS/resend",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

#### Forgot Password with Trusted Application

Allows a [trusted application](#trusted-application) such as an external portal to implement it's own primary authentication process and directly obtain a [recovery token](#recovery-token) for a user given just the user's identifier.

> Directly obtaining a `recoveryToken` is a highly privileged operation that requires an administrator API token and should be restricted to trusted web applications.  Anyone that obtains a `recoveryToken` for a user and knows the answer to a user's recovery question can reset their password or unlock their account.

> The **public IP address** of your [trusted application](#trusted-application) must be [whitelisted as a gateway IP address](../getting_started/design_principles.html#ip-address) to forward the user agent's original IP address with the `X-Forwarded-For` HTTP header

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36" \
-H "X-Forwarded-For: 23.235.46.133" \
-d '{
  "username": "dade.murphy@example.com",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to"
}' "https://${org}.okta.com/api/v1/authn/recovery/password"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "RECOVERY",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "recoveryToken": "VBQ0gwBp5LyJJFdbmWCM",
  "recoveryType": "PASSWORD",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  },
  "_links": {
    "next": {
      "name": "recovery",
      "href": "https://your-domain.okta.com/api/v1/authn/recovery/token",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

### Unlock Account
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/recovery/unlock</span>

Starts a new unlock recovery transaction for a given user and issues a [recovery token](#recovery-token) that can be used to unlock a user's account.

- [Unlock Account with Email Factor](#unlock-account-with-email-factor)
- [Unlock Account with SMS Factor](#unlock-account-with-sms-factor)
- [Unlock Account with Trusted Application](#unlock-account-with-trusted-application)

> Self-service unlock must be permitted via the user's assigned password policy to use this operation.

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter   | Description                                                                                                      | Param Type | DataType                          | Required | Default | MaxLength
----------- | ---------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------- | -------- |-------- | ---------
username    | User's non-qualified short-name (e.g. dade.murphy) or unique fully-qualified login (e.g dade.murphy@example.com) | Body       | String                            | TRUE     |         |
factorType  | Recovery factor to use for primary authentication                                                                | Body       | `EMAIL` or `SMS`                  | FALSE    |         |
relayState  | Optional state value that is persisted for the lifetime of the recovery transaction                              | Body       | String                            | FALSE    |         | 2048

> A valid `factoryType` is required for requests without an API token with admin privileges. (See [Unlock Account with Trusted Application](#unlock-account-with-trusted-application))

##### Response Parameters
{:.api .api-response .api-response-params}

###### Public Application

[Recovery Transaction Object](#recovery-transaction-model) with `RECOVERY_CHALLENGE` status for the new recovery transaction.

> You will always receive a [Recovery Transaction](#recovery-transaction-model) response even if the requested `username` is not a valid identifier to prevent information disclosure.

###### Trusted Application

[Recovery Transaction Object](#recovery-transaction-model) with an issued `recoveryToken` that can be distributed to the end-user.

You will receive a `403 Forbidden` status code if the `username` requested is not valid

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
    "errorCode": "E0000095",
    "errorSummary": "Recovery not allowed for unknown user.",
    "errorLink": "E0000095",
    "errorId": "oaetVarN2dKS6ap08dq0k4n7A",
    "errorCauses": []
}
~~~

#### Unlock Account with Email Factor

Starts a new unlock recovery transaction with a user identifier (`username`) and asynchronously sends a recovery email to the user's primary and secondary email address with a [recovery token](#recovery-token) that can be used to complete the transaction.

Since the recovery email is distributed out-of-band and may be viewed on a different user agent or device, this operation does not return a [state token](#state-token) and does not have a `next` link.

> Primary authentication of a user's recovery credential (e.g `EMAIL` or `SMS`) has not yet completed.
> Okta will not publish additional metadata about the user until primary authentication has successfully completed.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "username": "dade.murphy@example.com",
  "factorType": "EMAIL",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to"
}' "https://${org}.okta.com/api/v1/authn/recovery/unlock"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "status": "RECOVERY_CHALLENGE",
  "factorResult": "WAITING",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "factorType": "EMAIL",
  "recoveryType": "UNLOCK"
}
~~~


#### Unlock Account with SMS Factor

Starts a new unlock recovery transaction with a user identifier (`username`) and asynchronously sends a SMS OTP (challenge) to the user's mobile phone.  This operation will transition the recovery transaction to the `RECOVERY_CHALLENGE` state and wait for user to [verify the OTP](#verify-sms-recovery-factor).

> Primary authentication of a user's recovery credential (e.g email or SMS) has not yet completed.
> Okta will not publish additional metadata about the user until primary authentication has successfully completed.

> SMS recovery factor must be enabled via the user's assigned password policy to use this operation.

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "username": "dade.murphy@example.com",
  "factorType": "SMS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to"
}' "https://${org}.okta.com/api/v1/authn/recovery/unlock"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "00xdqXOE5qDXX8-PBR1bYv8AESqIEinDy3yul01tyh",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "RECOVERY_CHALLENGE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "factorType": "SMS",
  "recoveryType": "UNLOCK",
  "_links": {
    "next": {
      "name": "verify",
      "href": "https://your-domain.okta.com/api/v1/authn/recovery/factors/SMS/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "resend": {
      "name": "sms",
      "href": "https://your-domain.okta.com/api/v1/authn/recovery/factors/SMS/resend",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

#### Unlock Account with Trusted Application

Allows a [trusted application](#trusted-application) such as an external portal to implement it's own primary authentication process and directly obtain a [recovery token](#recovery-token) for a user given just the user's identifier.

> Directly obtaining a `recoveryToken` is a highly privileged operation that requires an administrator API token and should be restricted to [trusted web applications](#trusted-application).  Anyone that obtains a `recoveryToken` for a user and knows the answer to a user's recovery question can reset their password or unlock their account.

> The **public IP address** of your [trusted application](#trusted-application) must be [whitelisted as a gateway IP address](../getting_started/design_principles.html#ip-address) to forward the user agent's original IP address with the `X-Forwarded-For` HTTP header

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36" \
-H "X-Forwarded-For: 23.235.46.133" \
-d '{
  "username": "dade.murphy@example.com",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to"
}' "https://${org}.okta.com/api/v1/authn/recovery/unlock"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "RECOVERY",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "recoveryToken": "VBQ0gwBp5LyJJFdbmWCM",
  "recoveryType": "UNLOCK",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  },
  "_links": {
    "next": {
      "name": "recovery",
      "href": "https://your-domain.okta.com/api/v1/authn/recovery/token",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

### Verify Recovery Factor

#### Verify SMS Recovery Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/recovery/factors/sms/verify</span>

Verifies a SMS OTP (`passCode`) sent to the user's mobile phone for primary authentication for a recovery transaction with `RECOVERY_CHALLENGE` status.

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                                  | Param Type | DataType | Required | Default
------------ | ------------------------------------------------------------ | ---------- | -------- | -------- | -------
stateToken   | [state token](#state-token) for current recovery transaction | Body       | String   | TRUE     |
passCode     | OTP sent to device                                           | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

[Recovery Transaction Object](#recovery-transaction-model) with the current [state](#transaction-state) for the recovery transaction.

If the `passCode` is invalid you will receive a `403 Forbidden` status code with the following error:

~~~json
{
  "errorCode": "E0000068",
  "errorSummary": "Invalid Passcode/Answer",
  "errorLink": "E0000068",
  "errorId": "oae2uOmZcuzToCPEV2Pc_f5zw",
  "errorCauses": [
    {
      "errorSummary": "Your token doesn't match our records. Please try again."
    }
  ]
}
~~~

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "00xdqXOE5qDXX8-PBR1bYv8AESqIEinDy3yul01tyh",
  "passCode": "657866"
}' "https://${org}.okta.com/api/v1/authn/factors/sms193zUBEROPBNZKPPE/verify"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "00xdqXOE5qDXX8-PBR1bYv8AESqIEinDy3yul01tyh",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "RECOVERY",
  "recoveryType": "PASSWORD",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      },
      "recovery_question": {
        "question": "Who's a major player in the cowboy scene?"
      }
    }
  },
  "_links": {
    "next": {
      "name": "answer",
      "href": "https://your-domain.okta.com/api/v1/authn/recovery/answer",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

###### Resend SMS Recovery Challenge
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/recovery/factors/sms/resend</span>

Resends a SMS OTP (`passCode`) to the user's mobile phone

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                                  | Param Type | DataType | Required | Default
------------ | ------------------------------------------------------------ | ---------- | -------- | -------- | -------
stateToken   | [state token](#state-token) for current recovery transaction | Body       | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

[Recovery Transaction Object](#recovery-transaction-model) with the current [state](#transaction-state) for the recovery transaction.

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "00xdqXOE5qDXX8-PBR1bYv8AESqIEinDy3yul01tyh"
}' "https://${org}.okta.com/api/v1/authn/recovery/factors/sms/resend"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "00xdqXOE5qDXX8-PBR1bYv8AESqIEinDy3yul01tyh",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "RECOVERY_CHALLENGE",
  "factorType": "SMS",
  "recoveryType": "PASSWORD",
  "_links": {
    "next": {
      "name": "verify",
      "href": "https://your-domain.okta.com/api/v1/authn/recovery/factors/SMS/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "resend": {
      "name": "sms",
      "href": "https://your-domain.okta.com/api/v1/authn/recovery/factors/SMS/resend",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

> The `factorType` and `recoveryType` properties will vary depending on recovery transaction


### Verify Recovery Token
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/recovery/token</span>

Validates a [recovery token](#recovery-token) that was distributed to the end-user to continue the recovery transaction.

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter     | Description                                                                                                | Param Type | DataType | Required | Default
------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | -------- | -------- |
recoveryToken | [Recovery token](#recovery-token) that was distributed to end-user via out-of-band mechanism such as email | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

[Recovery Transaction Object](#recovery-transaction-model) with a `RECOVERY` status and an issued `stateToken` that must be used to complete the recovery transaction.

You will receive a `401 Unauthorized` status code if you attempt to use an expired or invalid [recovery token](#recovery-token).

~~~http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
    "errorCode": "E0000011",
    "errorSummary": "Invalid token provided",
    "errorLink": "E0000011",
    "errorId": "oaeY-4G_TBUTBSZAn9n7oZCfw",
    "errorCauses": []
}
~~~

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "recoveryToken": "00xdqXOE5qDZX8-PBR1bYv8AESqIFinDy3yul01tyh"
}' "https://${org}.okta.com/api/v1/authn/recovery/token"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "00lMJySRYNz3u_rKQrsLvLrzxiARgivP8FB_1gpmVb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "RECOVERY",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      },
      "recovery_question": {
        "question": "Who's a major player in the cowboy scene?"
      }
    }
  },
  "_links": {
    "next": {
      "name": "answer",
      "href": "https://your-domain.okta.com/api/v1/authn/recovery/answer",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

### Answer Recovery Question
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/recovery/answer</span>

Answers the user's recovery question to ensure only the end-user redeemed the [recovery token](#recovery-token) for recovery transaction with a `RECOVERY` [status](#transaction-state).

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
stateToken   | [state token](#state-token) for current transaction | Body       | String   | TRUE     |
answer       | answer to user's recovery question                  | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

[Recovery Transaction Object](#recovery-transaction-model) with the current [state](#transaction-state) for the recovery transaction.

You will receive a `403 Forbidden` status code if the `answer` to the user's [recovery question](#recovery-question-object) is invalid

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
    "errorCode": "E0000087",
    "errorSummary": "The recovery question answer did not match our records.",
    "errorLink": "E0000087",
    "errorId": "oaeGEiIPFfeR3a_XxpezUH9ug",
    "errorCauses": []
}
~~~

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "stateToken": "00lMJySRYNz3u_rKQrsLvLrzxiARgivP8FB_1gpmVb",
  "answer": "Cowboy Dan"
}' "https://${org}.okta.com/api/v1/authn/recovery/answer"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "00lMJySRYNz3u_rKQrsLvLrzxiARgivP8FB_1gpmVb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "PASSWORD_RESET",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
   },
   "policy": {
    "expiration":{
      "passwordExpireDays": 0
      },
      "complexity": {
        "minLength": 8,
        "minLowerCase": 1,
        "minUpperCase": 1,
        "minNumber": 1,
        "minSymbol": 0,
        "excludeUsername": "true"
       },
       "age":{
         "minAgeMinutes":0,
         "historyCount":0  
      }
    }
  },
  "_links": {
    "next": {
      "name": "password",
      "href": "https://your-domain.okta.com/api/v1/authn/credentials/reset_password",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

### Reset Password
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/credentials/reset_password</span>

Resets a user's password to complete a recovery transaction with a `PASSWORD_RESET` [state](#transaction-state).

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
stateToken   | [state token](#state-token) for current transaction | Body       | String   | TRUE     |
newPassword  | user's new password                                 | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

[Recovery Transaction Object](#recovery-transaction-model) with the current [state](#transaction-state) for the recovery transaction.

You will receive a `403 Forbidden` status code if the `answer` to the user's [recovery question](#recovery-question-object) is invalid.

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
    "errorCode": "E0000087",
    "errorSummary": "The recovery question answer did not match our records.",
    "errorLink": "E0000087",
    "errorId": "oaeGEiIPFfeR3a_XxpezUH9ug",
    "errorCauses": []
}
~~~

You will also receive a `403 Forbidden` status code if the `newPassword` does not meet password policy requirements for the user.

~~~http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
    "errorCode": "E0000014",
    "errorSummary": "The password does meet the complexity requirements of the current password policy.",
    "errorLink": "E0000014",
    "errorId": "oaeS4O7BUp5Roefkk_y4Z2u8Q",
    "errorCauses": [
        {
            "errorSummary": "Passwords must have at least 8 characters, a lowercase letter, an uppercase letter, a number, no parts of your username"
        }
    ]
}
~~~

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "stateToken": "00lMJySRYNz3u_rKQrsLvLrzxiARgivP8FB_1gpmVb",
  "newPassword": "Ch-ch-ch-ch-Changes!"
}' "https://${org}.okta.com/api/v1/authn/credentials/reset_password"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00t6IUQiVbWpMLgtmwSjMFzqykb5QcaBNtveiWlGeM",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-11-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

## State Management Operations

### Get Transaction State
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn</span>

Retrieves the current [transaction state](#transaction-state) for a [state token](#state-token).

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
stateToken   | [state token](#state-token) for a transaction       | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

[Transaction Object](#transaction-model) with the current [state](#transaction-state) for the authentication or recovery transaction.

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "00lMJySRYNz3u_rKQrsLvLrzxiARgivP8FB_1gpmVb"
}' "https://${org}.okta.com/api/v1/authn"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "00lMJySRYNz3u_rKQrsLvLrzxiARgivP8FB_1gpmVb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_CHALLENGE",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factor": {
      "id": "sms193zUBEROPBNZKPPE",
      "factorType": "sms",
      "provider": "OKTA",
      "profile": {
        "phoneNumber": "+1 XXX-XXX-1337"
      }
    }
  },
  "_links": {
    "next": {
      "name": "verify",
      "href": "https://your-domain.okta.com/api/v1/authn/factors/sms193zUBEROPBNZKPPE/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "prev": {
      "href": "https://your-domain.okta.com/api/v1/authn/previous",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

### Previous Transaction State
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/previous</span>

Moves the current [transaction state](#transaction-state) back to the previous state.

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
stateToken   | [state token](#state-token) for a transaction       | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

[Transaction Object](#transaction-model) with the current [state](#transaction-state) for the authentication or recovery transaction.

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "00lMJySRYNz3u_rKQrsLvLrzxiARgivP8FB_1gpmVb"
}' "https://${org}.okta.com/api/v1/authn/previous"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "stateToken": "007ucIX7PATyn94hsHfOLVaXAmOBkKHWnOOLG43bsb",
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "MFA_ENROLL",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-09-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    },
    "factors": [
      {
        "factorType": "token",
        "provider": "RSA",
        "_links": {
          "enroll": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      },
      {
        "factorType": "token:software:totp",
        "provider": "OKTA",
        "_links": {
          "enroll": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      },
      {
        "factorType": "sms",
        "provider": "OKTA",
        "_links": {
          "enroll": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      }
      {
        "factorType": "push",
        "provider": "OKTA",
        "_links": {
          "enroll": {
            "href": "https://your-domain.okta.com/api/v1/authn/factors",
            "hints": {
              "allow": [
                "POST"
              ]
            }
          }
        }
      }
    ]
  },
  "_links": {
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/authn/cancel",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    }
  }
}
~~~

### Skip Transaction State
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/skip</span>

Skips the current [transaction state](#transaction-state) and advances the state machine to the next state.

> This operation is only available for `MFA_ENROLL` or `PASSWORD_WARN` states when published as a link

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
stateToken   | [state token](#state-token) for a transaction       | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

[Transaction Object](#transaction-model) with the current [state](#transaction-state) for the authentication or recovery transaction.

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "00lMJySRYNz3u_rKQrsLvLrzxiARgivP8FB_1gpmVb"
}' "https://${org}.okta.com/api/v1/authn/skip"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-11-03T10:15:57.000Z",
  "status": "SUCCESS",
  "relayState": "/myapp/some/deep/link/i/want/to/return/to",
  "sessionToken": "00t6IUQiVbWpMLgtmwSjMFzqykb5QcaBNtveiWlGeM",
  "_embedded": {
    "user": {
      "id": "00ub0oNGTSWTBKOLGLNR",
      "passwordChanged": "2015-11-08T20:14:45.000Z",
      "profile": {
        "login": "dade.murphy@example.com",
        "firstName": "Dade",
        "lastName": "Murphy",
        "locale": "en_US",
        "timeZone": "America/Los_Angeles"
      }
    }
  }
}
~~~

### Cancel Transaction
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /authn/cancel</span>

Cancels the current transaction and revokes the [state token](#state-token).

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
stateToken   | [state token](#state-token) for a transaction       | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

Parameter    | Description                                                                            | Param Type | DataType | Required | Default
------------ | -------------------------------------------------------------------------------------- | ---------- | -------- | -------- | -------
relayState   | Optional state value that was persisted for the authentication or recovery transaction | Body       | String   | TRUE     |

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "stateToken": "00lMJySRYNz3u_rKQrsLvLrzxiARgivP8FB_1gpmVb"
}' "https://${org}.okta.com/api/v1/authn/cancel"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "relayState": "/myapp/some/deep/link/i/want/to/return/to"
}
~~~
