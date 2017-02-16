/* jshint -W117, -W130 */
(function() {
  //'use strict';

  describe('home routes', function() {
    describe('state', function() {
      var view = 'app/home/home.tpl.html';
      var layout = 'app/layout/layout.tpl.html';

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
        $templateCache.put(layout, '');
      });

      it('should map state home to url /home', function() {
        expect($state.href('app.home', {})).toEqual('#!/home');
      });

      it('should map state route to view', function() {
        expect($state.get('app.home').views['content@app'].templateUrl).toEqual(view);
      });

      it('should work with $state.go', function() {
        $state.go('app.home');
        $rootScope.$apply();
        expect($state.is('app.home'));
      });

    });

  });

})();
