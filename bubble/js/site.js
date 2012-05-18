// This code heavily draws from the ideas/code from
// http://bost.ocks.org/mike/nations/ and
// https://github.com/mbostock/bost.ocks.org/blob/gh-pages/mike/nations/index.html
// Permission was granted from Mike Bostock before reusing, so if you
// intend to reuse this please also ask him.

var ydayConversions = {"60":"Feb 29, 2012","61":"Mar 01, 2012","62":"Mar 02, 2012","63":"Mar 03, 2012","64":"Mar 04, 2012","65":"Mar 05, 2012","66":"Mar 06, 2012","67":"Mar 07, 2012","68":"Mar 08, 2012","69":"Mar 09, 2012","70":"Mar 10, 2012","71":"Mar 11, 2012","72":"Mar 12, 2012","73":"Mar 13, 2012","74":"Mar 14, 2012","75":"Mar 15, 2012","76":"Mar 16, 2012","77":"Mar 17, 2012","78":"Mar 18, 2012","79":"Mar 19, 2012","80":"Mar 20, 2012","81":"Mar 21, 2012","82":"Mar 22, 2012","83":"Mar 23, 2012","84":"Mar 24, 2012","85":"Mar 25, 2012","86":"Mar 26, 2012","87":"Mar 27, 2012","88":"Mar 28, 2012","89":"Mar 29, 2012","90":"Mar 30, 2012","91":"Mar 31, 2012","92":"Apr 01, 2012","93":"Apr 02, 2012","94":"Apr 03, 2012","95":"Apr 04, 2012","96":"Apr 05, 2012","97":"Apr 06, 2012","98":"Apr 07, 2012","99":"Apr 08, 2012","100":"Apr 09, 2012","101":"Apr 10, 2012","102":"Apr 11, 2012","103":"Apr 12, 2012","104":"Apr 13, 2012","105":"Apr 14, 2012","106":"Apr 15, 2012","107":"Apr 16, 2012","108":"Apr 17, 2012","109":"Apr 18, 2012","110":"Apr 19, 2012","111":"Apr 20, 2012","112":"Apr 21, 2012","113":"Apr 22, 2012","114":"Apr 23, 2012","115":"Apr 24, 2012","116":"Apr 25, 2012","117":"Apr 26, 2012","118":"Apr 27, 2012","119":"Apr 28, 2012","120":"Apr 29, 2012","121":"Apr 30, 2012","122":"May 01, 2012","123":"May 02, 2012","124":"May 03, 2012","125":"May 04, 2012","126":"May 05, 2012","127":"May 06, 2012","128":"May 07, 2012","129":"May 08, 2012","130":"May 09, 2012","131":"May 10, 2012","132":"May 11, 2012","133":"May 12, 2012","134":"May 13, 2012","135":"May 14, 2012","136":"May 15, 2012","137":"May 16, 2012","138":"May 17, 2012","139":"May 18, 2012"}

// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return d.size / 1024 / 1024; }
function y(d) { return d.pushes / 1000; }
function radius(d) { return d.repos; }
function color(d) { return d.name; }
function key(d) { return d.name; }
function tooltip(d) { return d.name + ": " + d.repos + " repos " + d.pushes + " pushes " + x(d).toFixed(2) + " GB"; }

function fillTable(dot) { 
  var $body = $("#explicit tbody");
  $body.empty();
  dot.each(function(d) {
    $body.append("<tr><td>" + d.name + "</td><td>" + d.repos + "</td><td>" + d.pushes + "</td><td>" + x(d).toFixed(2) + "</td></tr>");
  });
}


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
  $(".collapse").collapse({toggle:false});

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
      .duration(10000)
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
      fillTable(dot);
      label.text(ydayConversions[Math.round(day).toString()]);
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
