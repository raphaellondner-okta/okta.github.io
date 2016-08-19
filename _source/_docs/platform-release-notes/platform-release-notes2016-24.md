---
layout: docs_page
title: Platform Release Notes June 15, 2016
---

Release 2016.24

## New Platform Feature

### New Version of Okta Sign-In Widget
Version 1.3.3 of the Okta Sign-In Widget, and version 1.0.2 of okta-auth-js are available for Preview orgs. For more information, see Okta Sign-In Widget.

### Policy API
The Links object, `_links`, is available in the Policy object. For more information, see [Links Object](http://developer.okta.com/docs/api/resources/users.html#links-object).

### Improved Error Descriptions
The error descriptions related to OAuth provide more helpful information about invalid clients for OpenID Connect flows. 

### Disable Automatic Key Rotation
If you need to disable automatic key rotation for an OpenID Connect flow, you can do so in General Settings section under the General tab for an app, and then use the `/oauth2/v1/keys` endpoint to fetch public keys for your app. For more information, see [OpenID Connect](http://developer.okta.com/docs/api/resources/oidc.html).


### Looking for Product New Features?

For changes outside the Okta platform, see the [Release Notes Knowledge Hub](https://support.okta.com/help/articles/Knowledge_Article/Release-Notes-Knowledge-Hub).

## Bugs Fixed

* OKTA-69173 – The `helpURL` for `vpn` wasn't returned even though it had been set previously in a request to `/api/v1/apps`.

## Return to Current Release Notes

[Current Platform Release Notes](platform-release-notes.html)

