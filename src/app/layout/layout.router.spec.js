/* jshint -W117, -W030 */
(function() {
  //'use strict';

  describe('layout routes', function() {
    describe('state', function() {
      var view = 'app/layout/layout.tpl.html';
      var home = 'app/home/home.tpl.html';

      beforeEach(module('app'));

      beforeEach(inject(function(_$httpBackend_, _$location_, _$rootScope_, _$state_, _$templateCache_) {
        $httpBackend = _$httpBackend_;
        $location = _$location_;
        $rootScope = _$rootScope_;
        $state = _$state_;
        $templateCache = _$templateCache_;
      }));

       beforeEach(function() {
        $templateCache.put(view, '');
        $templateCache.put(home, '');
      });

      it('app state should have null url', function() {
        expect($state.href('app', {})).toBeNull();
      });

      it('should map state route to view', function() {
        expect($state.get('app').views.root.templateUrl).toEqual(view);
      });

      it('expect root path to redirect to home', function() {
        $location.path('/');
        $rootScope.$apply();
        expect($state.is('app.home'));
      });
    });
  });

})();