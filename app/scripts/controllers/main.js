'use strict';

angular.module('nectarExplorerApp')
  .controller('MainCtrl', [ '$scope', '$window', '$sce', '$timeout', '$routeParams', '$location', 'Configuration', 'Helpers', 
    function ($scope, $window, $sce, $timeout, $routeParams, $location, conf, Helpers) {
        var path, node, svg, zoom;


        var wdw = angular.element($window);
        wdw.bind('resize', function() {
            $scope.$apply(function() {
                var e = angular.element(document.querySelector('#header'));
                d3.select('svg')
                  .style('width', $window.innerWidth)
                  .style('height', $window.innerHeight - e[0].clientHeight);
            })
        });

        var data = conf.load[$routeParams.load];
        d3.json('data/' + data, function(error, json) {
            $scope.nodes = [];
            $scope.links = [];
            var links = [];

            $scope.$apply(function() {
                var links = [];
                angular.forEach(json.nodes, function(v, k) {
                    links.push(v.id);
                })
                angular.forEach(json.edges, function(v,k) {
                    var n = {
                        'source': links.indexOf(v.source),
                        'target': links.indexOf(v.target),
                        'weight': 1
                    }
                    $scope.links.push(n);
                })
                $scope.nodes = json.nodes;

                var network = {
                    'nodes': $scope.nodes,
                    'links': $scope.links
                };
                var tree = Helpers.convertToTree(json);

                $scope.drawNetwork = false;
                $scope.drawTree = false;
                if ($routeParams.as === 'network') {
                    angular.forEach(tree.children, function(v, k) {
                        tree.children[k]._children = v.children;
                        tree.children[k].children = null;
                        $scope.tree = tree;
                    });
                    $scope.drawTree = false;
                    $scope.drawNetwork = true;
                    $scope.explorationMethod = 'hierarchy';
                    $scope.url = $location.url().replace('network', 'tree');
                } else if ($routeParams.as === 'tree') {
                    $scope.tree = tree;
                    $scope.drawNetwork = false;
                    $scope.drawTree = true;
                    $scope.explorationMethod = 'network';
                    $scope.url = $location.url().replace('tree', 'network');
                }
            });
        });

        function drawIt() {
            // redraw the view when zooming
            var redraw = function() {
                d3.select('svg')
                  .select('g')
                  .attr('transform', 'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')');
            }

            // calculate node / link positions during the simulation
            var tick = function() {
                path.attr("d", function(d) {
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

                node.attr('transform', function(d) {
                  return 'translate(' + d.x + ',' + d.y + ')';
                });
            }


            zoom = d3.behavior
                     .zoom()
                     .scale([0.5])
                     .translate([w/5, h/6])
                     .scaleExtent([0,8]).on('zoom', redraw);

            var force = d3.layout.force()
                .nodes($scope.nodes)
                .links($scope.links)
                .charge(-2000)
                .linkDistance(200)
                .linkStrength(1)
                .size([w, h])
                .on('tick', tick);

            var svg = d3.select('#explorer')
                .append('svg')
                .attr('width', w)
                .attr('height', h)
                .attr('viewBox', '0 0 ' + w + ' ' + h)
                .attr('preserveAspectRatio', 'xMidYMid meet')
                .call(zoom)
                .append('g')
                .attr('transform','translate(' + w/5 + ',' + h/6 + ')scale(.5,.5)');

            path = svg.selectAll('.path').data(force.links());
            node = svg.selectAll('.node').data(force.nodes());

            // add the links
            path.enter()
                .append("svg:path")
                .attr("class", "link");

            //draw the nodes
            node.enter()
                .append('g')
                .attr('id', function(d, i) {
                    return 'node_' + i; 
                })
                .attr('class', 'node');

            node.filter(function(d) { 
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

            node.filter(function(d) {
                    if (d.id !== 'Virtual Laboratories') {
                        return true;
                    }
                })
                .append('circle')
                .attr('r', function(d) { return d.size; })
                .attr('fill', function(d) {
                    return d.color;
                });

            node.append("text")
                .filter(function(d) {
                    if (d.id !== 'Virtual Laboratories') { return true; }
                })
                .attr("dx", 12)
                .attr("dy", ".35em")
                .text(function(d) { return d.id })
                .style('font', function(d) {
                    if (d.id === 'NeCTAR') {
                        return '70px sans-serif';
                    } else if (d.id === 'NeCTAR Funded Projects' || d.id === 'Research Cloud' || d.id === 'Virtual Laboratories') {
                        return '30px sans-serif';
                    } else {
                        return '15px sans-serif';
                    }
                });

            // handle the node click event
            node.on('click', function(d) {
                $scope.$apply(function() {
                    $scope.iframePanelStyle = {
                        'position': 'fixed',
                        'z-index': '300',
                        'top': '100px',
                        'left': ($window.innerWidth - 700) / 2, 
                        'width': '720px',
                        'height': $window.innerHeight * 0.8
                    }
                    $scope.iframeStyle = {
                        'border': '0', 
                        'border-radius': '8px',
                        'background-color': 'white',
                        'overflow': 'hidden',
                    }
                    $scope.nodeSelected = true;
                    $scope.targetUrl = $sce.trustAsResourceUrl(d.attributes.custom_url);
                    $scope.iframeWidth = 720;
                    $scope.iframeHeight = $window.innerHeight * 0.8;
                });
            });

            force.start();

        }

        $scope.dismiss = function() {
            $scope.nodeSelected = false;
        }

  }]);
