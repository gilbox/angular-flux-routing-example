(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){


// Gil: I'm being naughty. Don't use this file in production, user browserify instead
window.Router = Router;

/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';
/*global process:true */

var debug = require('debug')('Routr:router');
var pathToRegexp = require('path-to-regexp');
var reverend = require('reverend');
var METHODS = {
    GET: 'get'
};

/**
 * @class Route
 * @param {String} name  The name of the route
 * @param {Object} config  The configuration for this route.
 * @param {String} config.path  The path of the route.
 * @constructor
 */
function Route(name, config) {
    this.name = name;
    this.config = config || {};
    this.keys = [];
    this.regexp = pathToRegexp(this.config.path, this.keys);
}


/**
 * Whether the given method is accepted by this route.
 * @method acceptMethod
 * @param {String} method  The HTTP VERB string.
 * @return true if the method is accepted; false otherwise.
 * @for Route
 */
Route.prototype.acceptMethod = function (method) {
    //TODO support array for method, ['get', 'post']
    return method === this.config.method;
};

/**
 * Checkes whether this route matches the given url, method (GET as default) and optional navigation related criteria.
 * @method match
 * @param {String} url   The relative url to be matched to this route.  Query strings and hash fragments
 *                       are **not** considered when performing the match.  E.g. /some_path?foo=bar#hashBaz
 *                       would match to the same route as /some_path
 * @param {Object} [options]
 * @param {String} [options.method=get] The case-insensitive HTTP method string.  Defaults to 'get'.
 * @param {Object} [options.navigate] The navigation info.
 * @param {Object} [options.navigate.type] The navigation type: 'pageload', 'click', 'popstate'.
 * @param {Object} [options.navigate.params] The navigation params (that are not part of the path).
 * @return {Object|null} The matched route params if path/method/navParams matches to this route; null otherwise.
 * @for Route
 */
Route.prototype.match = function (url, options) {
    if (!url) {
        return null;
    }

    options = options || {};

    var self = this;
    var i;
    var len;

    // 1. check method
    var method = (options.method && options.method.toLowerCase()) || METHODS.GET;
    if (!self.acceptMethod(method)) {
        return null;
    }

    // 2. check path
    // remove query string and hash fragment from url
    var pos = url.indexOf('?');
    var path;
    if (pos >= 0) {
        // remove query string
        path = url.substring(0, pos);
    } else {
        pos = url.indexOf('#');
        if (pos >= 0) {
            // hash fragment does not get sent to server.
            // But since routr can be used on both server and client,
            // we should remove hash fragment before matching the regex.
            path = url.substring(0, pos);
        } else {
            path = url;
        }
    }

    var pathMatches = self.regexp.exec(path);
    if (!pathMatches) {
        return null;
    }

    // 3. check navParams, if this route has match requirements defined for navParams
    var navParamsConfig = (self.config.navigate && self.config.navigate.params);
    if (navParamsConfig) {
        var navParamConfigKeys = Object.keys(navParamsConfig);
        var navParams = (options.navigate && options.navigate.params) || {};
        var navParamMatched;

        for (i = 0, len = navParamConfigKeys.length; i < len; i++) {
            // for each navParam defined in the route config, make sure
            // the param passed in matches the defined pattern
            var configKey = navParamConfigKeys[i];
            var pattern = navParamsConfig[configKey];
            if (pattern instanceof RegExp) {
                navParamMatched = navParams[configKey] !== undefined && pattern.test(navParams[configKey]);
            } else {
                navParamMatched = (navParams[configKey] === pattern);
            }
            if (!navParamMatched) {
                // found a non-matching navParam -> this route does not match
                return null;
            }
        }
    }

    // 4. method/path/navParams all matched, extract the matched path params
    var routeParams = {};
    for (i = 0, len = self.keys.length; i < len; i++) {
        routeParams[self.keys[i].name] = pathMatches[i+1];
    }

    return routeParams;
};

/**
 * Generates a path string with this route, using the specified params.
 * @method makePath
 * @param {Object} params  The route parameters to be used to create the path string
 * @return {String} The generated path string.
 * @for Route
 */
Route.prototype.makePath = function (params) {
    try {
        return reverend(this.config.path, params);
    } catch (e) {
        debug('Route.makePath failed, e = ', e);
        return null;
    }
};

/**
 * A Router class that provides route matching and route generation functionalities.
 * @class Router
 * @param {Object} routes  Route table, which is a name to router config map.
 * @constructor
 * @example
    var Router = require('routr'),
        router,
        route;

    var router = new Router({
        view_user: {
            path: '/user/:id',
            method: 'get',
            foo: {
                bar: 'baz'
            }
        }
    });

    route = router.getRoute('/user/garfield');
    if (route) {
        // this will output:
        //   - "view_user" for route.name
        //   - "/user/garfield" for route.url
        //   - {id: "garfield"} for route.params
        //   - {path: "/user/:id", method: "get", foo: { bar: "baz"}} for route.config
        console.log('[Route found]: name=', route.name, 'url=', route.url, 'params=', route.params, 'config=', route.config);
    }
 */
function Router(routes) {
    var self = this;
    self._routes = {};
    debug('new Router, routes = ', routes);
    if (routes) {
        Object.keys(routes).forEach(function createRoute(name) {
            self._routes[name] = new Route(name, routes[name]);
        });
    }
    if (process.env.NODE_ENV !== 'production') {
        if ('function' === typeof Object.freeze) {
            Object.keys(self._routes).forEach(function freezeRoute(name) {
                var route = self._routes[name];
                Object.freeze(route.config);
                Object.freeze(route.keys);
                Object.freeze(route);
            });
            Object.freeze(self._routes);
        }
    }
}

/**
 * @method getRoute
 * @param {String} url   The url to be used for route matching.  Query strings are **not** considered
 *                        when performing the match.  E.g. /some_path?foo=bar would match to the same route
 *                        as /some_path
 * @param {Object} [options]
 * @param {String} [options.method=get] The case-insensitive HTTP method string.
 * @param {Object} [options.navigate] The navigation info.
 * @param {Object} [options.navigate.type] The navigation type: 'pageload', 'click', 'popstate'.
 * @param {Object} [options.navigate.params] The navigation params (that are not part of the path).
 * @return {Object|null} The matched route info if path/method/navigate.params matches to a route; null otherwise.
 */
Router.prototype.getRoute = function (url, options) {
    var keys = Object.keys(this._routes);
    var route;
    var match;

    for (var i = 0, len = keys.length; i < len; i++) {
        route = this._routes[keys[i]];
        match = route.match(url, options);
        if (match) {
            return {
                name: keys[i],
                url: url,
                params: match,
                config: route.config,
                navigate: options && options.navigate
            };
        }
    }
    return null;
};

/**
 * Generates a path string with the route with the given name, using the specified params.
 * @method makePath
 * @param {String} name  The route name
 * @param {Object} params  The route parameters to be used to create the path string
 * @return {String} The generated path string, null if there is no route with the given name.
 */
Router.prototype.makePath = function (name, params) {
    return (name && this._routes[name] && this._routes[name].makePath(params)) || null;
};

module.exports = Router;
}).call(this,require('_process'))
},{"_process":10,"debug":2,"path-to-regexp":5,"reverend":7}],2:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Use chrome.storage.local if we are in an app
 */

