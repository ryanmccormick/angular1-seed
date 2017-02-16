/* jshint -W117, -W130 */
(function() {
  //'use strict';

  describe('LayoutController', function() {
    beforeEach(module('app'));

    var $controller;

    beforeEach(inject(function(_$controller_) {
      $controller = _$controller_;
    }));

    describe('Layout Controller', function() {
      var controller;

      beforeEach(function() {
        controller = $controller('LayoutController');
      });

      it('should be defined', function() {
        expect(controller).toBeDefined();
      });

      it('should have a param of layout', function() {
        expect(controller.param).toEqual('Layout');
      });

    });
  });

})();