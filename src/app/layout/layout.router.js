(function() {
  'use strict';

  angular
    .module('app.layout')
    .run(appRun);

  appRun.$inject = ['routerHelper'];

  /* @ngInject */
  function appRun(routerHelper) {
    var otherwise = '/home';
    routerHelper.configureStates(getStates(), otherwise);
  }

  function getStates() {
    var states = [
      {
        state: 'app',
        config: {
          abstract: true,
          views: {
            root: {
              templateUrl: 'app/layout/layout.tpl.html',
              controller: 'LayoutController',
              controllerAs: 'vm'
            }
          }
        }
      }
    ];

    return states;
  }

})();