var storage;

if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined')
  storage = chrome.storage.local;
else
  storage = window.localStorage;

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      storage.removeItem('debug');
    } else {
      storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":3}],3:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":4}],4:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],5:[function(require,module,exports){
var isArray = require('isarray');

/**
 * Expose `pathtoRegexp`.
 */
module.exports = pathtoRegexp;

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match already escaped characters that would otherwise incorrectly appear
  // in future matches. This allows the user to escape special characters that
  // shouldn't be transformed.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
  // Match regexp special characters that should always be escaped.
  '([.+*?=^!:${}()[\\]|\\/])'
].join('|'), 'g');

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1');
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys;

  return re;
};

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array should be passed in, which will contain the placeholder key
 * names. For example `/user/:id` will then contain `["id"]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 keys
 * @param  {Object}                options
 * @return {RegExp}
 */
function pathtoRegexp (path, keys, options) {
  if (!isArray(keys)) {
    options = keys;
    keys = null;
  }

  keys = keys || [];
  options = options || {};

  var strict = options.strict;
  var end = options.end !== false;
  var flags = options.sensitive ? '' : 'i';
  var index = 0;

  if (path instanceof RegExp) {
    // Match all capturing groups of a regexp.
    var groups = path.source.match(/\((?!\?)/g);

    // Map all the matches to their numeric indexes and push into the keys.
    if (groups) {
      for (var i = 0; i < groups.length; i++) {
        keys.push({
          name:      i,
          delimiter: null,
          optional:  false,
          repeat:    false
        });
      }
    }

    // Return the source back to the user.
    return attachKeys(path, keys);
  }

  // Map array parts into regexps and return their source. We also pass
  // the same keys and options instance into every generation to get
  // consistent matching groups before we join the sources together.
  if (isArray(path)) {
    var parts = [];

    for (var i = 0; i < path.length; i++) {
      parts.push(pathtoRegexp(path[i], keys, options).source);
    }
    // Generate a new regexp instance by joining all the parts together.
    return attachKeys(new RegExp('(?:' + parts.join('|') + ')', flags), keys);
  }

  // Alter the path string into a usable regexp.
  path = path.replace(PATH_REGEXP, function (match, escaped, prefix, key, capture, group, suffix, escape) {
    // Avoiding re-escaping escaped characters.
    if (escaped) {
      return escaped;
    }

    // Escape regexp special characters.
    if (escape) {
      return '\\' + escape;
    }

    var repeat   = suffix === '+' || suffix === '*';
    var optional = suffix === '?' || suffix === '*';

    keys.push({
      name:      key || index++,
      delimiter: prefix || '/',
      optional:  optional,
      repeat:    repeat
    });

    // Escape the prefix character.
    prefix = prefix ? '\\' + prefix : '';

    // Match using the custom capturing group, or fallback to capturing
    // everything up to the next slash (or next period if the param was
    // prefixed with a period).
    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');

    // Allow parameters to be repeated more than once.
    if (repeat) {
      capture = capture + '(?:' + prefix + capture + ')*';
    }

    // Allow a parameter to be optional.
    if (optional) {
      return '(?:' + prefix + '(' + capture + '))?';
    }

    // Basic parameter support.
    return prefix + '(' + capture + ')';
  });

  // Check whether the path ends in a slash as it alters some match behaviour.
  var endsWithSlash = path[path.length - 1] === '/';

  // In non-strict mode we allow an optional trailing slash in the match. If
  // the path to match already ended with a slash, we need to remove it for
  // consistency. The slash is only valid at the very end of a path match, not
  // anywhere in the middle. This is important for non-ending mode, otherwise
  // "/test/" will match "/test//route".
  if (!strict) {
    path = (endsWithSlash ? path.slice(0, -2) : path) + '(?:\\/(?=$))?';
  }

  // In non-ending mode, we need prompt the capturing groups to match as much
  // as possible by using a positive lookahead for the end or next path segment.
  if (!end) {
    path += strict && endsWithSlash ? '' : '(?=\\/|$)';
  }

  return attachKeys(new RegExp('^' + path + (end ? '$' : ''), flags), keys);
};

},{"isarray":6}],6:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],7:[function(require,module,exports){
/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright (C) 2014 eBay Software Foundation                               │
 │                                                                            │
 │  Licensed under the Apache License, Version 2.0 (the "License");           │
 │  you may not use this file except in compliance with the License.          │
 │  You may obtain a copy of the License at                                   │
 │                                                                            │
 │    http://www.apache.org/licenses/LICENSE-2.0                              │
 │                                                                            │
 │  Unless required by applicable law or agreed to in writing, software       │
 │  distributed under the License is distributed on an "AS IS" BASIS,         │
 │  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
 │  See the License for the specific language governing permissions and       │
 │  limitations under the License.                                            │
 \*───────────────────────────────────────────────────────────────────────────*/
 // RegExp patterns used from: https://github.com/component/path-to-regexp (MIT)
'use strict';

var path2regex = require('path-to-regexp');


module.exports = function reverend(route, obj) {
    var keys, path, routeRegex;

    // Support `route` being an array (which path-to-regexp supports), and
    // prefer the first item because we want the best-fit URL.
    if (Array.isArray(route)) {
        route = route[0];
    }

    // Restrict `route` to Strings since a RegExp route can't be used to
    // generate a path (path-to-regexp supports RegExp route paths).
    if (typeof route !== 'string') {
        throw new TypeError('route must be a String path');
    }

    keys = [];
    path = route;
    routeRegex = path2regex(route, keys);

    keys.forEach(function (key) {
        var value, regex;

        value = obj[key.name];

        // Enforce required keys having a value.
        if (!key.optional && value === undefined) {
            throw new RangeError('A value must be provided for: ' + key.name);
        }

        // Pattern used in both unnamed (e.g., "/posts/(.*)") and custom match
        // parameters (e.g., "/posts/:id(\\d+)").
        regex = '\\(((?:\\\\.|[^)])*)\\)';

        // A key's `name` will be a String for named parameters, and a Number
        // for unnamed parameters. This prefixes the base regexp pattern with
        // the name, and makes the custom-matching part optional (which follows
        // what path-to-regexp does.)
        if (typeof key.name === 'string') {
            regex = '\\:' + key.name + '(?:' + regex + ')?';
        }

        // Append suffix pattern.
        regex += '([+*?])?';

        if (key.optional && value === undefined) {
            // No value so remove potential trailing '/'
            // since the path segment is optional.
            value = '';
            regex += '\\/?';
        }

        value = encodeURIComponent(value);
        path = path.replace(new RegExp(regex), value);
    });


    // Make sure the `path` produced will actually be matched by the `route`.
    if (!routeRegex.test(path)) {
        throw new RangeError('"' + path + '" will not match: "' + route + '"');
    }

    return path;
};

},{"path-to-regexp":8}],8:[function(require,module,exports){
/**
 * Expose `pathtoRegexp`.
 */
module.exports = pathtoRegexp;

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match already escaped characters that would otherwise incorrectly appear
  // in future matches. This allows the user to escape special characters that
  // shouldn't be transformed.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
  // Match regexp special characters that should always be escaped.
  '([.+*?=^!:${}()[\\]|\\/])'
].join('|'), 'g');

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1');
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
var attachKeys = function (re, keys) {
  re.keys = keys;

  return re;
};

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array should be passed in, which will contain the placeholder key
 * names. For example `/user/:id` will then contain `["id"]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 keys
 * @param  {Object}                options
 * @return {RegExp}
 */
