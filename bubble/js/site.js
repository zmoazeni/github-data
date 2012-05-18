// This code heavily draws from the ideas/code from
// http://bost.ocks.org/mike/nations/ and
// https://github.com/mbostock/bost.ocks.org/blob/gh-pages/mike/nations/index.html
// Permission was granted from Mike Bostock before reusing, so if you
// intend to reuse this please also ask him.

// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return d.size / 1024 / 1024; }
function y(d) { return d.pushes / 1000; }
function radius(d) { return d.repos; }
function color(d) { return d.name; }
function key(d) { return d.name; }
function tooltip(d) { return d.name + ": " + d.repos + " repos " + d.pushes + " pushes " + (d.size / 1024 / 1024).toFixed(2) + " GB"; }

// Chart dimensions.
var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
width = 960 - margin.right,
height = 500 - margin.top - margin.bottom;

// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.pow().exponent(.3).domain([0, 200]).range([0, width]),
yScale = d3.scale.pow().exponent(.3).domain([0, 16]).range([height, 0]),
radiusScale = d3.scale.sqrt().domain([0, 5000]).range([5, 50]),
colorScale = d3.scale.category20b();

// The x & y axes.
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
yAxis = d3.svg.axis().scale(yScale).orient("left");

var dayRange = [72, 138];

$(function() {
  prettyPrint();

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
    .text("total size of repositories (gigabytes)");

  // Add a y-axis label.
  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", "0.75em")
    .attr("transform", "rotate(-90)")
    .text("git pushes (thousands)");

  // Add the date label; the value is set on transition.
  var label = svg.append("text")
    .attr("class", "date label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width);

  // Load the data.
  d3.json("js/data.json", function(languages) {
    // A bisector since many repo data is sparsely-defined.
    var bisect = d3.bisector(function(d) { return d[0]; });

    // Add a dot per language. Initialize the data at 72 (yday), and set the colors.
    var dot = svg.append("g")
      .attr("class", "dots")
      .selectAll(".dot")
      .data(interpolateData(dayRange[0]))
      .enter().append("circle")
      .attr("class", "dot")
      .style("fill", function(d) { return colorScale(color(d)); })
      .call(position)
      .sort(order)
      .attr("data-original-title", tooltip);

    // Add a title.
    dot.append("title")
      .text(function(d) { return d.name; });


    $("circle").tooltip()

    // Start a transition that interpolates the data based on day.
    svg.transition()
      .duration(1000)
      .ease("linear")
      .tween("day", tweenDay)
      .each("end", enableInteraction);

    // Positions the dots based on data.
    function position(dot) {
      dot .attr("cx", function(d) { return xScale(x(d)); })
        .attr("cy", function(d) { return yScale(y(d)); })
        .attr("r", function(d) { return radiusScale(radius(d)); });
    }

    // Defines a sort order so that the smallest dots are drawn on top.
    function order(a, b) {
      return radius(b) - radius(a);
    }

    // After the transition finishes, you can mouseover to change the day.
    function enableInteraction() {
      var box = label.node().getBBox();

      var graphScale = d3.scale.linear()
        .domain(dayRange)
        .range([box.x + 10, box.x + box.width - 10])
        .clamp(true);

      svg.append("rect")
        .attr("class", "overlay")
        .attr("x", box.x)
        .attr("y", box.y)
        .attr("width", box.width)
        .attr("height", box.height)
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousemove", mousemove)
        .on("touchmove", mousemove);

      function mouseover() {
        label.classed("active", true);
      }

      function mouseout() {
        label.classed("active", false);
      }

      function mousemove() {
        displayDay(graphScale.invert(d3.mouse(this)[0]));
      }
    }

    // Tweens the entire chart by first tweening the day, and then the data.
    // For the interpolated data, the dots and label are redrawn.
    function tweenDay() {
      var day = d3.interpolateNumber(dayRange[0], dayRange[1]);
      return function(t) { displayDay(day(t)); };
    }

    // Updates the display to show the specified day.
    function displayDay(day) {
      dot.data(interpolateData(day), key).call(position).sort(order).attr("data-original-title", tooltip);
      label.text(Math.round(day));
    }

    // Interpolates the dataset for the given day.
    function interpolateData(day) {
      return languages.map(function(d) {
        return {
          name: d.name,
          pushes: interpolateValues(d.pushes, day),
          repos: interpolateValues(d.repos, day),
          size: interpolateValues(d.sizes, day)
        };
      });
    }

    // Finds (and possibly interpolates) the value for the specified day.
    function interpolateValues(values, day) {
      var i = bisect.left(values, day, 0, values.length - 1),
      a = values[i];
      return a[1];

      // var i = bisect.left(values, day, 0, values.length - 1),
      // a = values[i];
      // if (i > 0) {
      //   var b = values[i - 1],
      //   t = (day - a[0]) / (b[0] - a[0]);
      //   return a[1] * (1 - t) + b[1] * t;
      // }
      // return a[1];
    }
  });
});
