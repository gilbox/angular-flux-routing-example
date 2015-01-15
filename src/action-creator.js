app.factory('actionCreator', function (dispatcher, colorApi, aboutApi, colorStore, routeStore) {

  // Notice 2 types of methods:
  //  actionCreator.fn(payload)
  //  actionCreator.fn(route)
  //
  // Don't call methods that accept a route directly,
  // use actionCreator.goto(payload) instead.
  return dispatcher.registerActionCreator({

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

    toggleColor: function(payload) {
      dispatcher.dispatch('toggle:color', payload);
    },

    toggleAll: function() {
      dispatcher.dispatch('toggle:all');
    },

    route: function (payload, isInternal) {
      payload.pathChangedInternally = isInternal;
      payload.route = routeStore.getRouteFromPath(payload.path);

      if (payload.route) {
        var routeName = payload.route.name;

        if (this[routeName] && this[routeName](payload.route) !== false) {
          dispatcher.dispatch('route', payload);
        }
      }
    },

    // goto is only used for internal route changes
    // this is most likely to happen when a user interaction calls for a URL change
    // The payload passed into this function should have a `routeName` property
    // which has a corresponding method in this actionCreator that represents a route.
    goto: function(payload) {
      this.route(payload, true);
    },

    // used only for URL stream changes
    // the URL stream is how we think of direct-URL changes by the user
    // most commonly, these changes are the result of the user clicking the
    // Back or Forward buttons of the browser
    routingPathChange: function(payload) {
      this.route(payload, false);
    }

  })
});