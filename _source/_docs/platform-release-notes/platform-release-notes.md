---
layout: docs_page
title: Platform Release Notes for Release 2016.31
---

## Feature Enhancements
 
### Version 1.4.0 of okta-auth-js Available
 
<!-- OKTA-97056 -->
We've added support for Access Tokens and two new namespaces, token and tokenManager, 
to handle both ID Tokens and Access Tokens. 
The token namespace makes it easier to specify how to retrieve your tokens: 
getWithoutPrompt, getWithPopup, and getWithRedirect. 
The tokenManager namespace allows tracking tokens and automatically refreshes them for you.
 
For more details including feature and bug-fix commits, 
see [the okta-auth-js Git repository](https://github.com/okta/okta-auth-js/releases/tag/okta-auth-js-1.4.0).

### Rules Included in Policy API requests

<!-- OKTA-40548 -->
Use the `expand` query parameter to include up to twenty rules in a Policy API query:

     `GET https://my-org.okta.com/api/v1/policies/{id}?expand=rules`

The embedded rules option returns up to 20 rules for a given policy. If the policy has more than 20 rules, this request returns an error.

## Bug Fixed

The following issue is fixed:

* The ampersand (&) character in a username caused Forgot Password API requests (`/api/v1/authn/recovery/password` to fail. (OKTA-93994)

## Does Your Org Have These Changes Yet?

Check the footer of any Admin page in an org, for example the **Dashboard** or **Directory** tab, to verify the current release for that org.

## Looking for Product Release Notes?

For changes outside the Okta platform, see the [Release Notes Knowledge Hub](https://support.okta.com/help/articles/Knowledge_Article/Release-Notes-Knowledge-Hub).

## Earlier Release Notes

* [Platform Release Notes for Release 2016.30](platform-release-notes2016-30.html)
* [Platform Release Notes for Release 2016.29](platform-release-notes2016-29.html)
* [Platform Release Notes for Release 2016.28](platform-release-notes2016-28.html)
* [Platform Release Notes for Release 2016.27](platform-release-notes2016-27.html)
* [Platform Release Notes for Release 2016.26](platform-release-notes2016-26.html)
* [Platform Release Notes for Release 2016.25](platform-release-notes2016-25.html)
* [Platform Release Notes for Release 2016.24](platform-release-notes2016-24.html)
* [Platform Release Notes for Release 2016.23](platform-release-notes2016-23.html)
