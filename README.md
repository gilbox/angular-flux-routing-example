angular-flux-routing-example
============================

Achieving Reasonable Scalability in Angular with Flux and Routing

**NOTE: The routing code in this repo has been refactored (to be simpler) since I published the Medium article,
but the article does not yet have the updated code. The changes mostly effect `action-creator.js` and `stores.js`.**

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

then handle routing in our Action Creator [*like a boss*](http://gifstumblr.com/images/putting-sunglasses-on-like-a-boss_863.gif):


    // we define all of our route handling logic here,
    // these functions take the place of ui-router's resolve blocks
    // navigate to home
    home: function(route) {

      // If colors have already loaded, just dispatch the `route` action
      // This way, the colors will only be loaded once through the life-cycle
      // of the application

      if (! colorStore.colorsLoaded) {
        // if colors haven't been loaded, show the loading indicator
        // and send a request to colorApi
        // once colors are loaded, dispatch the `loaded:colors` action to
        // process the color data, then dispatch `route` to complete routing
        // and finally dispatch `loadingIndicator:hide` to hide the loading indicator
        dispatcher.dispatch('loadingIndicator:show');
        colorApi.fetch().success(function(data) {
          dispatcher.dispatch('loaded:colors', {colors: data});
          dispatcher.dispatch('route', {route:route});
          dispatcher.dispatch('loadingIndicator:hide');
        });

        return false;
      }
    },

    // navigate to about
    about: function(route) {

      // whenever the 'about' route is loaded, we re-load
      // the about data with aboutApi.
      // This probably makes little sense in a real-world application,
      // but contrast this to how the color data is only loaded one
      // time in the 'home' route above

      dispatcher.dispatch('loadingIndicator:show');

      aboutApi.fetch().success(function(data) {
        dispatcher.dispatch('loaded:about', {people: data});
        dispatcher.dispatch('route', {route:route});
        dispatcher.dispatch('loadingIndicator:hide');
      });

      return false;
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