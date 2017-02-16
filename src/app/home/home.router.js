(function() {
  'use strict';

  angular
    .module('app.home')
    .run(appRun);

    appRun.$inject = ['routerHelper'];

    /* @ngInject */
    function appRun(routerHelper) {
      routerHelper.configureStates(getStates());
    }

    function getStates() {
      var states = [
        {
          state: 'app.home',
          config: {
            url: '/home',
            views: {
              'content@app': {
                templateUrl: 'app/home/home.tpl.html',
                controller: 'HomeController',
                controllerAs: 'vm'
              }
            }
          }
        }
      ];

      return states;
    }
})();