function pathtoRegexp (path, keys, options) {
  if (keys && !Array.isArray(keys)) {
    options = keys;
    keys = null;
  }

  keys = keys || [];
  options = options || {};

  var strict = options.strict;
  var end = options.end !== false;
  var flags = options.sensitive ? '' : 'i';
  var index = 0;

  if (path instanceof RegExp) {
    // Match all capturing groups of a regexp.
    var groups = path.source.match(/\((?!\?)/g) || [];

    // Map all the matches to their numeric keys and push into the keys.
    keys.push.apply(keys, groups.map(function (match, index) {
      return {
        name:      index,
        delimiter: null,
        optional:  false,
        repeat:    false
      };
    }));

    // Return the source back to the user.
    return attachKeys(path, keys);
  }

  if (Array.isArray(path)) {
    // Map array parts into regexps and return their source. We also pass
    // the same keys and options instance into every generation to get
    // consistent matching groups before we join the sources together.
    path = path.map(function (value) {
      return pathtoRegexp(value, keys, options).source;
    });

    // Generate a new regexp instance by joining all the parts together.
    return attachKeys(new RegExp('(?:' + path.join('|') + ')', flags), keys);
  }

  // Alter the path string into a usable regexp.
  path = path.replace(PATH_REGEXP, function (match, escaped, prefix, key, capture, group, suffix, escape) {
    // Avoiding re-escaping escaped characters.
    if (escaped) {
      return escaped;
    }

    // Escape regexp special characters.
    if (escape) {
      return '\\' + escape;
    }

    var repeat   = suffix === '+' || suffix === '*';
    var optional = suffix === '?' || suffix === '*';

    keys.push({
      name:      key || index++,
      delimiter: prefix || '/',
      optional:  optional,
      repeat:    repeat
    });

    // Escape the prefix character.
    prefix = prefix ? '\\' + prefix : '';

    // Match using the custom capturing group, or fallback to capturing
    // everything up to the next slash (or next period if the param was
    // prefixed with a period).
    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');

    // Allow parameters to be repeated more than once.
    if (repeat) {
      capture = capture + '(?:' + prefix + capture + ')*';
    }

    // Allow a parameter to be optional.
    if (optional) {
      return '(?:' + prefix + '(' + capture + '))?';
    }

    // Basic parameter support.
    return prefix + '(' + capture + ')';
  });

  // Check whether the path ends in a slash as it alters some match behaviour.
  var endsWithSlash = path[path.length - 1] === '/';

  // In non-strict mode we allow an optional trailing slash in the match. If
  // the path to match already ended with a slash, we need to remove it for
  // consistency. The slash is only valid at the very end of a path match, not
  // anywhere in the middle. This is important for non-ending mode, otherwise
  // "/test/" will match "/test//route".
  if (!strict) {
    path = (endsWithSlash ? path.slice(0, -2) : path) + '(?:\\/(?=$))?';
  }

  // In non-ending mode, we need prompt the capturing groups to match as much
  // as possible by using a positive lookahead for the end or next path segment.
  if (!end) {
    path += strict && endsWithSlash ? '' : '(?=\\/|$)';
  }

  return attachKeys(new RegExp('^' + path + (end ? '$' : ''), flags), keys);
};

},{}],9:[function(require,module,exports){
/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
module.exports = require('./lib/router');

},{"./lib/router":1}],10:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[9]);
