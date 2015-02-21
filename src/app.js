var app = angular.module('plunker', ['ui.router']);

app.constant('dispatcher', new simflux.Dispatcher());

app.run(function($location, $rootScope, $state, actionCreator, routeStore, aboutStore, appStore) {
  window._$location = $location;

  // Watch the URL path input stream (user-initiated routing changes)
  // Ie., when the user clicks Back or Forward.
  function handlePathChange() {
    console.log(">>> " + location.pathname + location.search);
    actionCreator.routingPathChange({path:location.pathname + location.search});
  }

  // setup event listener for back/forward buttons
  var eventInfo = window.addEventListener ? ['addEventListener', ''] : ['attachEvent', 'on'];
  window[eventInfo[0]](eventInfo[1] + 'popstate', handlePathChange, false);

  // trigger path change on startup
  handlePathChange();

  // This is how internally-requested route changes (via actionCreator.goto(..))
  // swap out directives which display the various views
  $rootScope.$on('routingStateChange', function (e, newState) {
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

