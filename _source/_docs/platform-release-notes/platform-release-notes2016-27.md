---
layout: docs_page
title: Platform Release Notes July 7, 2016
---

Release 2016.27

Releases are rolled out to organizations in a staggered fashion: first to preview orgs, then to production orgs. 
Check the [Current Release Status](https://support.okta.com/help/articles/Knowledge_Article/Current-Release-Status) to verify whether the changes in this document have rolled out to your org yet.

## Feature Enhancements
 
### Improvements for OAuth Panels in the Admin Console

<!-- OKTA-93256 -->
To improve usability, we've moved some of the panels in the Okta user interface related to OAuth:

* The **OAuth** tab has been renamed **Authorization Server**.
* The **Signing credentials rotation** option was on the **Client Registration** panel, but since it helps you configure tokens, we've
 moved it to the **Authorization Server** tab. 

![New Tab for Managing OAuth-Related Configuration](/assets/img/changed_tabs.png)
 
### Okta Sign-In Widget Updated

<!-- OKTA-91831, OKTA-93759 -->
The Okta Sign-In Widget will be updated to version 1.4.0 for Production orgs. 

See [Okta Sign-In Widget](http://developer.okta.com/docs/guides/okta_sign-in_widget.html) for updated sample code
after [Release 2016.27](https://support.okta.com/help/articles/Knowledge_Article/Current-Release-Status) is rolled out to production orgs.

The new release includes several enhancements:

* The new version is an npm module and is availabe on the [npm registry](https://www.npmjs.com/package/@okta/okta-signin-widget).
* Changes to the "Trust this Device" checkbox and other minor bug fixes have been made.

### Improved User Lookup for Password Recovery

<!-- OKTA-92001 -->
To ensure a successful password recovery lookup if an email address is associated with multiple users, we improved the lookup behavior:

* Okta no longer includes deactivated users in the lookup.
* The lookup searches login IDs first, then primary email addresses, and then secondary email addresses.

## Bugs Fixed

The following issues are fixed:
 
* The OIDC Access Token was incorrectly available to Okta endpoints other than `/oauth2/v1/userinfo`. (OKTA-91099)
* The format of the issuer (`iss`) in the Access Token has changed: it was the client ID. It now takes the form: `https://<your-org>.okta.com/as/<authorization-server-ID>. (OKTA-93628)

## Looking for Product Release Notes?

For changes outside the Okta platform, see the [Release Notes Knowledge Hub](https://support.okta.com/help/articles/Knowledge_Article/Release-Notes-Knowledge-Hub).
