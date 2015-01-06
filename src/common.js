// This is all standard angular stuff, there is nothing Flux-y about it...


// given a list of colors, will filter by fuzzy-match
// comparing to another list of colors (filterColors)
app.filter('similarColors', function(colorUtils) {
  return function(colors, filterColors) {
    var r = [];
    if ((colors instanceof Array) && (filterColors instanceof Array)) {
      colors.forEach(function(color) {
        if (filterColors.some(colorUtils.fuzzyMatch.bind(null,color)))
          r.push(color);
      })
    }
    return r;
  }
});

app.factory('colorApi', function ($http) {
  var numRows = 1000;
  return {
    // a simple HTTP API that returns a bunch of random colors
    fetch: $http.get.bind($http, "http://www.filltext.com/?rows="+numRows+"&r={number|255}&g={number|255}&b={number|255}")
  }
});

app.factory('aboutApi', function ($http) {
  var numRows = 200;
  return {
    // a simple HTTP API that returns a bunch of random names
    fetch: $http.get.bind($http, "http://www.filltext.com/?rows="+numRows+"&fname={firstName}&lname={lastName}")
  }
});

app.factory('colorUtils', function () {
  var thresh = 120; // fuzzy match threshold

  return {

    // converts a color object like {r:125,g:0,b:255}
    // to a css value like "rgb(125,0,255)"
    fcolor: function(color) {
      return 'rgb('+color.r+','+color.g+','+color.b+')'
    },

    // fuzzily compares two colors and returns true if
    // they match
    fuzzyMatch: function(c1, c2) {
      return (Math.abs(c1.r-c2.r) < thresh && Math.abs(c1.g-c2.g) < thresh && Math.abs(c1.b-c2.b) < thresh)
    }
  }
});

// these are the colors that will be utilized by the
// color-selector directive
app.value('colorFilters', [
  {selected:true,r:255,g:0,b:0},
  {selected:true,r:0,g:255,b:0},
  {selected:true,r:0,g:0,b:255},
  {selected:true,r:128,g:0,b:128},
  {selected:true,r:0,g:128,b:128},
  {selected:true,r:128,g:128,b:0},
  {selected:true,r:255,g:255,b:0},
  {selected:true,r:0,g:255,b:255},
  {selected:true,r:255,g:0,b:255}
]);
