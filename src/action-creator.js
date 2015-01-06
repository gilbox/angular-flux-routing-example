app.factory('actionCreator', function (dispatcher, colorApi, aboutApi, colorStore, routeStore) {

  // we define all of our route handling logic here,
  // these funcitons take the place of ui-router's resolve blocks
  // also see the route function below
  var routes = {
    about: function(payload) {

      // whenever the 'about' route is loaded, we re-load
      // the about data with aboutApi.
      // This probably makes little sense in a real-world application,
      // but contrast this to how the color data is only loaded one
      // time in the 'home' route below

      dispatcher.dispatch('loadingIndicator:show');

      aboutApi.fetch().success(function(data) {
        dispatcher.dispatch('loaded:about', {people: data});
        dispatcher.dispatch('route', payload);
        dispatcher.dispatch('loadingIndicator:hide');
      });

    },

    home: function(payload) {

      if (colorStore.colorsLoaded) {

        // If colors have already loaded, just dispatch the `route` action
        // This way, the colors will only be loaded once through the life-cycle
        // of the application
        dispatcher.dispatch('route', payload);

      } else {

        // if colors haven't been loaded, show the loading indicator
        // and send a request to colorApi
        // once colors are loaded, dispatch the `loaded:colors` action to
        // process the color data, then dispatch `route` to complete routing
        // and finally dispatch `loadingIndicator:hide` to hide the loading indicator
        dispatcher.dispatch('loadingIndicator:show');
        colorApi.fetch().success(function(data) {
          dispatcher.dispatch('loaded:colors', {colors: data});
          dispatcher.dispatch('route', payload);
          dispatcher.dispatch('loadingIndicator:hide');
        });
      }
    }
  };

  // This function shouldn't be called directly from the view layer
  // All of our routing changes go through here,
  // both internal and stream URL changes (see below)
  function route(payload) {
    var route = routeStore.getRouteFromPath(payload.path),
      path = route && route.name;

    if (routes[path]) return routes[path](payload);
  }

  return dispatcher.registerActionCreator({

    toggleColor: function(payload) {
      dispatcher.dispatch('toggle:color', payload);
    },

    toggleAll: function() {
      dispatcher.dispatch('toggle:all');
    },

    // goto is only used for internal route changes
    // this is most likely to happen when a user interaction calls for a URL change
    goto: function(payload) {
      payload.pathChangedInternally = true;
      route(payload);
    },

    // used only for URL stream changes
    // the URL stream is how we think of direct-URL changes by the user
    // most commonly, these changes are the result of the user clicking the
    // Back or Forward buttons of the browser
    routingPathChange: function(payload) {
      route({path:payload.newPath, pathChangedInternally: false});
    }
  })
});