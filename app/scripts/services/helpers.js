'use strict';

angular.module('nectarExplorerApp')
  .service('Helpers', function Helpers() {

      function convertToTree(data) {
          var l1,
              l2 = {},
              l3 = {};
          angular.forEach(data.nodes, function(v,k) {
              var c = v.attributes.custom_class;
              if (c === "1") {
                  l1 = v;
                  l1.children = [];
              } else if (c === "2") {
                  v.children = [];
                  l2[v.id] = v;
              } else if (c !== "1" && c !== "2" && c !== undefined) {
                  l3[v.id] = v;
              }
          })

          angular.forEach(data.edges, function(v,k) {
              if (l2[v.source] !== undefined) {
                  if (l3[v.target] !== undefined) {
                      l2[v.source].children.push(l3[v.target]);
                  }
              } else if (l2[v.target] !== undefined) {
                  if (l3[v.source] !== undefined) {
                      l2[v.target].children.push(l3[v.source]);
                  }
              }
          });

          angular.forEach(l2, function(v,k) {
              l1.children.push(v);
          });
          return l1;
      }

      var helpers = {
          convertToTree: convertToTree
      }
      return helpers;
  });
