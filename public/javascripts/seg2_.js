
var svg2Size = d3.select('.seg2_chart');

var svg2_margin = { top: 50, right: 180, bottom: 60, left: 50 },
    svg2_margin2 = { top: 600, right: 100, bottom: 30, left: 30 },

    svg2_width = +svg2Size.attr("width") - svg2_margin.left - svg2_margin.right,
    svg2_height = 500 - svg2_margin.top - svg2_margin.bottom,
    svg2_height2 = 700 - svg2_margin2.top - svg2_margin2.bottom,

    xScale, xScale2, yScale;

var companyName = document.getElementById("userCompany").innerHTML;
if (companyName.indexOf("(주)") != -1)
    companyName = companyName.replace("(주)", "")

d3.json("/seg2Data/seg2/company=" + companyName, function (error, data) {

    function orderData3(data) {

        var sData = data.sort(function (x, y) {
            return d3.ascending(x.date, y.date);
        })

        sData.forEach(d => {
            d.date = Number(new Date(d.date).getTime());
            if (d.value < 0) {
                d.value = -d.value;
            }
        });
        return sData;
    }

    var orderData = orderData3(data.data);

    setScales(orderData);
    drawChart(orderData);

});

function largestTriangleThreeBucket(data, threshold, xProperty, yProperty) {

    yProperty = yProperty || 0;
    xProperty = xProperty || 1;

    var m = Math.floor,
        y = Math.abs,
        f = data.length;

    if (threshold >= f || 0 === threshold) {
        return data;
    }

    var n = [],
        t = 0,
        p = (f - 2) / (threshold - 2),
        c = 0,
        v,
        u,
        w;

    n[t++] = data[c];

    for (var e = 0; e < threshold - 2; e++) {
        for (var g = 0,
            h = 0,
            a = m((e + 1) * p) + 1,
            d = m((e + 2) * p) + 1,
            d = d < f ? d : f,
            k = d - a; a < d; a++) {
            g += +data[a][xProperty], h += +data[a][yProperty];
        }

        for (var g = g / k,
            h = h / k,
            a = m((e + 0) * p) + 1,
            d = m((e + 1) * p) + 1,
            k = +data[c][xProperty],
            x = +data[c][yProperty],
            c = -1; a < d; a++) {
            "undefined" != typeof data[a] &&
                (u = .5 * y((k - g) * (data[a][yProperty] - x) - (k - data[a][xProperty]) * (h - x)),
                    u > c && (c = u, v = data[a], w = a));
        }

        n[t++] = v;
        c = w;
    }

    n[t++] = data[f - 1];

    return n;
};

function setScales(data) {
    var dataSet = largestTriangleThreeBucket(data, svg2_width / 2, "date", "value");

    var start_date = dataSet[0].date;
    var end_date = dataSet[dataSet.length - 1].date;

    xScale = d3.scaleTime().domain(d3.extent([start_date, end_date])).range([0, svg2_width]);
    xScale2 = d3.scaleTime().domain(xScale.domain()).range(xScale.range());

    yScale = d3.scaleLinear()
        .domain([0, d3.max(dataSet, function (d) {
            return d.value;
        })])
        .range([svg2_height, 0]).nice();

    y2 = d3.scaleLinear()
        .domain([0, d3.max(dataSet, function (d) {
            return d.value;
        })])
        .range([svg2_height2, 0]);

}


