app.factory('appStore', function(dispatcher) {
  return dispatcher.registerStore({
    storeName: 'appStore',
    showLoadingIndicator: false,

    'loadingIndicator:show': function() {
      this.showLoadingIndicator = true;
    },

    'loadingIndicator:hide': function() {
      this.showLoadingIndicator = false;
    }
  })
});

app.factory('routeStore', function(dispatcher, $rootScope, $state, $location) {

  // this is where we need the ability to calculate
  // route <-> state matches
  // unfortunately, we can't use ui-router without 2-way binding to the URL :-(
  // ... so we use routr instead :-D

  return dispatcher.registerStore({
    storeName: 'routeStore',
    state: undefined,
    path: undefined,
    pathChangedInternally: undefined,

    router: new Router({  // this is routr    https://github.com/yahoo/routr

      home: {
        path: '/',
        method: 'get'
      },

      about: {
        path: '/about',
        method: 'get'
      }

    }),

    getRouteFromPath: function (path) {
      return this.router.getRoute(path);
    },

    'routing:path:change': function(payload) {
      this.path = payload.newPath;

      // @todo: handle error when route doesn't exist
      this.state = this.router.getRoute(payload.newPath).name;
    },

    'route': function(payload) {
      console.log('route', payload);

      // @todo: handle error when route doesn't exist
      this.state = this.router.getRoute(payload.path).name;
      this.path = payload.path;
      this.pathChangedInternally = !! payload.pathChangedInternally;
    }
  });
});

app.factory('aboutStore', function (dispatcher) {
  return dispatcher.registerStore({
    storeName: 'aboutStore',
    people: [],

    'loaded:about': function(payload) {
      this.people = payload.people;
    }
  });
});

app.factory('colorStore', function (dispatcher, colorFilters) {
  return dispatcher.registerStore({
    storeName: 'colorStore',
    colors: [],
    colorsLoaded: false,
    colorFilters: colorFilters,
    selectedColors: [], // which colors are selected out of colorFilters array?
    allSelected: true,

    updateSelected: function() {
      // update the list of colors which are selected
      // this is used by the ng-repeat in index.html to filter
      // the color list
      this.selectedColors = this.colorFilters.filter(function(color) {
        return color.selected;
      });
      this.allSelected = this.selectedColors.length === this.colorFilters.length;
    },

    'loaded:colors': function(payload) {
      this.colors = payload.colors.map(function(c,i) {
        // add index property to each color to make it
        // easy to track inside of the ng-repeat
        c.index = i;
        return c;
      });
      this.updateSelected();
      this.colorsLoaded = true;
    },

    'toggle:color': function(payload) {
      payload.color.selected = !payload.color.selected;
      this.updateSelected();
    },

    'toggle:all': function() {
      var newV = !this.allSelected;
      this.colorFilters.forEach(function(color) {
        color.selected = newV;
      });
      this.updateSelected();
    }
  })
});