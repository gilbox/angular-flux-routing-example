var app = angular.module('plunker', ['ui.router']);

app.constant('dispatcher', new simflux.Dispatcher());

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
    //
    // Note that we should probably generate these states automatically
    // by adding the following meta-data to routeStore.routes, but
    // it's done this way for simplicity's sake.

    .state('home', { template: '<home />' })
    .state('about', { template: '<about />' })

});

