---
layout: docs_page
title: Policy
redirect_from: "/docs/getting_started/policy.html"
---

> This API is currently in **Early Access (EA)** status.

# Overview

The Okta Policy API enables you to peform policy and rule operations. These operation apply to various policies including Okta Sign on.

This API supports the following **policy operations**:

* Get all policies of a specific type
* Create, read, update, and delete a policy
* Activate and deactivate a policy

This API supports the following **rule operations**:

* Get all rules for a policy
* Create, read, update, and delete a rule for a policy
* Activate and deactivate a rule

# Policies

## Policy Model and Defaults

### Default Policies

There is always a default policy created for each type of policy. The default policy applies to any users for whom other policies in the Okta org do not apply. This ensures that there is always a policy to apply to a user in all situations.

 - A default policy is required and cannot be deleted.
 - The default policy is always the last policy in the priority order. Any added policies of this type have higher priority than the default policy.
 - The default policy always has one default rule that cannot be deleted. It is always the last rule in the priority order. If you add rules to the default policy, they have a higher priority than the default rule. For information on default rules, see [Rules Model and Defaults](#rules-model-and-defaults).
 - The `system` attribute determines whether a policy is created by a system or by a user.

### Policy Model

Policies and rules are ordered numerically by priority. This priority determines the order in which they are searched for a context match. The highest priority policy has a `priorityOrder` of 1.

For example, assume the following conditions are in effect.

- Rule A has priority 1 and applies to RADIUS VPN scenarios.
- Rule B has priority 2 and applies to ON_NETWORK scenarios.

Because Rule A has a higher priority, even though requests are coming from ON_NETWORK due to VPN,
the action in Rule A is taken, and Rule B is not evaluated.


### Policy Object
{: #PolicyObject }

The Policy model defines several attributes:

Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
id | Identifier for the policy | String | No | Assigned
type | Policy type | `OKTA_SIGN_ON` or `MFA_ENROLL` | Yes | 
name | Name for the policy | String | Yes | 
priority | This is set to `1` on system policies, which can not be deleted. | Integer | No | 0
description | Description for the policy | String | No | Null
priorityOrder | Priority for the policy | Int | No | Last / Lowest Priority
system | Whether or not the policy is the default | Boolean | No | false
status | Status of the policy: ACTIVE or INACTIVE | String | No | "ACTIVE"
conditions | Conditions for rule | <a href="#ConditionsObject">Conditions Object</a> | No | 
settings | Settings for rule | <a href="#PolicySettingsObject">Policy Settings Object</a> | No | 
created | Timestamp when the policy was created | Date | No | Assigned
lastUpdated | Timestamp when the policy was last modified | Date | No | Assigned
_links | Hyperlinks | <a href="#LinksObject">Links Object</a> | No | 


### Policy Settings Object
{: #PolicySettingsObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
factors |  | <a href="#PolicyFactorsConfigurationObject">Policy Factors Configuration Object</a> | Yes | 


### Policy Factors Configuration Object
{: #PolicyFactorsConfigurationObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
google_otp | Google Authenticator | <a href="#PolicyFactorObject">Policy MFA Factor Object</a> | No | 
okta_otp | Okta Verify TOTP | <a href="#PolicyFactorObject">Policy MFA Factor Object</a> | No | 
okta_push | Okta Verify Push | <a href="#PolicyFactorObject">Policy MFA Factor Object</a> | No | 
okta_question | Okta Security Question | <a href="#PolicyFactorObject">Policy MFA Factor Object</a> | No | 
okta_sms | Okta SMS | <a href="#PolicyFactorObject">Policy MFA Factor Object</a> | No | 
rsa_token | RSA Token | <a href="#PolicyFactorObject">Policy MFA Factor Object</a> | No | 
symantec_vip | Symantic VIP | <a href="#PolicyFactorObject">Policy MFA Factor Object</a> | No | 


### Policy MFA Factor Object
{: #PolicyFactorObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
consent |  | <a href="#PolicyFactorConsentObject">Policy Factor Consent Object</a> | No | 
enroll |  | <a href="#PolicyFactorEnrollObject">Policy Factor Enroll Object</a> | No | 


### Policy Factor Enroll Object
{: #PolicyFactorEnrollObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
self |  | `NOT_ALLOWED`, `OPTIONAL` or `REQUIRED` | Yes | 


### Policy Factor Consent Object
{: #PolicyFactorConsentObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
terms | The format of the consent dialog to be presented. | `TEXT`, `RTF`, `MARKDOWN` or `URL` | No | 
type | Does the user need to consent to `NONE` or `TERMS_OF_SERVICE`. | String | No | NONE
value | The contents of the consent dialog. | String | No | 


### Conditions Object
{: #ConditionsObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
authContext |  | <a href="#AuthContextConditionObject">authContext Condition Object</a> | Yes | 
network |  | <a href="#NetworkConditionObject">Network Condition Object</a> | Yes | 
people |  | <a href="#PeopleConditionObject">People Condition Object</a> | Yes | 


### People Object
{: #PeopleObject }

The people condition identifies users and groups that are used together. For policies, you can only include a group.

Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
groups | The group condition | String | Yes | 
users | The user condition | String | Yes | 


### User Condition Object
{: #UserConditionObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
include | The users to be included | Array | Yes | 
exclude | The users to be excluded | Array | Yes | 


### Group Condition Object
{: #GroupConditionObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
include | The groups to be included | Array | Yes | 
exclude | The groups to be excluded | Array | Yes | 


### authContext Condition Object
{: #AuthContextConditionObject }

Specifies an authentication entry point.

Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
authType |  | `ANY` or `RADIUS` | No | 


### Network Condition Object
{: #NetworkConditionObject }

Specifies a network segment.

Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
connection |  | `ANYWHERE`, `ON_NETWORK` or `OFF_NETWORK` | No | 


### People Condition Object
{: #PeopleConditionObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
users |  | <a href="#UserConditionObject">User Condition Object</a> | No | 


### Links Object
{: #LinksObject }

Specifies link relations (See [Web Linking](http://tools.ietf.org/html/rfc5988)) available for the current policy.  The Links Object is used for dynamic discovery of related resources.  The Links Object is **read-only**.

Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
self | The policy or rule | String | Yes | 
activate | Action to activate a policy or rule | String | Yes | 
deactivate | Action to deactivate a policy or rule | String | Yes | 
rules | Rules objects for a policy only | String | Yes | 
policy | Policy object for a rule only | String | Yes | 


## Policy Operations

### Get a Policy
{:.api .api-operation}

<span class="api-uri-template api-uri-get"><span class="api-label">GET </span> /api/v1/policies/<em>:policyId</em></span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X GET \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/policies/{policyId}"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 200: 
<a href="#PolicyObject">Policy Object</a>

### Get a Policy with Rules
{:.api .api-operation}

<span class="api-uri-template api-uri-get"><span class="api-label">GET </span> /api/v1/policies/<em>:policyId</em>?expand=rules</span>

#### Request Parameters

* The policy ID described in the [Policy Object](#policy-object) is required.
* The `expand=rules` query parameter returns up to twenty rules for the specified policy. If the policy has more than 20 rules, this request returns an error.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X GET \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/policies/{policyId}?expand=rules"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 200: 
<a href="#PolicyObject">Policy Object</a>

### Get All Policies by Type
{:.api .api-operation}

<span class="api-uri-template api-uri-get"><span class="api-label">GET </span> /api/v1/policies?type=<em>:type</em></span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X GET \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/policies?type={type}"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 200: 
<a href="#PolicyObject">Policy Object</a>
HTTP 204: 
<a href="#PolicyObject">Policy Object</a>



### Delete Policy
{:.api .api-operation}

<span class="api-uri-template api-uri-delete"><span class="api-label">DELETE </span> /api/v1/policies/<em>:policyId</em></span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X DELETE \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/policies/{policyId}"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 204: 
*No Content*

### Update a Policy
{:.api .api-operation}

<span class="api-uri-template api-uri-put"><span class="api-label">PUT </span> /api/v1/policies/<em>:policyId</em></span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X PUT \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "name": "Example",
  "description": "This is an example policy",
  "conditions": {
    "people": {
      "groups": {
        "include": [
            "00gab0CDEFGHIJKLMNOP"
        ]
      }
    }
  }
}' \
"https://${org}.okta.com/api/v1/policies/{policyId}"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 200: 
<a href="#PolicyObject">Policy Object</a>



### Create a Policy
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST </span> /api/v1/policies</span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
    "type": "OKTA_SIGN_ON",
    "name": "Corporate Policy",
    "description": "Standard policy for every employee",
    "system": false,
    "conditions": {
        "people": {
            "groups": {
                "include": [
                    "00gab0CDEFGHIJKLMNOP"
                ]
            }
        }
    }
}' \
"https://${org}.okta.com/api/v1/policies"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 204: 
<a href="#PolicyObject">Policy Object</a>



### Activate a Policy
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST </span> /api/v1/policies/<em>:policyId</em>/lifecycle/activate</span>

#### Request Parameters

The policy id described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/policies/{policyId}/lifecycle/activate"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 204: 
*No Content is returned when the activation is successful.*



### Deactivate a Policy
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST </span> /api/v1/policies/<em>:policyId</em>/lifecycle/deactivate</span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/policies/{policyId}/lifecycle/deactivate"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 200: 
*No Content is returned when the deactivation is successful.*





# Rules

## Rules Model and Defaults

### Default Rules

 - Only the default policy contains a default rule. The default rule cannot be edited or deleted.
 - The default rule is required and always is the last rule in the priority order. If you add rules to the default policy, they have a higher priority than the default rule.
 - The `system` attribute determines whether a rule is created by a system or by a user. The default rule is the only rule that has this attribute.

### Rules Model Example

~~~json
{
    "actions": {
        "access": "ALLOW", 
        "enroll": {
            "self": "LOGIN"
        }, 
        "signon": {
            "access": "ALLOW", 
            "factorLifetime": 0, 
            "factorPromptMode": "ALWAYS", 
            "requireFactor": false, 
            "session": {
                "maxSessionIdleMinutes": 20, 
                "maxSessionLifetimeMinutes": 200, 
                "usePersistentCookie": false
            }
        }
    }, 
    "conditions": {
        "authContext": {
            "authType": "ANY"
        }, 
        "network": {
            "connection": "ANYWHERE"
        }, 
        "people": {
            "users": {
                "exclude": [
                    "example.user"
                ], 
                "include": [
                    "example.user"
                ]
            }
        }
    }, 
    "created": "2010-01-01T00:00:00.000Z", 
    "id": "abcd1234", 
    "lastUpdated": "2010-01-01T00:00:00.000Z", 
    "priorityOrder": {
        "default": "Last / Lowest Priority", 
        "description": "Priority for the rule", 
        "type": "integer"
    }, 
    "status": "ACTIVE", 
    "system": true, 
    "type": "OKTA_SIGN_ON"
}
~~~



### Rules Object
{: #RulesObject }

The Rules model defines several attributes:

Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
id | Identifier for the rule | String | No | Assigned
type | Rule type | `OKTA_SIGN_ON` or `MFA_ENROLL` | Yes | 
status | Status of the rule: `ACTIVE` or `INACTIVE` | String | No | ACTIVE
priorityOrder | Priority for the rule | Integer | No | Last / Lowest Priority
system | Whether or not the rule is the default | Boolean | No | false
created | Timestamp when the rule was created | Date | No | Assigned
lastUpdated | Timestamp when the rule was last modified | Date | No | Assigned
conditions | Conditions for rule | <a href="#ConditionsObject">Conditions Object</a> | No | 
actions | Actions for rule | <a href="#RulesActionsObject">Actions Object</a> | No | 


### Actions Object
{: #RulesActionsObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
access | `ALLOW` or `DENY` | `ALLOW` or `DENY` | Yes | 
enroll |  | <a href="#RulesActionsEnrollObject">Rules Actions Enroll Object</a> | No | 
signon |  | <a href="#SignonObject">Signon Action Object</a> | No | 


### Rules Actions Enroll Object
{: #RulesActionsEnrollObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
self | Should the user be enrolled the first time they `LOGIN`, the next time they are `CHALLENGE`d, or `NEVER`? | `CHALLENGE`, `LOGIN` or `NEVER` | Yes | 


### Network Condition Object
{: #NetworkConditionObject }

Specifies a network segment.

Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
connection |  | `ANYWHERE`, `ON_NETWORK` or `OFF_NETWORK` | No | 


### authContext Condition Object
{: #AuthContextConditionObject }

Specifies an authentication entry point.

Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
authType |  | `ANY` or `RADIUS` | No | 


### Signon Action Object
{: #SignonObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
access | `ALLOW` or `DENY` | `ALLOW` or `DENY` | Yes | 
requireFactor |  | Boolean | No | false
factorPromptMode | `DEVICE`, `SESSION` or `ALWAYS` | `DEVICE`, `SESSION` or `ALWAYS` | No | 
factorLifetime | How long until factor times out | Integer | No | 
session | Session Rules | <a href="#SignonSessionObject">Signon Session Object</a> | No | 


### Signon Session Object
{: #SignonSessionObject }



Parameter | Description | Data Type | Required | Default
| --- | --- | --- | ---
maxSessionIdleMinutes | Maximum number of minutes that a user session can be idle before the session is ended. | Integer | No | 
maxSessionLifetimeMinutes | Maximum number of minutes from user login that a user session will be active. Set this to force users to sign-in again after the number of specified minutes. Disable by setting to `0`. | Integer | No | 
usePersistentCookie | If set to `false`, user session cookies will only last the length of a browser session. If set to `true`, user session cookies will last across browser sessions. This setting does not impact Okta Administrator users, who can *never* have persistant session cookies. | Boolean | No | false


## Rules Operations


### Get Policy Rules
{:.api .api-operation}

<span class="api-uri-template api-uri-get"><span class="api-label">GET </span> /api/v1/policies/<em>:policyId</em>/rules</span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X GET \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/policies/{policyId}/rules"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 200: 
<a href="#RulesObject">Rules Object</a>



### Create a rule
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST </span> /api/v1/policies/<em>:policyId</em>/rules</span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
    "type": "SIGN_ON",
    "name": "Deny",
    "conditions": {
        "network": {
            "connection": "ANYWHERE"
        },
        "authContext": {
            "authType": "ANY"
        }
    },
    "actions": {
        "signon": {
            "access": "DENY",
            "requireFactor": false
        }
    }
}' \
"https://${org}.okta.com/api/v1/policies/{policyId}/rules"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 200: 
<a href="#RulesObject">Rules Object</a>



### Delete a rule
{:.api .api-operation}

<span class="api-uri-template api-uri-delete"><span class="api-label">DELETE </span> /api/v1/policies/<em>:policyId</em>/rules/<em>:ruleId</em></span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X DELETE \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/policies/{policyId}/rules/{ruleId}"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 204: 
*No Content*



### Get a rule
{:.api .api-operation}

<span class="api-uri-template api-uri-get"><span class="api-label">GET </span> /api/v1/policies/<em>:policyId</em>/rules/<em>:ruleId</em></span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X GET \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/policies/{policyId}/rules/{ruleId}"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 200: 
<a href="#RulesObject">Rules Object</a>



### Update a rule
{:.api .api-operation}

<span class="api-uri-template api-uri-put"><span class="api-label">PUT </span> /api/v1/policies/<em>:policyId</em>/rules/<em>:ruleId</em></span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X PUT \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "name": "My Updated Policy Rule",
  "conditions": {
    "people": {
      "users": {
        "exclude": []
      }
    },
    "network": {
      "connection": "ON_NETWORK"
    },
    "authContext": {
      "authType": "ANY"
    }
  },
  "actions": {
    "signon": {
      "access": "DENY"
    }
  }
}' \
"https://${org}.okta.com/api/v1/policies/{policyId}/rules/{ruleId}"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 200: 
<a href="#RulesObject">Rules Object</a>



### Activate A Rule
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST </span> /api/v1/policies/<em>:policyId</em>/rules/<em>:ruleId</em>/lifecycle/activate</span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/policies/{policyId}/rules/{ruleId}/lifecycle/activate"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 204: 
*No content*



### Deactivate A Rule
{:.api .api-operation}

<span class="api-uri-template api-uri-post"><span class="api-label">POST </span> /api/v1/policies/<em>:policyId</em>/rules/<em>:ruleId</em>/lifecycle/deactivate</span>

#### Request Parameters

The policy ID described in the [Policy Object](#policy-object) is required.

##### Request Example
{:.api .api-request .api-request-example}

~~~sh
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${org}.okta.com/api/v1/policies/{policyId}/rules/{ruleId}/lifecycle/deactivate"
~~~

##### Response Types
{:.api .api-response .api-response-example}

HTTP 204: 
*No content*



