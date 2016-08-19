---
layout: docs_page
title: Factors Administration
redirect_from: "/docs/getting_started/factor_admin.html"
---

# Overview

The Okta Factors Administration API is a subset of the Factors API. It provides operations to activate or deactivate which factor types are available to use for multi-factor authentication. Activating a factor type with this API does not enable multi-factor authentication. It makes an activated factor available for multi-factor authentication only.

After activating a facor with this API, it cannot be used until you enable a policy that uses this factor. If there is only one factor enabled in the policy, this API cannot disable that factor.

> This API is currently in **Beta** status and provides no guarantees for backwards-compatibility.  Okta is free to break this API until it is released.


## Factor Model

Attribute     | Description                                                     | DataType                                                                       | MinLength | MaxLength | Nullable | Unique | Readonly
------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------- | --------- | -------- | ------ | --------
id            | the factor name                                                 | [Factor Name](#factor-name)                                                                        |           |           | FALSE    | TRUE   | TRUE
provider      | factor provider                                                 | [Provider Type](#provider-type)                                                |           |           | FALSE    | TRUE   | TRUE
factorType    | type of factor                                                  | [Factor Type](#factor-type)                                                    |           |           | FALSE    | TRUE   | TRUE
status        | status of factor                                                | `NOT_SETUP`, `PENDING_ACTIVATION`,  `ACTIVE`, `INACTIVE` |           |           | FALSE    | FALSE  | TRUE
_links        | [discoverable resources](#links-object) related to the factor   | [JSON HAL](http://tools.ietf.org/html/draft-kelly-json-hal-06)  | | | FALSE | FALSE | TRUE

### Factor Name

The following factor names are available:

Factor Name           | Description
--------------------- | -----------
`okta_otp`            | Okta Verify
`google_otp`          | Google Authenticator
`okta_sms`            | SMS Authentication
`symantec_vip`        | Symantec VIP
`rsa_token`           | RSA SecurID
`okta_question`       | Security Question

### Factor Type

The following factor types are supported:

Factor Type           | Description
--------------------- | -----------
`sms`                 | SMS
`token`               | A software or hardware one-time password [OTP](http://en.wikipedia.org/wiki/One-time_password) device
`token:software:totp` | Software [Time-based One-time Password (TOTP)](http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm)
`question`            | Additional security question

### Provider Type

The following providers are supported:

Provider   | Description
---------- | -----------------------------
`OKTA`     | Okta
`RSA`      | RSA SecurID Integration
`SYMANTEC` | Symantec VIP Integration
`GOOGLE`   | Google Integration

### Links Object

Specifies link relations (See [Web Linking](http://tools.ietf.org/html/rfc5988)) available for the current status of a factor using the [JSON Hypertext Application Language](http://tools.ietf.org/html/draft-kelly-json-hal-06) specification.  This object is used for dynamic discovery of related resources and lifecycle operations.

Link Relation Type | Description
------------------ | -----------
self               | The actual factor
activate           | Permits use of this factor for MFA
deactivate         | Denies use of this factor for MFA

> The Links Object is **read-only**

## Factors Administration Operations

### Get Org Factor
{:.api .api-operation}

<span class="api-uri-template api-uri-get"><span class="api-label">GET</span> /api/v1/org/factors

Fetches a factor for the specified user.

#### Request Parameters
{:.api .api-request .api-request-params}

No required parameters.

Optionally, you can add a filter, based on the status. If desired, add the text `filter=status eq 'status_value'` where status_value is one of the following:  `NOT_SETUP`, `PENDING_ACTIVATION`,  `ACTIVE`,  or `INACTIVE`.

#### Response Parameters
{:.api .api-response .api-response-params}

[Factor](#factor-model)

#### Request Example
{:.api .api-request .api-request-example}

~~~ shell
curl -v -H "Authorization: SSWS yourtoken" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-X GET "https://your-domain.okta.com/api/v1/org/factors"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
        "id": "google_otp",
        "provider": "GOOGLE",
        "factorType": "token:software:totp",
        "status": "ACTIVE",
        "_links": {
            "self": {
                "href": "http://your-domain.okta.com/api/v1/org/factors/google_otp",
                "hints": {
                    "allow": [
                        "GET"
                    ]
                }
            },
            "deactivate": {
                "href": "http://your-domain.okta.com/api/v1/org/factors/google_otp/lifecycle/deactivate",
                "hints": {
                    "allow": [
                        "POST"
                    ]
                }
            }
        }
    },
    {
        "id": "okta_question",
        "provider": "OKTA",
        "factorType": "question",
        "status": "INACTIVE",
        "_links": {
            "activate": {
                "href": "http://your-domain.okta.com/api/v1/org/factors/okta_question/lifecycle/activate",
                "hints": {
                    "allow": [
                        "POST"
                    ]
                }
            },
            "self": {
                "href": "http://your-domain.okta.com/api/v1/org/factors/okta_question",
                "hints": {
                    "allow": [
                        "GET"
                    ]
                }
            }
        }
    },
    {
        "id": "okta_otp",
        "provider": "OKTA",
        "factorType": "token:software:totp",
        "status": "ACTIVE",
        "_links": {
            "self": {
                "href": "http://your-domain.okta.com/api/v1/org/factors/okta_otp",
                "hints": {
                    "allow": [
                        "GET"
                    ]
                }
            },
            "deactivate": {
                "href": "http://ryour-domain.okta.com/api/v1/org/factors/okta_otp/lifecycle/deactivate",
                "hints": {
                    "allow": [
                        "POST"
                    ]
                }
            }
        }
    },
    {
        "id": "okta_sms",
        "provider": "OKTA",
        "factorType": "sms",
        "status": "ACTIVE",
        "_links": {
            "self": {
                "href": "http://your-domain.okta.com/api/v1/org/factors/okta_sms",
                "hints": {
                    "allow": [
                        "GET"
                    ]
                }
            },
            "deactivate": {
                "href": "http://your-domain.okta.com/api/v1/org/factors/okta_sms/lifecycle/deactivate",
                "hints": {
                    "allow": [
                        "POST"
                    ]
                }
            }
        }
    },
    {
        "id": "symantec_vip",
        "provider": "SYMANTEC",
        "factorType": "token",
        "status": "NOT_SETUP",
        "_links": {
            "activate": {
                "href": "http://ryour-domain.okta.com/api/v1/org/factors/symantec_vip/lifecycle/activate",
                "hints": {
                    "allow": [
                        "POST"
                    ]
                }
            },
            "self": {
                "href": "http://your-domain.okta.com/api/v1/org/factors/symantec_vip",
                "hints": {
                    "allow": [
                        "GET"
                    ]
                }
            }
        }
    },
    {
        "id": "rsa_token",
        "provider": "RSA",
        "factorType": "token",
        "status": "NOT_SETUP",
        "_links": {
            "activate": {
                "href": "http://your-domain.okta.com/api/v1/org/factors/rsa_token/lifecycle/activate",
                "hints": {
                    "allow": [
                        "POST"
                    ]
                }
            },
            "self": {
                "href": "http://your-domain.okta.com/api/v1/org/factors/rsa_token",
                "hints": {
                    "allow": [
                        "GET"
                    ]
                }
            }
        }
    }
~~~

### Activate SMS
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /api/v1/org/factors/okta_sms/lifecycle/activate

Allows multi-factor authentication to use an SMS factor.

#### Request Parameters
{:.api .api-request .api-request-params}

None.

#### Request Example
{:.api .api-request .api-request-example}

~~~ shell
curl -v -H "Authorization: SSWS yourtoken" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-X POST "https://your-domain.okta.com/api/v1/org/factors/okta_sms/lifecycle/activate"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
    "id": "okta_sms",
    "provider": "OKTA",
    "factorType": "sms",
    "status": "ACTIVE",
    "_links": {
        "self": {
            "href": "http://your-domain.okta.com/api/v1/org/factors/okta_sms",
            "hints": {
                "allow": [
                    "GET"
                ]
            }
        },
        "deactivate": {
            "href": "http://your-domain.okta.com/api/v1/org/factors/okta_sms/lifecycle/deactivate",
            "hints": {
                "allow": [
                    "POST"
                ]
            }
        }
    }
}
~~~

### Deactivate SMS
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /api/v1/org/factors/okta_sms/lifecycle/deactivate

Denies use of an SMS factor for multi-factor authentication.

#### Request Parameters
{:.api .api-request .api-request-params}

None.

#### Request Example
{:.api .api-request .api-request-example}

~~~ shell
curl -v -H "Authorization: SSWS yourtoken" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-X POST "https://your-domain.okta.com/api/v1/org/factors/okta_sms/lifecycle/deactivate"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
    "id": "okta_sms",
    "provider": "OKTA",
    "factorType": "sms",
    "status": "INACTIVE",
    "_links": {
        "activate": {
            "href": "http://your-domain.okta.com/api/v1/org/factors/okta_sms/lifecycle/activate",
            "hints": {
                "allow": [
                    "POST"
                ]
            }
        },
        "self": {
            "href": "http://your-domain.okta.com/api/v1/org/factors/okta_sms",
            "hints": {
                "allow": [
                    "GET"
                ]
            }
        }
    }
}
~~~

### Activate Okta Verify
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /api/v1/org/factors/okta_otp/lifecycle/activate

Allows multi-factor authentication to use Okta Verify as a factor.

#### Request Parameters
{:.api .api-request .api-request-params}

None.

#### Request Example
{:.api .api-request .api-request-example}

~~~ shell
curl -v -H "Authorization: SSWS yourtoken" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-X POST "https://your-domain.okta.com/api/v1/org/factors/okta_otp/lifecycle/activate"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
    "id": "okta_otp",
    "provider": "OKTA",
    "factorType": "token:software:totp",
    "status": "ACTIVE",
    "_links": {
        "self": {
            "href": "http://your-domain.okta.com/api/v1/org/factors/okta_otp",
            "hints": {
                "allow": [
                    "GET"
                ]
            }
        },
        "deactivate": {
            "href": "http://your-domain.okta.com/api/v1/org/factors/okta_otp/lifecycle/deactivate",
            "hints": {
                "allow": [
                    "POST"
                ]
            }
        }
    }
}
~~~

### Deactivate Okta Verify
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST</span> /api/v1/org/factors/okta_otp/lifecycle/deactivate

Denies use of Okta Verify for multi-factor authentication.

#### Request Parameters
{:.api .api-request .api-request-params}

None.

#### Request Example
{:.api .api-request .api-request-example}

~~~ shell
curl -v -H "Authorization: SSWS yourtoken" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-X POST "https://your-domain.okta.com/api/v1/org/factors/okta_otp/lifecycle/deactivate"
~~~

#### Response Example
{:.api .api-response .api-response-example}

~~~json
{
    "id": "okta_otp",
    "provider": "OKTA",
    "factorType": "token:software:totp",
    "status": "INACTIVE",
    "_links": {
        "activate": {
            "href": "http://your-domain.okta.com/api/v1/org/factors/okta_otp/lifecycle/activate",
            "hints": {
                "allow": [
                    "POST"
                ]
            }
        },
        "self": {
            "href": "http://your-domain.okta.com/api/v1/org/factors/okta_otp",
            "hints": {
                "allow": [
                    "GET"
                ]
            }
        }
    }
}
~~~