function drawChart(data) {
    var dataSet = largestTriangleThreeBucket(data, svg2_width / 2, "date", "value");

    var xAxis = d3.axisBottom(xScale),
        xAxis2 = d3.axisBottom(xScale2),

        yAxis = d3.axisLeft(yScale);

    var brush = d3.brushX()
        .extent([[0, 0], [svg2_width, 70]])
        .on("brush end", brushed);

    var zoom = d3.zoom()
        .scaleExtent([1, 50])
        .translateExtent([[0, 0], [svg2_width, svg2_height]])
        .extent([[0, 0], [svg2_width, svg2_height]])
        .on("zoom", zoomed);


    // ON svg
    var svg = d3.select('.seg2_chart')
        .attr("width", svg2_width + 200)
        .attr("transform", function (d, i) {
            return "translate(100, 0)";
        })
        .call(zoom);

    svg.append("text")
        .attr("class", "log")
        .attr("dx", 12)
        .attr("dy", 12)
        .text("data:" + data.length + " downsampled:" + 0);

    var chartArea = svg.append("g");

    chartArea.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("class", "zoom")
        .attr("width", svg2_width)
        .attr("height", svg2_height + svg2_margin.bottom);

    var chart = chartArea.append("g")
        .attr("class", "chart")
        .attr("width", svg2_width)
        .attr("height", svg2_height)
        .attr("transform", "translate(" + svg2_margin.left + "," + svg2_margin.top + ")")
        .attr("clip-path", "url(#clip)");

    var axis = chartArea.append("g")
        .attr("width", svg2_width)
        .attr("height", svg2_height)
        .attr("transform", "translate(" + svg2_margin.left + "," + svg2_margin.top + ")");

    //
    var bChart = chartArea.append("g")
        .attr("class", "BChart")
        .attr("width", svg2_width)
        .attr("height", svg2_height2)
        .attr("transform", "translate(" + svg2_margin.left + ", 530)")
        .attr("clip-path", "url(#clip)")
        .append('g');

    var axis2 = chartArea.append("g")
        .attr("class", "axis2")
        .attr("width", svg2_width + 10)
        .attr("height", svg2_height2)
        .attr("transform", "translate(" + svg2_margin.left + ",530)")
        .attr("clip-path", "url(#clip)")
        .append("g");

    var getDate = d3.timeFormat("%Y-%m-%d %H:%M");


    // set tool tip
    var tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10, 0])
        .html(function (d) {
            return "Date: <span style=\"color:yellow\">" + getDate(d.date) +
                "</span><br>Amount of Electricity Used: " +
                "<span style=\"color:yellow\">" + d.value + "</span>"; //+
            // "<br>Contract Demand: <span style=\"color:yellow\">" +
            // d3.format(".0%")(d.contact_demand) + "</span>";
        });

    chartArea.call(tip);


    // zoom function
    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type == "brush") return;
        var t = d3.event.transform;
        xScale.domain(t.rescaleX(xScale2).domain());

        axis.select(".axis-x").call(xAxis);
        //axis2.select(".axis-x").call(xAxis2);

        chart.selectAll(".barChart")
            .attr("transform", function () {
                return "translate(" + d3.event.transform.x + ", 0) scale(" + d3.event.transform.k + ", 1)"
            })

        axis2.select(".brush").call(brush.move, xScale.range().map(t.invertX, t));
    }

    // brush function
    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;
        var s = d3.event.selection || xScale2.range();
        xScale.domain(s.map(xScale2.invert, xScale2));

        axis.select(".axis-x").call(xAxis);

        var position = svg2_width / (s[1] - s[0]) * s[0];

        chart.selectAll(".barChart")
            .attr("transform", function () {
                return "translate(" + -position + ", 0) scale(" + svg2_width / (s[1] - s[0]) + ", 1)"
            });

        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(svg2_width / (s[1] - s[0]))
            .translate(-s[0], 0));

        //area brush 연동.
        var svgarea = d3.select('.areaChart');

        svgarea.select(".axis--x").call(xAxis); //x축 넘어감
        svgarea.selectAll(".area").attr("transform", function () {
            return "translate(" + -position + ", 0) scale(" + svg2_width / (s[1] - s[0]) + ", 1)"
        }); //area넘어감
        svgarea.selectAll(".focus").attr("transform", function () {
            return "translate(" + -position + ", 0) scale(" + svg2_width / (s[1] - s[0]) + ", 1)"
        }); //tooltip 넘어감

        /*svgarea.select(".zoom").call(zoom.transform, d3.zoomIdentity
        .scale(svg2_width / (s[1] - s[0]))
        .translate(-s[0], 0));*/
        //area data 재등록.(data불일치)

    }

    chart.selectAll("rect")
        .data(dataSet).enter()
        .append("rect")
        .attr("class", "barChart")
        .attr("opacity", "0.6")
        .attr("x", function (d, i, da) { return (xScale(d.date) - (svg2_width / da.length) * 0.5); })
        .attr("y", function (d, i) {
            return yScale(d.value);
        })
        .attr("width", function (d, i, da) {
            return (svg2_width / da.length);
        })
        .attr("height", function (d) {
            return svg2_height - yScale(d.value);
        })
        .attr("clip-path", "url(#clip)")
        .on("mouseover", function (d) {
            tip.show(d);
            d3.select(this)
                .attr("opacity", "0.9");
        })
        .on("mouseout", function () {
            tip.hide();
            d3.select(this)
                .transition()
                .duration(500)
                .attr("opacity", "0.6");
        })
        .on("mousemove", function (d) {
            tip.attr("x", function () {
                return d3.event.offsetX;
            })
                .attr("y", function () {
                    return d3.event.offsetY;
                })
        });

    //brush chart
    bChart.selectAll("rect")
        .data(dataSet).enter()
        .append("rect")
        .attr("class", "brushChart")
        .attr("opacity", "0.6")
        .attr("x", function (d, i, da) { return (xScale(d.date) - (svg2_width / da.length) * 0.5); })
        .attr("y", function (d, i) {
            return y2(d.value);
        })
        .attr("width", function (d, i, da) {
            return (svg2_width / da.length);
        })
        .attr("height", function (d) {
            return svg2_height2 - y2(d.value);
        })
        .attr("fill", " rgb(254, 164, 102)")
        .attr("clip-path", "url(#clip)");

    // set axis
    axis.append("g")
        .attr("class", "axis-x")
        .attr("transform", "translate(0," + svg2_height + ")")
        .call(xAxis);

    axis.append("g")
        .attr("class", "axis-y")
        .call(yAxis)
        .append("text")
        .text("Amount of Electricity Used")
        .attr("transform", "translate(10,123) rotate(90)")
        .attr('fill', 'black');

    axis2.append("g")
        .attr("class", "axis axis-x")
        .attr("transform", "translate(0 , 70)")
        .call(xAxis2);

    axis2.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, xScale.range());

        d3.select(".log").text("data:" + data.length + " downsampled:" + dataSet.length);
        
}