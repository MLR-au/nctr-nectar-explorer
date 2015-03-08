'use strict';

describe('Directive: renderTree', function () {

  // load the directive's module
  beforeEach(module('nectarExplorerApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<render-tree></render-tree>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the renderTree directive');
  }));
});
