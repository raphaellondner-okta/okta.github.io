function OIDCClient(options) {
    this.options = options;
    this.implicit = new ImplicitFlow(this);
}

function formatScope(scopes) {
    return Array.isArray(scopes) ? scopes.join(' ') : scopes;
}

function ImplicitFlow(client) {
    this.client = client;
}

ImplicitFlow.prototype.getUri = function(options) {
    options = $.extend(this.client.options, options);

    var clientId = encodeURIComponent(options.clientId),
        redirectUri = encodeURIComponent(options.redirectUri),
        scopes = encodeURIComponent(formatScope(options.scopes)),
        uri = options.authorizationUri + '?client_id=' + clientId +
                 '&redirect_uri=' + redirectUri + '&scope=' + scopes +
                 '&response_type=id_token';

    if (options.state) {
        url += '&state=' + encodeURIComponent(options.state);
    }

    return uri;
}

ImplicitFlow.prototype.getTokens = function(fragment) {
    var response = fragment.substring(1);
    var vars = response.split('&');
    var result = {}
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        result[pair[0]] = pair[1];
    }
    return result;
}
