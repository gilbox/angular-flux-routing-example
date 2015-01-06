var app = angular.module('plunker', ['ui.router']);

app.constant('dispatcher', new simflux.Dispatcher());

app.factory('actionCreator', function (dispatcher, colorApi, aboutApi, colorStore, routeStore) {
  return dispatcher.registerActionCreator({

    toggleColor: function(payload) {
      dispatcher.dispatch('toggle:color', payload);
    },

    toggleAll: function() {
      dispatcher.dispatch('toggle:all');
    },

    // This function shouldn't be called directly from the view layer
    // All of our routing changes go through here,
    // both internal and stream URL changes (see below)
    _route: function(payload) {
      if (routeStore.pathMatchesState(payload.path, 'about')) {

        // whenever the 'about' route is loaded, we re-load
        // the about data with aboutApi.
        // This probably makes little sense in a real-world application,
        // but contrast this to how the color data is only loaded one
        // time in the 'home' route below

        dispatcher.dispatch('loadingIndicator:show');

        aboutApi.fetch().success(function(data) {
          dispatcher.dispatch('loaded:about', {people:data});
          dispatcher.dispatch('route', payload);
          dispatcher.dispatch('loadingIndicator:hide');
        });


      } else if (routeStore.pathMatchesState(payload.path, 'home')) {
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
            dispatcher.dispatch('loaded:colors', {colors:data});
            dispatcher.dispatch('route', payload);
            dispatcher.dispatch('loadingIndicator:hide');
          });
        }
      }
    },

    // goto is only used for internal route changes
    // this is most likely to happen when a user interaction calls for a URL change
    goto: function(payload) {
      payload.pathChangedInternally = true;
      this._route(payload);
    },

    // used only for URL stream changes
    // the URL stream is how we think of direct-URL changes by the user
    // most commonly, it's these changes are the result of the user clicking the
    // Back or Forward buttons of the browser
    routingPathChange: function(payload) {
      this._route({path:payload.newPath, pathChangedInternally: false});
    }
  })
});

app.run(function($location, $rootScope, $state, actionCreator, routeStore, aboutStore, appStore) {
  window._$location = $location;

  // Watch the URL path input stream (user-initiated routing changes)
  // When the user clicks Back or Forward, this is effectively the event handler.
  // We can differentiate stream from internal URL changes because
  // all URL changes are routed through actionCreator.goto(..) or actionCreating.routingPathChange(..)
  // which will decorate the path-carrying payload with the pathChangedInternally property
  $rootScope.$watch(function() {
    return $location.path();
  }, function(newPath, oldPath) {
    if (!routeStore.pathChangedInternally) {
      console.log('URL stream:', newPath);
      actionCreator.routingPathChange({newPath:newPath, oldPath:oldPath});
    }
  });

  // bind to view by watching routeStore.state
  // This is how internally-requested route changes (via actionCreator.goto(..))
  // swap out directives which display the various views
  $rootScope.$watch(function() {
    return routeStore.state;
  }, function (newState, oldState) {
    console.log('routeStore.state changed:', newState);
    if (newState) $state.go(newState);
  });

  // bind to URL Bar by watching routeStore.path
  // This is how internally-requested route changes (via actionCreator.goto(..))
  // change the URL in the address bar
  $rootScope.$watch(function() {
    return routeStore.path;
  }, function (newPath, oldPath) {
    console.log('routeStore.path changed:',newPath);
    $location.path(newPath)
  });

});

app.config(function($locationProvider, $stateProvider) {
  $locationProvider.html5Mode(true);

  $stateProvider

    // state machine bindings:
    // these states correspond to states in the routeStore
    //
    // relate states to "components", ie: directives
    // we use directives exclusively instead of ng-controller,
    // in the same vein that everything in React is a component.
    // Doing it this way creates more module, easier to re-use code
    // which is easier to test and simpler to reason about.

    .state('home', { template: '<home />' })
    .state('about', { template: '<about />' })

});

