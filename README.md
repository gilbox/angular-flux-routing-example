angular-flux-routing-example
============================

Achieving Reasonable Scalability in Angular with Flux and Routing


running
=======

There is no build process, so just

    npm install
    npm start

Then open [`http://localhost:3300/`](http://localhost:3300/)


what's reasonable scalability?
==============================

first setup our routes in `routeStore`. We're using yahoo's [routr](https://github.com/yahoo/routr),
it supports params the same way `ui-router` does but we don't need them for this example:

    router: new Router({

      home: {
        path: '/',
        method: 'get'
      },

      about: {
        path: '/about',
        method: 'get'
      }

    }),

then handle routing in our Action Creator *like a boss*:

    _route: function(payload) {
      if (routeStore.pathMatchesState(payload.path, 'about')) {
        dispatcher.dispatch('loadingIndicator:show');

        aboutApi.fetch().success(function(data) {
          dispatcher.dispatch('loaded:about', {people:data});
          dispatcher.dispatch('route', payload);
          dispatcher.dispatch('loadingIndicator:hide');
        });

      } else if (routeStore.pathMatchesState(payload.path, 'home')) {
        if (colorStore.colorsLoaded) {
          dispatcher.dispatch('route', payload);
        } else {
          dispatcher.dispatch('loadingIndicator:show');
          colorApi.fetch().success(function(data) {
            dispatcher.dispatch('loaded:colors', {colors:data});
            dispatcher.dispatch('route', payload);
            dispatcher.dispatch('loadingIndicator:hide');
          });
        }
      }
    },

now [tell me](https://github.com/gilbox/angular-flux-routing-example/issues)
you still want to use resolve blocks!?


still using ui-router?
======================

Yeah, we're still using ui-router in this demo but it's only being used
for it's `ui-view` directive. We're not using it's state machine or URL
matching capabilities because they are too tightly coupled.
So `ui-router` could easily be replaced by any number of other solutions.


notes
=====

Don't try this at home: I hacked a browserified routr.js to expose Router
globally just to keep things simple for this demo.