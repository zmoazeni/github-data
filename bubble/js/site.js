// This code heavily draws from the ideas/code from
// http://bost.ocks.org/mike/nations/ and
// https://github.com/mbostock/bost.ocks.org/blob/gh-pages/mike/nations/index.html
// Permission from Mike Bostock before reusing, so if you intend to
// please also ask him.

// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return d.size; }
function y(d) { return d.pushes; }
function radius(d) { return d.repos; }
function color(d) { return d.name; }
function key(d) { return d.name; }

// Chart dimensions.
var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
width = 960 - margin.right,
height = 500 - margin.top - margin.bottom;

// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.pow().domain([0, 1e9]).range([0, width]),
yScale = d3.scale.linear().domain([0, 15000]).range([height, 0]),
radiusScale = d3.scale.sqrt().domain([0, 5000]).range([0, 40]),
colorScale = d3.scale.category20b();

// The x & y axes.
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
yAxis = d3.svg.axis().scale(yScale).orient("left");

$(function() {
  // Create the SVG container and set the origin.
  var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Add the x-axis.
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // Add the y-axis.
  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  // Add an x-axis label.
  svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 5)
    .text("total size of repositories (kilobytes)");

  // Add a y-axis label.
  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", "0.75em")
    .attr("transform", "rotate(-90)")
    .text("number of git pushes");

  // Add the year label; the value is set on transition.
  var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width);
});
