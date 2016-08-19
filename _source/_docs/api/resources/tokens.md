---
layout: docs_page
title: Tokens
redirect_from: "/docs/getting_started/tokens.html"
---

> This API is **deprecated**. Please see [Getting an API Token](/docs/getting_started/getting_a_token.html)*

## Create tokens

### POST /tokens

Create a token.  This API does not require any token-based authentication to access.

#### Request Example

~~~ shell
curl -v -H "Content-type:application/json" \
-H "Accept:application/json" \
-X POST https://your-subdomain.okta.com/api/v1/tokens/ \
-d \
'{
  "username": "user8u3VOJBREVQHBTAS@asdf.com",
  "password": "SecretPass",
  "clientAppId": "capalkhfadflkjh",
  "deviceName": "Sample Device Name"
}'
~~~


#### Response Example

~~~ json
{
  "token": "00F-MBcxD2SC8tzXDCDZm2a04qtXLcFqtlrrPu6eVtxRs"
}
~~~


## Revoke tokens

### DELETE /tokens

Revokes the token that is being used to authenticate to the API.

#### Request Example

~~~ shell
curl -v -H "Content-type:application/json" \
-H "Authorization:SSWS 00F-MBcxD2SC8tzXDCDZm2a04qtXLcFqtlrrPu6eVtxRs" \
-H "Accept:application/json" \
-X DELETE https://your-subdomain.okta.com/api/v1/tokens/
~~~
