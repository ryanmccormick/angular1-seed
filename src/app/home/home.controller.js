(function() {
  'use strict';

  angular
    .module('app.home')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$state', '$log'];

  /* @ngInject */
  function HomeController ($state, $log) {
    var vm = this;
    vm.title = 'Home';

    activate(); 
    ///////////////////

    function activate() {
      $log.log('Home controller is activated');
    }

  }

})();