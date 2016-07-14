---
layout: docs_page
title: Platform Release Notes July 13, 2016
---

Release 2016.28

## Feature Enhancement: Password Complexity Requirements

<!-- OKTA-88905 -->
Two enhancements help clients to display password complexity requirements:

The PasswordComplexity object includes parameters for password complexity requirements, `excludeUsername`, `age:minAgeMinutes`, and `age:historyCount`.

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

Also, the response to an answer recovery question (`/api/v1/authn/recovery/answer`) includes the PasswordPolicy object, which contains the PasswordComplexity object:

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
        ...
  }
}
~~~

When performing a self-service password reset (forgot password), the request for an answer recovery question is made in response to the security question challenge.
For more information, see [Password Complexity Object](http://developer.okta.com/docs/api/resources/authn#password-complexity-object)
and [Answer Reovery Question](http://developer.okta.com/docs/api/resources/authn#answer-recovery-question).

<!-- ## Bugs Fixed -->

### Does Your Org Have These Changes Yet?

To verify the current release for an org, check the last line (footer) of any Admin page. For example, click the **Dashboard** or **Directory** tab.

### Looking for Product Release Notes?

For changes outside the Okta platform, see the [Release Notes Knowledge Hub](https://support.okta.com/help/articles/Knowledge_Article/Release-Notes-Knowledge-Hub).

### Earlier Release Notes

* [Platform Release Notes for the week ending Wednesday, July 7](platform-release-notes2016-27.html)
* [Platform Release Notes for the week ending Wednesday, June 29](platform-release-notes2016-26.html)
* [Platform Release Notes for the week ending Wednesday, June 22](platform-release-notes2016-25.html)
* [Platform Release Notes for the week ending Wednesday, June 15](platform-release-notes2016-24.html)
* [Platform Release Notes for the week ending Wednesday, June 8](platform-release-notes2016-23.html)
