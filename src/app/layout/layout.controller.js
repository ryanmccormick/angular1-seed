(function() {
  'use strict';

  angular
    .module('app.layout')
    .controller('LayoutController', LayoutController);

  LayoutController.$inject = ['$state', '$log'];

  /* @ngInject */
  function LayoutController ($state, $log) {
    var vm = this;
    vm.param = 'Layout';
    vm.checkState = checkState;

    activate();
    ///////////////

    function activate() {
      $log.log('layout is activated');
    }

    function checkState(state) {
      return $state.current.name === state;
    }

  }

})();
