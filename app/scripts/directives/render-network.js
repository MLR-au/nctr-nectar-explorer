'use strict';
// As per http://bl.ocks.org/mbostock/1093130

angular.module('nectarExplorerApp')
  .directive('renderNetwork', [ '$window', '$sce', function ($window, $sce) {
    return {
      templateUrl: 'views/render-network.html',
      restrict: 'E',
      scope: {
          data: '=ngModel',
      },
      link: function postLink(scope, element, attrs) {

        var e = angular.element(document.querySelector('#header'));
        var width = $window.innerWidth,
            height = $window.innerHeight - e[0].clientHeight;

        scope.position = {
            'position': 'absolute',
            'top': e[0].clientHeight,
            'left': '0'
        }

        var force = d3.layout.force()
            .linkDistance(150)
            .charge(-5000)
            .gravity(.05)
            .size([width, height])
            .on("tick", tick);

        // redraw the view when zooming
        var redraw = function() {
            d3.select('svg')
              .select('g')
              .attr('transform', 'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')');
        }
        var zoom = d3.behavior
                 .zoom()
                 .scale([0.8])
                 .translate([width/8, 50])
                 .scaleExtent([0,8]).on('zoom', redraw);

        var svg = d3.select("#explorer").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .call(zoom)
            .append('g')
            .attr('transform','translate(' + width/8 + ',' + 50 + ')scale(.8,.8)');

        var link = svg.selectAll(".link"),
            node = svg.selectAll(".node");

        update();

        function update() {
          var nodes = flatten(scope.data),
              links = d3.layout.tree().links(nodes);

          // Restart the force layout.
          force
              .nodes(nodes)
              .links(links)
              .start();

          // Update links.
          link = link.data(links, function(d) { return d.target.id; });

          link.exit().remove();

          link.enter()
              .append("svg:path")
              .attr("class", "link");

          // Update nodes.
          node = node.data(nodes, function(d) { return d.id; });

          node.exit().remove();

          var nodeEnter = node.enter().append("g")
              .attr("class", "node")
              .on("click", click)
              .call(force.drag);

          //nodeEnter.append("circle")
          //    .attr("r", function(d) { return Math.sqrt(d.size) || 4.5; });

          //nodeEnter.append("text")
          //    .attr("dy", ".35em")
          //    .text(function(d) { return d.id; });

          nodeEnter.filter(function(d) {
                if (d.id === 'Virtual Laboratories') {
                    return true;
                }
              })
              .append('image')
              .attr("xlink:href", "images/logo.png")
              .attr("x", -100)
              .attr("y", -100)
              .attr("width", 200)
              .attr("height", 200);

          nodeEnter.filter(function(d) {
                if (d.id !== 'Virtual Laboratories') {
                    return true;
                }
              })
              .append('circle')
              .attr('r', function(d) { 
                  var c = d.attributes.custom_class;
                  if (c === '2') {
                      return 30;
                  } else {
                      return 20;
                  }
              })
              .attr('fill', function(d) {
                  return color(d);
              });

          nodeEnter.append("text")
              .filter(function(d) {
                  if (d.id !== 'Virtual Laboratories') { return true; }
              })
              .attr("dx", function(d) {
                  if (d.x < 0) {
                      return -35;
                  } else {
                      return 35;
                  }
              }) 
              .attr("dy", "0.35em")
              .style('text-anchor', function(d) {
                  if (d.x < 0) {
                      return 'end';
                  } else {
                      return 'start';
                  }
              })
              .text(function(d) { return d.id })
              .style('font', function(d) {
                return '15px sans-serif';
              });

          node.select("circle")
              .style("fill", color)
              .style('stroke', color);
        }

        function tick() {
          link.attr("d", function(d) {
              var dx = d.target.x - d.source.x,
                  dy = d.target.y - d.source.y,
                  dr = Math.sqrt(dx * dx + dy * dy);
              return "M" +
                  d.source.x + "," +
                  d.source.y + "A" +
                  dr + "," + dr + " 0 0,1 " +
                  d.target.x + "," +
                  d.target.y;
          });

          node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        }

        function color(d) {
          return d._children ? "#3182bd" // collapsed package
              : d.children ? "#666" // expanded package
              : "#3182bd"; // leaf node
        }

        // Toggle children on click.
        function click(d) {
          displayInfo(d);
          if (d3.event.defaultPrevented) return; // ignore drag
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          update();
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

        // Returns a list of all nodes under the root.
        function flatten(root) {
          var nodes = [], i = 0;

          function recurse(node) {
            if (node.children) node.children.forEach(recurse);
            if (!node.id) node.id = ++i;
            nodes.push(node);
          }

          recurse(root);
          return nodes;
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
