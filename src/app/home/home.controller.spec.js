/* jshint -W117, -W130 */
(function() {
  //'use strict';

  describe('HomeController', function() {
    beforeEach(module('app'));

    var $controller;

    beforeEach(inject(function(_$controller_) {
      $controller = _$controller_;
    }));

    describe('Home Controller', function() {
      var controller;

      beforeEach(function() {
        controller = $controller('HomeController');
      });

      it('should be defined', function() {
        expect(controller).toBeDefined();
      });

      it('should have a title of home', function() {
        expect(controller.title).toEqual('Home');
      });

    });
  });

})();