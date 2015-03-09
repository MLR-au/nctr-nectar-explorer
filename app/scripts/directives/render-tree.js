'use strict';

// as per http://bl.ocks.org/mbostock/4339083

angular.module('nectarExplorerApp')
  .directive('renderTree', [ '$window', '$document', '$sce', function ($window, $document, $sce) {
    return {
      templateUrl: 'views/render-tree.html',
      restrict: 'E',
      scope: {
          data: '=ngModel'
      },
      link: function postLink(scope, element, attrs) {

        var e = angular.element(document.querySelector('#header'));
        var width = $window.innerWidth,
            height = $window.innerHeight - e[0].clientHeight,
            translate, scale;
        var selected = [];
        if ($window.innerWidth < 1024) {
            translate = 150;
            scale = 0.9;
        } else {
            translate = 300;
            scale = 1;
        }

        scope.position = {
            'position': 'absolute',
            'top': e[0].clientHeight,
            'left': '0'
        }
            
        var i = 0,
            duration = 750,
            root;

        var tree = d3.layout.tree()
            .size([height, width]);

        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.y, d.x]; });

        // redraw the view when zooming
        var redraw = function() {
            d3.select('svg')
              .select('g')
              .attr('transform', 'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')');
        }
        var zoom = d3.behavior
                 .zoom()
                 .scale([scale])
                 .translate([translate, 0])
                 .scaleExtent([0,8]).on('zoom', redraw);

        var svg = d3.select("#explorer").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .call(zoom)
            .append('g')
            .attr('transform','translate(' + translate + ',' + 0 + ')scale(' + scale + ',' + scale + ')');

      root = scope.data;
      root.x0 = height / 2;
      root.y0 = 0;

      function collapse(d) {
        if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
      }

      root.children.forEach(collapse);
      update(root);

        d3.select(self.frameElement).style("height", "800px");

        function update(source) {

          // Compute the new tree layout.
          var nodes = tree.nodes(root).reverse(),
              links = tree.links(nodes);

          // Normalize for fixed-depth.
          nodes.forEach(function(d) { d.y = d.depth * 180; });

          // Update the nodes…
          var node = svg.selectAll("g.node")
              .data(nodes, function(d) { return d.id || (d.id = ++i); });

          // Enter any new nodes at the parent's previous position.
          var nodeEnter = node.enter().append("g")
              .attr("class", "node")
              .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
              .on("click", click);

          nodeEnter.filter(function(d) {
                if (d.id === 'Virtual Laboratories') {
                    return true;
                }
              })
              .append('image')
              .attr("xlink:href", "images/logo.png")
              .attr("x", -100)
              .attr("y", -50)
              .attr("width", 100)
              .attr("height", 100);

          nodeEnter.filter(function(d) {
                if (d.id !== 'Virtual Laboratories') {
                    return true;
                }
              })
              .append('circle')
              .attr("r", 1e-6)
              .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

          nodeEnter.append("text")
              .text(function(d) { return d.id; })
              .style("fill-opacity", 1e-6)
              .style('font', function(d) {
                  return '15px sans-serif';
              });

          // Transition nodes to their new position.
          var nodeUpdate = node.transition()
              .duration(duration)
              .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

          nodeUpdate.select("circle")
              .attr("r", 10)
              .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

          nodeUpdate.select("text")
              .filter(function(d) {
                  if (d.id !== 'Virtual Laboratories') {
                      return true;
                  }
              })
              .style("fill-opacity", 1)
              .attr('x', function(d) {
                  var c = d.attributes.custom_class;
                  if (c === '1') {
                      return -15;
                  } else if (c === '2') {
                      if (selected.length > 0) {
                        return 50;
                      } else {
                        return 15;
                      }
                  } else {
                      return 25;
                  }
              })
              .attr('dy', function(d) {
                  var c = d.attributes.custom_class;
                  if (c === '1') {
                      return "0.35em";
                  } else if (c === '2') {
                      if (selected.length > 0) { 
                          return '-1em';
                      } else {
                          return '0.35em';
                      }
                  } else {
                      return "0.35em";
                  }
              })
              .attr('text-anchor', function(d) {
                  var c = d.attributes.custom_class;
                  if (c === '1') {
                    return 'end';
                  } else if (c === '2') {
                      if (selected.length > 0) { 
                          return 'end';
                      } else {
                          return 'start';
                      }
                  } else {
                      return 'start';
                  }
              });

          // Transition exiting nodes to the parent's new position.
          var nodeExit = node.exit().transition()
              .duration(duration)
              .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
              .remove();

          nodeExit.select("circle")
              .attr("r", 1e-6);

          nodeExit.select("text")
              .style("fill-opacity", 1e-6);

          // Update the links…
          var link = svg.selectAll("path.link")
              .data(links, function(d) { return d.target.id; });

          // Enter any new links at the parent's previous position.
          link.enter().insert("path", "g")
              .attr("class", "link")
              .attr("d", function(d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
              });

          // Transition links to their new position.
          link.transition()
              .duration(duration)
              .attr("d", diagonal);

          // Transition exiting nodes to the parent's new position.
          link.exit().transition()
              .duration(duration)
              .attr("d", function(d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
              })
              .remove();

          // Stash the old positions for transition.
          nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
          });
        }

        // Toggle children on click.
        function click(d) {
          displayInfo(d);
          if (d.children) {
            d._children = d.children;
            d.children = null;
            selected.splice(selected.indexOf(d.id), 1);
          } else {
            d.children = d._children;
            d._children = null;
            if (d.attributes.custom_class === "2") {
                selected.push(d.id);
            }
          }
          update(d);
        }
        function displayInfo(d) {
          if (d.attributes.custom_url !== undefined) {
              scope.$apply(function() {
                  scope.iframePanelStyle = {
                      'position': 'fixed',
                      'z-index': '300',
                      'top': '100px',
                      'left': ($window.innerWidth - 700) / 2,
                      'width': '720px',
                      'height': $window.innerHeight * 0.8
                  }
                  scope.iframeStyle = {
                      'border': '0',
                      'border-radius': '8px',
                      'background-color': 'white',
                      'overflow': 'hidden',
                  }
                  scope.nodeSelected = true;
                  scope.targetUrl = $sce.trustAsResourceUrl(d.attributes.custom_url);
                  scope.iframeWidth = 720;
                  scope.iframeHeight = $window.innerHeight * 0.8;
              });
          }
        }
        scope.dismiss = function() {
            scope.nodeSelected = false;
        }
        scope.openPage = function() {
            $window.location.href = scope.targetUrl;
        }



      }
    };
  }]);
