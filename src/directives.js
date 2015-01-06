
app.directive('home', function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'home.html',
    controller: 'HomeCtrl'
  }
});

app.controller('HomeCtrl', function($scope, colorUtils, colorStore, actionCreator) {
  $scope.colorStore = colorStore;
  $scope.fcolor = colorUtils.fcolor;
  $scope.aboutClick = function() {
    actionCreator.goto({path:'/about'});
  };
});

app.directive('about', function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'about.html',
    controller: function($scope, actionCreator, aboutStore) {
      $scope.aboutStore = aboutStore;
      $scope.homeClick = function() {
        actionCreator.goto({path:'/'});
      };
    }
  }
});

app.directive('loadingIndicator', function (appStore) {
  return {
    restrict: 'E',
    scope: {},
    template: '<div class="LoadingIndicator" ng-show="appStore.showLoadingIndicator"></div>',
    link: function(scope) {
      scope.appStore = appStore;
    }
  }
});

app.directive('colorSelector', function(colorUtils, actionCreator) {
  return {
    scope: {
      colors: '=',
      allSelected: '='
    },
    templateUrl: 'color-selector.html',
    link: function(scope) {
      scope.fcolor = colorUtils.fcolor;

      scope.clickColor = function(color) {
        actionCreator.toggleColor({color:color});
      };

      // the 'All' toggle button was clicked
      scope.clickAll = function() {
        actionCreator.toggleAll();
      };
    }
  }
});
