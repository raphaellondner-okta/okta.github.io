---
layout: docs_page
title: Factors (MFA)
redirect_from: "/docs/api/rest/factors.html"
---

## Overview

The Okta Factors API provides operations to enroll, manage, and verify factors for multi-factor authentication (MFA).  It is optimized for both administrative and end-user account management, but may also be used verify a factor at any time on-demand.

The Factors API contains three types of operations.

 - **[Factor Operations](#factor-operations)** &ndash; List factors and security questions.
 - **[Factor Lifecycle Operations](#factor-lifecycle-operations)** &ndash; Enroll, activate, and reset factors.
 - **[Factor Verification Operations](#factor-verification-operations)** &ndash; Verify a factor

## Factor Model

### Example

~~~json
{
  "id": "smsk33ujQ59REImFX0g3",
  "factorType": "sms",
  "provider": "OKTA",
  "status": "ACTIVE",
  "created": "2015-02-04T07:07:25.000Z",
  "lastUpdated": "2015-02-04T07:07:25.000Z",
  "profile": {
    "phoneNumber": "+1415551337"
  },
  "_links": {
    "verify": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/smsk33ujQ59REImFX0g3/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "self": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/smsk33ujQ59REImFX0g3",
      "hints": {
        "allow": [
          "GET",
          "DELETE"
        ]
      }
    },
    "user": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    }
  }
}
~~~


### Factor Properties

Factors have the following properties:

|----------------+------------------------------------------------------------------+--------------------------------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|
| Property       | Description                                                      | DataType                                                                       | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------- | ------ | -------- | --------- | --------- | ---------- |
| id             | unique key for factor                                            | String                                                                         | FALSE    | TRUE   | TRUE     |           |           |            |
| factorType     | type of factor                                                   | [Factor Type](#factor-type)                                                    | FALSE    | TRUE   | TRUE     |           |           |            |
| provider       | factor provider                                                  | [Provider Type](#provider-type)                                                | FALSE    | TRUE   | TRUE     |           |           |            |
| status         | status of factor                                                 | `NOT_SETUP`, `PENDING_ACTIVATION`, `ENROLLED`, `ACTIVE`, `INACTIVE`, `EXPIRED` | FALSE    | FALSE  | TRUE     |           |           |            |
| created        | timestamp when factor was created                                | Date                                                                           | FALSE    | FALSE  | TRUE     |           |           |            |
| lastUpdated    | timestamp when factor was last updated                           | Date                                                                           | FALSE    | FALSE  | TRUE     |           |           |            |
| profile        | profile of a [supported factor](#supported-factors-for-providers)| [Factor Profile Object](#factor-profile-object)                                | TRUE     | FALSE  | FALSE    |           |           |            |
| verify         | optional verification  for factor enrollment                     | [Factor Verification Object](#factor-verification-object)                      | TRUE     | FALSE  | FALSE    |           |           |            |
| _links         | [discoverable resources](#links-object) related to the factor    | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06)                 | TRUE     | FALSE  | TRUE     |           |           |            |
| _embedded      | [embedded resources](#embedded-resources) related to the factor  | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06)                 | TRUE     | FALSE  | TRUE     |           |           |            |
|----------------+------------------------------------------------------------------+--------------------------------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|

> `id`, `created`, `lastUpdated`, `status`, `_links`, and `_embedded` are only available after a factor is enrolled.

#### Factor Type

The following factor types are supported:

|-----------------------+---------------------------------------------------------------------------------------------------------------------|
| Factor Type           | Description                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------|
| `push`                | Out-of-band verification via push notification to a device and transaction verification with digital signature      |
| `sms`                 | Software [OTP](http://en.wikipedia.org/wiki/One-time_password) sent via SMS to a registered phone number            |
| `token`               | Software or hardware [One-time Password (OTP)](http://en.wikipedia.org/wiki/One-time_password) device               |
| `token:software:totp` | Software [Time-based One-time Password (TOTP)](http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm) |
| `token:hardware`      | Hardware one-time password [OTP](http://en.wikipedia.org/wiki/One-time_password) device                             |
| `question`            | Additional knowledge based security question                                                                        |
| `web`                 | HTML inline frame (iframe) for embedding verification from a 3rd party                                              |
|-----------------------+---------------------------------------------------------------------------------------------------------------------|

#### Provider Type

The following providers are supported:

|------------+-------------------------------|
| Provider   | Description                   |
| ---------- | ----------------------------- |
| `OKTA`     | Okta                          |
| `RSA`      | RSA SecurID                   |
| `SYMANTEC` | Symantec VIP                  |
| `GOOGLE`   | Google                        |
| `DUO`      | Duo Security                  |
| `YUBICO`   | Yubico                        |
|------------+-------------------------------|

#### Supported Factors for Providers

Each provider only supports a subset of factor types.  The following table lists the factor types supported for each provider:

|------------+------------------------|
| Provider   | Factor Type            |
| ---------- | -----------------------|
| `OKTA`     | `push`                 |
| `OKTA`     | `question`             |
| `OKTA`     | `sms`                  |
| `OKTA`     | `token:software:totp`  |
| `GOOGLE`   | `token:software:totp`  |
| `SYMANTEC` | `token`                |
| `RSA`      | `token`                |
| `DUO`      | `web`                  |
| `YUBICO`   | `token:hardware`       |
|------------+------------------------|

### Factor Profile Object

Profiles are specific to the [factor type](#factor-type)

#### Question Profile

Specifies the profile for a `question` factor

|---------------+---------------------------+-----------+---------+---------+----------+-----------+-----------+------------|
| Property      | Description               | DataType  | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ------------- | ------------------------- | --------- | -------- | -------| -------- | --------- | --------- | ---------- |
| question      | unique key for question   | String    | FALSE    | TRUE   | TRUE     |           |           |            |
| questionText  | display text for question | String    | FALSE    | FALSE  | TRUE     |           |           |            |
| answer        | answer to question        | String    | TRUE     | FALSE  | FALSE    |           |           |            |
|---------------+---------------------------+-----------+---------+---------+----------+-----------+-----------+------------|

~~~json
{
  "profile": {
    "question": "favorite_art_piece",
    "questionText": "What is your favorite piece of art?"
  }
}
~~~

#### SMS Profile

Specifies the profile for a `sms` factor

|---------------+-------------------------------+-----------------------------------------------------------------+----------+---------+----------+-----------+-----------+------------|
| Property      | Description                   | DataType                                                        | Nullable | Unique  | Readonly | MinLength | MaxLength | Validation |
| ------------- | ----------------------------- | --------------------------------------------------------------- | -------- | ------- | -------- | --------- | --------- | ---------- |
| phoneNumber   | phone number of mobile device | String [E.164 formatted](http://en.wikipedia.org/wiki/E.164)    | FALSE    | TRUE    | FALSE    |           | 15        |            |
|---------------+-------------------------------+-----------------------------------------------------------------+----------+---------+----------+-----------+-----------+------------|

~~~json
{
  "profile": {
    "phoneNumber": "+1-555-415-1337"
  }
}
~~~

E.164 numbers can have a maximum of fifteen digits and are usually written as follows: [+][country code][subscriber number including area code]. Phone numbers that are not formatted in E.164 may work, but it depends on the phone or handset that is being used as well as the carrier from which the call or SMS is being originated.

For example, to convert a US phone number (415 599 2671) to E.164 format, one would need to add the ‘+’ prefix and the country code (which is 1) in front of the number (+1 415 599 2671). In the UK and many other countries internationally, local dialing requires the addition of a 0 in front of the subscriber number. However, to use E.164 formatting, this 0 must be removed. A number such as 020 7183 8750 in the UK would be formatted as +44 20 7183 8750.


#### Token Profile

Specifies the profile for a `token`, `token:hardware`, `token:software`, or `token:software:totp` factor

|---------------+--------------------+-----------+----------+---------+----------+-----------+-----------+------------|
| Property      | Description        | DataType  | Nullable | Unique  | Readonly | MinLength | MaxLength | Validation |
| ------------- | ------------------ | --------- | -------- | ------- | -------- | --------- | --------- | ---------- |
| credentialId  | id for credential  | String    | FALSE    | FALSE   | TRUE     |           |           |            |
|---------------+--------------------+-----------+----------+---------+----------+-----------+-----------+------------|

~~~json
{
  "profile": {
    "credentialId": "dade.murphy@example.com"
  }
}
~~~

#### Web Profile

Specifies the profile for a `web` factor

|---------------+--------------------+-----------+----------+---------+----------+-----------+-----------+------------|
| Property      | Description        | DataType  | Nullable | Unique  | Readonly | MinLength | MaxLength | Validation |
| ------------- | ------------------ | --------- | -------- | ------- | -------- | --------- | --------- | ---------- |
| credentialId  | id for credential  | String    | FALSE    | FALSE   | TRUE     |           |           |            |
|---------------+--------------------+-----------+----------+---------+----------+-----------+-----------+------------|

~~~json
{
  "profile": {
    "credentialId": "dade.murphy@example.com"
  }
}
~~~

### Factor Verification Object

Specifies additional verification data for `token` or `token:hardware` factors

|---------------+----------------------------+-----------+----------+---------+----------+-----------+-----------+------------|
| Property      | Description                | DataType  | Nullable | Unique  | Readonly | MinLength | MaxLength | Validation |
| ------------- | -------------------------- | --------- | -------- | ------- | -------- | --------- | --------- | ---------- |
| passCode     | OTP for current time window | String    | FALSE    | FALSE   | FALSE    |           |           |            |
| nextPassCode | OTP for next time window    | String    | TRUE     | FALSE   | FALSE    |           |           |            |
|--------------+-----------------------------+-----------+----------+---------+----------+-----------+-----------+------------|

~~~json
{
  "verify": {
    "passCode": "875498",
    "nextPassCode": "678195"
  }
}
~~~

### Links Object

Specifies link relations (See [Web Linking](http://tools.ietf.org/html/rfc5988)) available for the current status of a factor using the [JSON Hypertext Application Language](http://tools.ietf.org/html/draft-kelly-json-hal-06) specification.  This object is used for dynamic discovery of related resources and lifecycle operations.

|--------------------+--------------------------------------------------------------------------------- |
| Link Relation Type | Description                                                                      |
| ------------------ | -------------------------------------------------------------------------------- |
| self               | The actual factor                                                                |
| activate           | [Lifecycle action](#activate-factor) to transition factor to `ACTIVE` status     |
| questions          | List of questions for the `question` factor type                                 |
| verify             | [Verify the factor](#factor-verification-operations)                             |
| send               | List of delivery options to send an activation or factor challenge               |
| resend             | List of delivery options to resend activation or factor challenge                |
| poll               | Polls factor for completion of activation of verification                        |
|--------------------+--------------------------------------------------------------------------------- |

> The Links Object is **read-only**

## Embedded Resources

### TOTP Factor Activation Object

TOTP factors when activated have an embedded activation object which describes the [TOTP](http://tools.ietf.org/html/rfc6238) algorithm parameters.

|----------------+---------------------------------------------------+----------------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|
| Property       | Description                                       | DataType                                                       | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------- | -------- | ------ | -------- | --------- | --------- | ---------- |
| timeStep       | time-step size for TOTP                           | String                                                         | FALSE    | FALSE  | TRUE     |           |           |            |
| sharedSecret   | unique secret key for prover                      | String                                                         | FALSE    | FALSE  | TRUE     |           |           |            |
| encoding       | encoding of `sharedSecret`                        | `base32` or `base64`                                           | FALSE    | FALSE  | TRUE     |           |           |            |
| keyLength      | number of digits in an HOTP value                 | Number                                                         | FALSE    | FALSE  | TRUE     |           |           |            |
| _links         | discoverable resources related to the activation  | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06) | TRUE     | FALSE  | TRUE     |           |           |            |
|----------------+---------------------------------------------------+----------------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|

~~~json
{
  "activation": {
    "timeStep": 30,
    "sharedSecret": "HE64TMLL2IUZW2ZLB",
    "encoding": "base32",
    "keyLength": 6
  }
}
~~~

### Push Factor Activation Object

Push factors must complete activation on the device by scanning the QR code or visiting activation link sent via email or sms.

|----------------+---------------------------------------------------+----------------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|
| Property       | Description                                       | DataType                                                       | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------- | -------- | ------ | -------- | --------- | --------- | ---------- |
| expiresAt      | lifetime of activation                            | Date                                                           | FALSE    | FALSE  | TRUE     |           |           |            |
| factorResult   | result of factor activation                       | `WAITING`, `CANCELLED`, `TIMEOUT`, or `ERROR`                  | FALSE    | FALSE  | TRUE     |           |           |            |
| _links         | discoverable resources related to the activation  | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06) | FALSE    | FALSE  | TRUE     |           |           |            |
|----------------+---------------------------------------------------+----------------------------------------------------------------+----------+--------+----------+-----------+-----------+------------|

~~~json
{
  "activation": {
    "expiresAt": "2015-11-13T07:44:22.000Z",
    "factorResult": "WAITING",
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

#### Push Factor Activation Links Object

Specifies link relations (See [Web Linking](http://tools.ietf.org/html/rfc5988)) available for the push factor activation object using the [JSON Hypertext Application Language](http://tools.ietf.org/html/draft-kelly-json-hal-06) specification.  This object is used for dynamic discovery of related resources and operations.

|--------------------+------------------------------------------------------------------------------------|
| Link Relation Type | Description                                                                        |
| ------------------ | ---------------------------------------------------------------------------------- |
| qrcode             | QR code that encodes the push activation code needed for enrollment on the device  |
| send               | Sends an activation link via `email` or `sms` for users who can't scan the QR code |
|--------------------+------------------------------------------------------------------------------------|


### Factor Verify Result Object

Describes the outcome of a factor verification request

|---------------+---------------------------------------------------+---------------------------------+----------+--------+----------|-----------|-----------+------------|
| Property      | Description                                       | DataType                        | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ------------- | ------------------------------------------------- | ------------------------------- | -------- | ------ | -------- | --------- | --------- | ---------- |
| factorResult  | result of factor verification                     | [Factor Result](#factor-result) | FALSE    | FALSE  | TRUE     |           |           |            |
| factorMessage | optional display message for factor verification  | String                          | TRUE     | FALSE  | TRUE     |           |           |            |
|---------------+---------------------------------------------------+---------------------------------+----------+--------+----------|-----------|-----------+------------|

#### Factor Result

Specifies the status of a factor verification attempt

|------------------------+-------------------------------------------------------------------------------------------------------------------------------------|
| Result                 | Description                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------|
| `SUCCESS`              | Factor was successfully verified                                                                                                    |
| `CHALLENGE`            | Another verification is required                                                                                                    |
| `WAITING`              | Factor verification has started but not yet completed (e.g user hasn't answered phone call yet)                                     |
| `FAILED`               | Factor verification failed                                                                                                          |
| `REJECTED`             | Factor verification was denied by user                                                                                              |
| `CANCELLED`            | Factor verification was canceled by user                                                                                            |
| `TIMEOUT`              | Unable to verify factor within the allowed time window                                                                              |
| `TIME_WINDOW_EXCEEDED` | Factor was successfully verified but outside of the computed time window.  Another verification is required in current time window. |
| `PASSCODE_REPLAYED`    | Factor was previously verified within the same time window.  User must wait another time window and retry with a new verification.  |
| `ERROR`                | Unexpected server error occurred verifying factor.                                                                                  |
|------------------------+-------------------------------------------------------------------------------------------------------------------------------------|

## Factor Operations

### Get Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-get"><span class="api-label">GET</span> /api/v1/users/*:uid*/factors/*:fid*

Fetches a factor for the specified user.

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |
fid          | `id` of factor                                      | URL        | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

[Factor](#factor-model)

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X GET \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ufs2bysphxKODSZKWVCT"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "id": "sms2gt8gzgEBPUWBIFHN",
  "factorType": "sms",
  "provider": "OKTA",
  "status": "ACTIVE",
  "created": "2014-06-27T20:27:26.000Z",
  "lastUpdated": "2014-06-27T20:27:26.000Z",
  "profile": {
    "phoneNumber": "+1-555-415-1337"
  },
  "_links": {
    "verify": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/sms2gt8gzgEBPUWBIFHN/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "self": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/sms2gt8gzgEBPUWBIFHN",
      "hints": {
        "allow": [
          "GET",
          "DELETE"
        ]
      }
    },
    "user": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    }
  }
}
~~~

### List Enrolled Factors
{:.api .api-operation}

<span class="api-uri-template api-uri-get"><span class="api-label">GET</span> /api/v1/users/*:uid*/factors

Enumerates all the enrolled factors for the specified user.

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

Array of [Factors](#factor-model)

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X GET \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
[
  {
    "id": "ufs2bysphxKODSZKWVCT",
    "factorType": "question",
    "provider": "OKTA",
    "status": "ACTIVE",
    "created": "2014-04-15T18:10:06.000Z",
    "lastUpdated": "2014-04-15T18:10:06.000Z",
    "profile": {
      "question": "favorite_art_piece",
      "questionText": "What is your favorite piece of art?"
    },
    "_links": {
      "questions": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/questions",
        "hints": {
          "allow": [
            "GET"
          ]
        }
      },
      "self": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ufs2bysphxKODSZKWVCT",
        "hints": {
          "allow": [
            "GET",
            "DELETE"
          ]
        }
      },
      "user": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
        "hints": {
          "allow": [
            "GET"
          ]
        }
      }
    }
  },
  {
    "id": "ostf2gsyictRQDSGTDZE",
    "factorType": "token:software:totp",
    "provider": "OKTA",
    "status": "PENDING_ACTIVATION",
    "created": "2014-06-27T20:27:33.000Z",
    "lastUpdated": "2014-06-27T20:27:33.000Z",
    "profile": {
      "credentialId": "dade.murphy@example.com"
    },
    "_links": {
      "next": {
        "name": "activate",
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf2gsyictRQDSGTDZE/lifecycle/activate",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      },
      "self": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf2gsyictRQDSGTDZE",
        "hints": {
          "allow": [
            "GET"
          ]
        }
      },
      "user": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
        "hints": {
          "allow": [
            "GET"
          ]
        }
      }
    },
    "_embedded": {
      "activation": {
        "timeStep": 30,
        "sharedSecret": "HE64TMLL2IUZW2ZLB",
        "encoding": "base32",
        "keyLength": 16
      }
    }
  },
  {
    "id": "sms2gt8gzgEBPUWBIFHN",
    "factorType": "sms",
    "provider": "OKTA",
    "status": "ACTIVE",
    "created": "2014-06-27T20:27:26.000Z",
    "lastUpdated": "2014-06-27T20:27:26.000Z",
    "profile": {
      "phoneNumber": "+1-555-415-1337"
    },
    "_links": {
      "verify": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/sms2gt8gzgEBPUWBIFHN/verify",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      },
      "self": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/sms2gt8gzgEBPUWBIFHN",
        "hints": {
          "allow": [
            "GET",
            "DELETE"
          ]
        }
      },
      "user": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
        "hints": {
          "allow": [
            "GET"
          ]
        }
      }
    }
  }
]
~~~

### List Factors to Enroll
{:.api .api-operation}

<span class="api-uri-template api-uri-get"><span class="api-label">GET</span> /api/v1/users/*:uid*/factors/catalog

Enumerates all the [supported factors](#supported-factors-for-providers) that can be enrolled for the specified user.

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

Array of [Factors](#factor-model)

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X GET \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/catalog"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
[
  {
    "factorType": "question",
    "provider": "OKTA",
    "_links": {
      "questions": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/questions",
        "hints": {
          "allow": [
            "GET"
          ]
        }
      },
      "enroll": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors",
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
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors",
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
    "provider": "GOOGLE",
    "_links": {
      "enroll": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors",
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
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      }
    }
  },
  {
    "factorType": "token",
    "provider": "RSA",
    "_links": {
      "enroll": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      }
    }
  },
  {
    "factorType": "token",
    "provider": "SYMANTEC",
    "_links": {
      "enroll": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      }
    }
  }
]
~~~

### List Security Questions
{:.api .api-operation}

<span class="api-uri-template api-uri-get"><span class="api-label">GET</span> /api/v1/users/*:uid*/factors/questions

Enumerates all available security questions for a user's `question` factor.

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

Array of Questions

|---------------+---------------------------+-----------+----------+--------+----------+-----------+-----------+------------|
| Property      | Description               | DataType  | Nullable | Unique | Readonly | MinLength | MaxLength | Validation |
| ------------- | ------------------------- | --------- | -------- | -------| -------- | --------- | --------- | ---------- |
| question      | unique key for question   | String    | FALSE    | TRUE   | TRUE     |           |           |            |
| questionText  | display text for question | String    | FALSE    | FALSE  | TRUE     |           |           |            |
|---------------+---------------------------+-----------+----------+--------+----------+-----------+-----------+------------|

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X GET \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/questions"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
[
  {
    "question": "disliked_food",
    "questionText": "What is the food you least liked as a child?"
  },
  {
    "question": "name_of_first_plush_toy",
    "questionText": "What is the name of your first stuffed animal?"
  },
  {
    "question": "first_award",
    "questionText": "What did you earn your first medal or award for?"
  }
]
~~~

## Factor Lifecycle Operations

### Enroll Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /api/v1/users/*:id*/factors

Enrolls a user with a supported [factor](#list-factors-to-enroll).

- [Enroll Okta Security Question Factor](#enroll-okta-security-question-factor)
- [Enroll Okta SMS Factor](#enroll-okta-sms-factor)
- [Enroll Okta Verify TOTP Factor](#enroll-okta-verify-totp-factor)
- [Enroll Okta Verify Push Factor](#enroll-okta-verify-push-factor)
- [Enroll Google Authenticator Factor](#enroll-google-authenticator-factor)
- [Enroll RSA SecurID Factor](#enroll-rsa-securid-factor)
- [Enroll Symantec VIP Factor](#enroll-symantec-vip-factor)
- [Enroll YubiKey Factor](#enroll-yubikey-factor)

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                   | Param Type  | DataType                | Required | Default
------------ | --------------------------------------------- | ----------- | ----------------------- | -------- | -------
id           | `id` of user                                  | URL         | String                  | TRUE     |
templateId   | `id` of SMS template (only for SMS factor)    | Query       | String                  | FALSE    |
factor       | Factor                                        | Body        | [Factor](#factor-model) | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

All responses return the enrolled [Factor](#factor-model) with a status of either `PENDING_ACTIVATION` or `ACTIVE`.

> Some [factor types](#factor-type) require [activation](#activate-factor) to complete the enrollment process

#### Enroll Okta Security Question Factor
{:.api .api-operation}

Enrolls a user with the `question` factor and [question profile](#question-profile).

> Security Question factor does not require activation and is `ACTIVE` after enrollment

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "factorType": "question",
  "provider": "OKTA",
  "profile": {
    "question": "disliked_food",
    "answer": "mayonnaise"
  }
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "id": "ufs1o01OTMGHLAJPVHDZ",
  "factorType": "question",
  "provider": "OKTA",
  "status": "ACTIVE",
  "created": "2014-08-05T22:58:49.000Z",
  "lastUpdated": "2014-08-05T22:58:49.000Z",
  "profile": {
    "question": "disliked_food",
    "questionText": "What is the food you least liked as a child?"
  },
  "_links": {
    "questions": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/questions",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    },
    "self": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ufs1o01OTMGHLAJPVHDZ",
      "hints": {
        "allow": [
          "GET",
          "DELETE"
        ]
      }
    },
    "user": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    }
  }
}
~~~

#### Enroll Okta SMS Factor
{:.api .api-operation}

Enrolls a user with the Okta `sms` factor and a [SMS profile](#sms-profile).  A text message with an OTP is sent to the device during enrollment and must be [activated](#activate-sms-factor) by following the `activate` link relation to complete the enrollment process.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "factorType": "sms",
  "provider": "OKTA",
  "profile": {
    "phoneNumber": "+1-555-415-1337"
  }
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "id": "mbl1nz9JHJGHWRKMTLHP",
  "factorType": "sms",
  "provider": "OKTA",
  "status": "PENDING_ACTIVATION",
  "created": "2014-08-05T20:59:49.000Z",
  "lastUpdated": "2014-08-06T03:59:49.000Z",
  "profile": {
    "phoneNumber": "+1-555-415-1337"
  },
  "_links": {
    "activate": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/mbl1nz9JHJGHWRKMTLHP/lifecycle/activate",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "resend": [
      {
        "name": "sms",
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/mbl1nz9JHJGHWRKMTLHP/resend",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      }
    ],
    "self": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/mbl1nz9JHJGHWRKMTLHP",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    },
    "user": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    }
  }
}
~~~

###### Rate Limit

`429 Too Many Requests` status code may be returned if you attempt to resend a SMS challenge (OTP) within the same time window.

*The current rate limit is 1 SMS challenge per device every 30 seconds.*

> Okta will round-robin between SMS providers with every resend request to help ensure delivery of SMS OTP across different carriers

~~~json
{
    "errorCode": "E0000047",
    "errorSummary": "API call exceeded rate limit due to too many requests.",
    "errorLink": "E0000047",
    "errorId": "oaeneEaQF8qQrepOWHSkdoejw",
    "errorCauses": []
}
~~~

##### Enroll Okta SMS Factor Using Custom Template
{:.api .api-operation}

Customize (and optionally localize) the SMS message sent to the user on enrollment. 
* If the request has an `Accept_Language` header and the template contains a translation for that language, the SMS message is sent using the translated template. 
* If the language provided in the `Accept-Language` header doesn't exist, the SMS message is sent using the template text. 
* If the provided <em>templateId</em> doesn't match the existing template, the SMS message is sent using the default template.

>For instructions about how to create custome templates, see [SMS Template](templates.html#sms-template).


###### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "factorType": "sms",
  "provider": "OKTA",
  "profile": {
    "phoneNumber": "+1-555-415-1337"
  }
}' "https://${org}.okta.com/api/v1/users/${userId}/factors?templateId=${templateId}"
~~~

##### Resend SMS as Part of Enrollment Using a Custom Template
{:.api .api-operation}

Customize (and optionally localize) the SMS message sent to the user in case Okta needs to resend the message as part of enrollment.

>For instructions about how to create custome templates, see [SMS Template](templates.html#sms-template).


###### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Accept-Language: fr" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "factorType": "sms",
  "provider": "OKTA",
  "profile": {
    "phoneNumber": "+1-555-415-1337"
  }
}' "https://${org}.okta.com/api/v1/users/${userId}/factors/${factorId}/resend?templateId=${templateId}"
~~~


#### Enroll Okta Verify TOTP Factor
{:.api .api-operation}

Enrolls a user with an Okta `token:software:totp` factor.  The factor must be [activated](#activate-totp-factor) after enrollment by following the `activate` link relation to complete the enrollment process.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "factorType": "token:software:totp",
  "provider": "OKTA"
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "id": "ostf1fmaMGJLMNGNLIVG",
  "factorType": "token:software:totp",
  "provider": "OKTA",
  "status": "PENDING_ACTIVATION",
  "created": "2014-07-16T16:13:56.000Z",
  "lastUpdated": "2014-07-16T16:13:56.000Z",
  "profile": {
    "credentialId": "dade.murphy@example.com"
  },
  "_links": {
    "activate": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf1fmaMGJLMNGNLIVG/lifecycle/activate",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "self": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf1fmaMGJLMNGNLIVG",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    },
    "user": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    }
  },
  "_embedded": {
    "activation": {
      "timeStep": 30,
      "sharedSecret": "JBTWGV22G4ZGKV3N",
      "encoding": "base32",
      "keyLength": 6
    },
    "_links": {
      "qrcode": {
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf1fmaMGJLMNGNLIVG/qr/00fukNElRS_Tz6k-CFhg3pH4KO2dj2guhmaapXWbc4",
        "type": "image/png"
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
-H "Authorization: SSWS ${api_token}" \
-d '{
  "factorType": "push",
  "provider": "OKTA",
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "id": "opfbtzzrjgwauUsxO0g4",
  "factorType": "push",
  "provider": "OKTA",
  "status": "PENDING_ACTIVATION",
  "created": "2015-11-13T07:34:22.000Z",
  "lastUpdated": "2015-11-13T07:34:22.000Z",
  "_links": {
    "poll": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfbtzzrjgwauUsxO0g4/lifecycle/activate/poll",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "self": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfbtzzrjgwauUsxO0g4",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    },
    "user": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    }
  },
  "_embedded": {
    "activation": {
      "expiresAt": "2015-11-13T07:44:22.000Z",
      "factorResult": "WAITING",
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
}
~~~

#### Enroll Google Authenticator Factor
{:.api .api-operation}

Enrolls a user with the Google `token:software:totp` factor.  The factor must be [activated](#activate-totp-factor) after enrollment by following the `activate` link relation to complete the enrollment process.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "factorType": "token:software:totp",
  "provider": "GOOGLE"
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "id": "ostf1fmaMGJLMNGNLIVG",
  "factorType": "token:software:totp",
  "provider": "GOOGLE",
  "status": "PENDING_ACTIVATION",
  "created": "2014-07-16T16:13:56.000Z",
  "lastUpdated": "2014-07-16T16:13:56.000Z",
  "profile": {
    "credentialId": "dade.murphy@example.com"
  },
  "_links": {
    "activate": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf1fmaMGJLMNGNLIVG/lifecycle/activate",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "self": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf1fmaMGJLMNGNLIVG",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    },
    "user": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    }
  },
  "_embedded": {
    "activation": {
      "timeStep": 30,
      "sharedSecret": "JBTWGV22G4ZGKV3N",
      "encoding": "base32",
      "keyLength": 16,
      "_links": {
        "qrcode": {
          "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf1fmaMGJLMNGNLIVG/qr/00fukNElRS_Tz6k-CFhg3pH4KO2dj2guhmaapXWbc4",
          "type": "image/png"
        }
      }
    }
  }
}
~~~

#### Enroll RSA SecurID Factor
{:.api .api-operation}

Enrolls a user with a RSA SecurID factor and a [token profile](#token-profile).  RSA tokens must be verified with the [current pin+passcode](#factor-verification-object) as part of the enrollment request.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "factorType": "token",
  "provider": "RSA",
  "profile": {
    "credentialId": "dade.murphy@example.com"
  },
  "verify": {
    "passCode": "5275875498",
  }
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "id": "rsabtznMn6cp94ez20g4",
  "factorType": "token",
  "provider": "RSA",
  "status": "ACTIVE",
  "created": "2015-11-13T07:05:53.000Z",
  "lastUpdated": "2015-11-13T07:05:53.000Z",
  "profile": {
    "credentialId": "dade.murphy@example.com"
  },
  "_links": {
    "verify": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/rsabtznMn6cp94ez20g4/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "self": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/rsabtznMn6cp94ez20g4",
      "hints": {
        "allow": [
          "GET",
          "DELETE"
        ]
      }
    },
    "user": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    }
  }
}
~~~

#### Enroll Symantec VIP Factor
{:.api .api-operation}

Enrolls a user with a Symantec VIP factor and a [token profile](#token-profile).  Symantec tokens must be verified with the [current and next passcodes](#factor-verification-object) as part of the enrollment request.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "factorType": "token",
  "provider": "SYMANTEC",
  "profile": {
    "credentialId": "VSMT14393584"
  },
  "verify": {
    "passCode": "875498",
    "nextPassCode": "678195"
  }
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "id": "ufvbtzgkYaA7zTKdQ0g4",
  "factorType": "token",
  "provider": "SYMANTEC",
  "status": "ACTIVE",
  "created": "2015-11-13T06:52:08.000Z",
  "lastUpdated": "2015-11-13T06:52:08.000Z",
  "profile": {
    "credentialId": "VSMT14393584"
  },
  "_links": {
    "verify": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ufvbtzgkYaA7zTKdQ0g4/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "self": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ufvbtzgkYaA7zTKdQ0g4",
      "hints": {
        "allow": [
          "GET",
          "DELETE"
        ]
      }
    },
    "user": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    }
  }
}
~~~

#### Enroll YubiKey Factor
{:.api .api-operation}

Enrolls a user with a YubiCo factor (YubiKey).  YubiKeys must be verified with the [current passcode](#factor-verification-object) as part of the enrollment request.

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
  "verify": {
    "passCode": "cccccceukngdfgkukfctkcvfidnetljjiknckkcjulji"
  }
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "id": "ykfbty3BJeBgUi3750g4",
  "factorType": "token:hardware",
  "provider": "YUBICO",
  "status": "ACTIVE",
  "created": "2015-11-13T05:27:49.000Z",
  "lastUpdated": "2015-11-13T05:27:49.000Z",
  "profile": {
    "credentialId": "000004102994"
  },
  "_links": {
    "verify": {
      "href": "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ykfbty3BJeBgUi3750g4/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "self": {
      "href": "hhttps://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ykfbty3BJeBgUi3750g4",
      "hints": {
        "allow": [
          "GET",
          "DELETE"
        ]
      }
    },
    "user": {
      "href": "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    }
  }
}
~~~


### Activate Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /users/*:uid*/factors/*:fid*/lifecycle/activate</span>

The `sms` and `token:software:totp` [factor types](#factor-type) require activation to complete the enrollment process.

- [Activate TOTP Factor](#activate-totp-factor)
- [Activate SMS Factor](#activate-sms-factor)
- [Activate Push Factor](#activate-push-factor)

#### Activate TOTP Factor
{:.api .api-operation}

Activates a `token:software:totp` factor by verifying the OTP.

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |
fid          | `id` of factor returned from enrollment             | URL        | String   | TRUE     |
passCode     | OTP generated by device                             | Body       | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

If the passcode is correct you will receive the [Factor](#factor-model) with an `ACTIVE` status.

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

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "passCode": "123456"
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf1fmaMGJLMNGNLIVG/lifecycle/activate"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "id": "ostf1fmaMGJLMNGNLIVG",
  "factorType": "token:software:totp",
  "provider": "OKTA",
  "status": "ACTIVE",
  "created": "2014-07-16T16:13:56.000Z",
  "lastUpdated": "2014-08-06T00:31:07.000Z",
  "profile": {
    "credentialId": "dade.murphy@example.com"
  },
  "_links": {
    "verify": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf1fmaMGJLMNGNLIVG/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "self": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf1fmaMGJLMNGNLIVG",
      "hints": {
        "allow": [
          "GET",
          "DELETE"
        ]
      }
    },
    "user": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    }
  }
}
~~~

#### Activate SMS Factor
{:.api .api-operation}

Activates a `sms` factor by verifying the OTP.  The request/response is identical to [activating a TOTP factor](#activate-totp-factor).

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |
fid          | `id` of factor returned from enrollment             | URL        | String   | TRUE     |
passCode     | OTP sent to mobile device                           | Body       | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

If the passcode is correct you will receive the [Factor](#factor-model) with an `ACTIVE` status.

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

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "passCode": "123456"
}' "https://${org}.okta.com/api/v1/users/users/00u15s1KDETTQMQYABRL/factors/sms1o51EADOTFXHHBXBP/lifecycle/activate"
~~~

##### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "id": "sms1o51EADOTFXHHBXBP",
  "factorType": "sms",
  "provider": "OKTA",
  "status": "ACTIVE",
  "created": "2014-08-06T16:56:31.000Z",
  "lastUpdated": "2014-08-06T16:56:31.000Z",
  "profile": {
    "phoneNumber": "+1-555-415-1337"
  },
  "_links": {
    "verify": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/sms1o51EADOTFXHHBXBP/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "self": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/sms1o51EADOTFXHHBXBP",
      "hints": {
        "allow": [
          "GET",
          "DELETE"
        ]
      }
    },
    "user": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
      "hints": {
        "allow": [
          "GET"
        ]
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

Parameter | Description    | Param Type | DataType | Required | Default
--------- | -------------- | ---------- | -------- | -------- | -------
uid       | `id` of user   | URL        | String   | TRUE     |
fid       | `id` of factor | URL        | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

Parameter        | Description                    | Param Type | DataType                                                        | Required | Default
---------------- | ------------------------------ | ---------- | --------------------------------------------------------------- | -------- | -------
activationResult | asynchronous activation result | Body       | [Push Factor Activation Object](#push-factor-activation-object) | TRUE     |

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/users/users/00u15s1KDETTQMQYABRL/factors/opf3hkfocI4JTLAju0g4/lifecycle/activate"
~~~

#### Response Example (Waiting)
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-04-01T15:57:32.000Z",
  "factorResult": "WAITING",
  "_links": {
    "poll": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opf3hkfocI4JTLAju0g4/lifecycle/activate",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "qrcode": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opf3hkfocI4JTLAju0g4/qr/00fukNElRS_Tz6k-CFhg3pH4KO2dj2guhmaapXWbc4",
      "type": "image/png"
    },
    "send": [
      {
        "name": "email",
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opf3hkfocI4JTLAju0g4/lifecycle/activate/email",
        "hints": {
          "allow": [
            "POST"
          ]
        }
      },
      {
        "name": "sms",
        "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opf3hkfocI4JTLAju0g4/lifecycle/activate/sms",
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

#### Response Example (Timeout)
{:.api .api-response .api-response-example}

~~~json
{
    "factorResult": "TIMEOUT",
    "_links": {
        "activate": {
            "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opf3hkfocI4JTLAju0g4/lifecycle/activate",
            "hints": {
                "allow": [
                    "POST"
                ]
            }
        }
    }
}
~~~

#### Response Example (Activated)
{:.api .api-response .api-response-example}

~~~json
{
    "id": "opf3hkfocI4JTLAju0g4",
    "factorType": "push",
    "provider": "OKTA",
    "status": "ACTIVE",
    "created": "2015-03-16T18:01:28.000Z",
    "lastUpdated": "2015-08-27T14:25:17.000Z",
    "profile": {
      "credentialId": "dade.murphy@example.com",
      "deviceType": "SmartPhone_IPhone",
      "name": "Gibson",
      "platform": "IOS",
      "version": "9.0"
    },
    "_links": {
        "verify": {
            "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opf3hkfocI4JTLAju0g4/verify",
            "hints": {
                "allow": [
                    "POST"
                ]
            }
        },
        "self": {
            "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opf3hkfocI4JTLAju0g4",
            "hints": {
                "allow": [
                    "GET",
                    "DELETE"
                ]
            }
        },
        "user": {
            "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL",
            "hints": {
                "allow": [
                    "GET"
                ]
            }
        }
    }
}
~~~


### Reset Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-delete"><span class="api-label">DELETE</span> /api/v1/users/*:uid*/factors/*:fid*

Unenrolls an existing factor for the specified user allowing the user to enroll a new factor.

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |
fid          | `id` of the factor to reset                         | URL        | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

`204 No Content`

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X DELETE \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ufs1o01OTMGHLAJPVHDZ"
~~~

#### Response Example
{:.api .api-response .api-response-example}

`204 No Content`

## Factor Verification Operations

### Verify Security Question Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /users/*:uid*/factors/*:fid*/verify</span>

Verifies an answer to a `question` factor.

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |
fid          | `id` of factor                                      | URL        | String   | TRUE     |
answer       | answer to security question                         | Body       | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

Parameter    | Description                                         | Param Type | DataType                                            | Required | Default
------------ | --------------------------------------------------- | ---------- | --------------------------------------------------- | -------- | -------
factorResult | verification result                                 | Body       | [Factor Verify Result](#factor-verify-result-object) | TRUE     |

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

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "answer": "mayonnaise"
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ufs1pe3ISGKGPYKXRBKK/verify"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "factorResult": "SUCCESS"
}
~~~


### Verify SMS Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /users/*:uid*/factors/*:fid*/verify</span>

Verifies an OTP for a `sms` factor.

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |
fid          | `id` of factor                                      | URL        | String   | TRUE     |
templateId   | `id` of SMS template                                | Query      | String   | FALSE    |
passCode     | OTP sent to device                                  | Body       | String   | FALSE    |

> If you omit `passCode` in the request a new OTP will be sent to the device, otherwise the request will attempt to verify the `passCode`

#### Response Parameters
{:.api .api-response .api-response-params}

Parameter    | Description                                         | Param Type | DataType                                            | Required | Default
------------ | --------------------------------------------------- | ---------- | --------------------------------------------------- | -------- | -------
factorResult | verification result                                 | Body       | [Factor Verify Result](#factor-verify-result-object) | TRUE     |

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

`429 Too Many Requests` status code may be returned if you attempt to resend a SMS challenge (OTP) within the same time window.

*The current rate limit is 1 SMS challenge per device every 30 seconds.*

> Okta will round-robin between SMS providers with every resend request to help ensure delivery of SMS OTP across different carriers

~~~json
{
    "errorCode": "E0000047",
    "errorSummary": "API call exceeded rate limit due to too many requests.",
    "errorLink": "E0000047",
    "errorId": "oaeneEaQF8qQrepOWHSkdoejw",
    "errorCauses": []
}
~~~

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "passCode": "123456"
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf17zuKEUMYQAQGCOV/verify"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "factorResult": "SUCCESS"
}
~~~

#### Verify SMS Factor Using A Custom Template
{:.api .api-operation}

Customize (and optionally localize) the SMS message sent to the user on verification. 
* If the request has an `Accept-Language` header and the template contains translation for that language, the SMS message is sent in that language. 
* If the language provided in the `Accept-Language` header doesn't exist in the template definition, the SMS message is sent using the template text. 
* If the provided `templateId` doesn't match an existing template, the SMS message is sent using the default template.

>How to create custom template is described [here](templates.html#sms-template).


###### Request Example
{:.api .api-request .api-request-example}

This will send the verification message in German, assuming that the sms template is configured with German translation.

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Accept-Language: de" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  }
}' "https://${org}.okta.com/api/v1/users/${userId}/factors/${factorId}/verify?templateId=${templateId}"
~~~


### Verify TOTP Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /users/*:uid*/factors/*:fid*/verify</span>

Verifies an OTP for a `token:software:totp` factor.

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |
fid          | `id` of factor                                      | URL        | String   | TRUE     |
passCode     | OTP generated by device                             | Body       | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

Parameter    | Description                                         | Param Type | DataType                                            | Required | Default
------------ | --------------------------------------------------- | ---------- | --------------------------------------------------- | -------- | -------
factorResult | verification result                                 | Body       | [Factor Verify Result](#factor-verify-result-object) | TRUE     |

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

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "passCode": "123456"
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf17zuKEUMYQAQGCOV/verify"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "factorResult": "SUCCESS"
}
~~~

### Verify Push Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /users/*:uid*/factors/*:fid*/verify</span>

Creates a new verification transaction and sends an asynchronous push notification to the device for the user to approve or reject.  You must [poll the transaction](#poll-for-verify-transaction-completion) to determine when it completes or expires.

##### Start new Verify Transaction

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |
fid          | `id` of factor                                      | URL        | String   | TRUE     |

> The client `IP Address` & `User Agent` of the HTTP request is automatically captured and sent in the push notification as additional context.<br>You should [always send a valid User-Agent HTTP header](../getting_started/design_principles.html#user-agent) when verifying a push factor.

> The **public IP address** of your application must be [whitelisted as a gateway IP address](../getting_started/design_principles.html#ip-address) to forward the user agent's original IP address with the `X-Forwarded-For` HTTP header

#### Response Parameters
{:.api .api-response .api-response-params}

Parameter    | Description                                                          | Param Type | DataType                                             | Required | Default
------------ | -------------------------------------------------------------------- | ---------- | ---------------------------------------------------- | -------- | -------
factorResult | verification result (`WAITING`, `SUCCESS`, `REJECTED`, or `TIMEOUT`) | Body       | [Factor Verify Result](#factor-verify-result-object) | TRUE     |

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36" \
-H "X-Forwarded-For: 23.235.46.133" \
"https://${org}.okta.com/api/v1/users/users/00u15s1KDETTQMQYABRL/factors/opf3hkfocI4JTLAju0g4/verify"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-04-01T15:57:32.000Z",
  "factorResult": "WAITING",
  "_links": {
    "poll": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfh52xcuft3J4uZc0g3/transactions/mst1eiHghhPxf0yhp0g",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfh52xcuft3J4uZc0g3/transactions/mst1eiHghhPxf0yhp0g",
      "hints": {
        "allow": [
          "DELETE"
        ]
      }
    }
  }
}
~~~

#### Poll for Verify Transaction Completion
{:.api .api-operation}

<span class="api-uri-template api-uri-get"><span class="api-label">GET</span> /users/*:uid*/factors/*:fid*/transactions/*:tid*

Polls a push verification transaction for completion.  The transaction will have a result of `WAITING`, `SUCCESS`, `REJECTED`, or `TIMEOUT`.

> You should always use the `poll` link relation and never manually construct your own URL

##### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description         | Param Type | DataType | Required | Default
------------ | ------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user        | URL        | String   | TRUE     |
fid          | `id` of factor      | URL        | String   | TRUE     |
tid          | `id` of transaction | URL        | String   | TRUE     |

##### Response Parameters
{:.api .api-response .api-response-params}

Parameter    | Description         | Param Type | DataType                                             | Required | Default
------------ | ------------------- | ---------- | ---------------------------------------------------- | -------- | -------
factorResult | verification result | Body       | [Factor Verify Result](#factor-verify-result-object) | TRUE     |

##### Response Example (Waiting)
{:.api .api-response .api-response-example}

~~~json
{
  "expiresAt": "2015-04-01T15:57:32.000Z",
  "factorResult": "WAITING",
  "_links": {
    "poll": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfh52xcuft3J4uZc0g3/transactions/mst1eiHghhPxf0yhp0g",
      "hints": {
        "allow": [
          "GET"
        ]
      }
    },
    "cancel": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfh52xcuft3J4uZc0g3/transactions/mst1eiHghhPxf0yhp0g",
      "hints": {
        "allow": [
          "DELETE"
        ]
      }
    }
  }
}
~~~

#### Response Example (Approved)
{:.api .api-response .api-response-example}

~~~json
{
  "factorResult": "SUCCESS"
}
~~~

#### Response Example (Rejected)
{:.api .api-response .api-response-example}

~~~json
{
  "factorResult": "REJECTED",
  "_links": {
    "verify": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfh52xcuft3J4uZc0g3/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "factor": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfh52xcuft3J4uZc0g3",
      "hints": {
        "allow": [
          "GET",
          "DELETE"
        ]
      }
    }
  }
}
~~~

#### Response Example (Timeout)
{:.api .api-response .api-response-example}

~~~json
{
  "factorResult": "TIMEOUT",
  "_links": {
    "verify": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfh52xcuft3J4uZc0g3/verify",
      "hints": {
        "allow": [
          "POST"
        ]
      }
    },
    "factor": {
      "href": "https://your-domain.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/opfh52xcuft3J4uZc0g3",
      "hints": {
        "allow": [
          "GET",
          "DELETE"
        ]
      }
    }
  }
}
~~~

### Verify Token Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /users/*:uid*/factors/*:fid*/verify</span>

Verifies an OTP for a `token` or `token:hardware` factor.

#### Request Parameters
{:.api .api-request .api-request-params}

Parameter    | Description                                         | Param Type | DataType | Required | Default
------------ | --------------------------------------------------- | ---------- | -------- | -------- | -------
uid          | `id` of user                                        | URL        | String   | TRUE     |
fid          | `id` of factor                                      | URL        | String   | TRUE     |
passCode     | OTP generated by device                             | Body       | String   | TRUE     |

#### Response Parameters
{:.api .api-response .api-response-params}

Parameter    | Description                                         | Param Type | DataType                                             | Required | Default
------------ | --------------------------------------------------- | ---------- | ---------------------------------------------------- | -------- | -------
factorResult | verification result                                 | Body       | [Factor Verify Result](#factor-verify-result-object) | TRUE     |

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

#### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "passCode": "123456"
}' "https://${org}.okta.com/api/v1/users/00u15s1KDETTQMQYABRL/factors/ostf17zuKEUMYQAQGCOV/verify"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
  "factorResult": "SUCCESS"
}
~~~
