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

    // goto is only used for internal route changes
    goto: function(payload) {
      payload.pathChangedInternally = true;
      this._route(payload);
    },

    // used only for URL stream changes
    routingPathChange: function(payload) {
      this._route({path:payload.newPath, pathChangedInternally: false});
    }
  })
});

app.run(function($location, $rootScope, $state, actionCreator, routeStore, aboutStore, appStore) {
  window._$location = $location;

  // watch the URL path input stream (user-initiated routing changes)
  $rootScope.$watch(function() {
    return $location.path();
  }, function(newPath, oldPath) {
    if (!routeStore.pathChangedInternally) {
      console.log('URL stream:', newPath);
      actionCreator.routingPathChange({newPath:newPath, oldPath:oldPath});
    }
  });

  // bind to view by watching routeStore.state
  $rootScope.$watch(function() {
    return routeStore.state;
  }, function (newState, oldState) {
    console.log('routeStore.state changed:', newState);
    if (newState) $state.go(newState);
  });

  // bind to URL Bar by watching routeStore.path
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
    // in the same vein that everything in React is a component

    .state('home', { template: '<home />' })
    .state('about', { template: '<about />' })

});

