
var area_svg = d3.select(".areaChart");
var area_svg2 = d3.select(".seg2_chart");

var area_margin = { top: 20, right: 250, bottom: 30, left: 40 };
var area_margin2 = { top: 10, right: 250, bottom: 390, left: 40 }
var area_width = +area_svg.attr("width") - area_margin.left - area_margin.right;
var area_height = +area_svg.attr("height") - area_margin.top - area_margin.bottom;
var area_height2 = +area_svg2.attr("height") - area_margin2.top - area_margin2.bottom;

var format = d3.timeFormat("%Y-%m-%d %H:%M");

var bisectDate = d3.bisector(function (d) {
    return d.date;
}).left;

var companyName = document.getElementById("userCompany").innerHTML;
if (companyName.indexOf("(주)") != -1)
    companyName = companyName.replace("(주)", "")

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

d3.json('/segData/area/company=' + companyName, function (error, data) {

    area_svg.attr("width", area_width + 300);

    //data
    var Data = sortByData(data.data);

    Data.forEach(e => {
        e.date = Number(new Date(e.date).getTime());
    });

    var sData = largestTriangleThreeBucket(Data, area_width / 2, "date", data.depart[0]);

    var series = d3.stack()
        .keys(data.depart)
        //.order(d3.stackOrderDescending)
        .offset(d3.stackOffsetNone)
        (sData);

    var startD = d3.min(sData, function (d) { return d.date; });
    var lastD = d3.max(sData, function (d) { return d.date; });

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [area_width, area_height]])
        .extent([[0, 0], [area_width, area_height]])
    //.on("zoom", zoomed);

    var detail = area_svg.append('g')
        .attr("transform", "translate(" + area_margin.left + "," + area_margin.top + ")");

    var infotext = detail.append("g")
        .append("text")
        .attr("class", "information")
        .attr("dx", 12)
        .attr("dy", 12)
        .attr("transform", "translate(" + (area_margin2.left - 40) + "," + (area_margin2.top - 30) + ")")
        .text("<부서별 전력사용량>")
        .style("fill", "#9A9A9A");

    var overview = area_svg2.append('g')
        .attr("transform", "translate(" + area_margin2.left + "," + area_margin2.top + ")");

    var x = d3.scaleTime()
        .range([0, area_width])
        .domain([startD, lastD]);

    var x2 = d3.scaleTime()
        .range(x.range())
        .domain(x.domain());

    var y = d3.scaleLinear()
        .range([area_height, 0])
        .domain([0, d3.max(series, stackMax)]).nice();

    var y2 = d3.scaleLinear()
        .range([area_height2, 0])
        .domain(y.domain());

    var z = d3.scaleOrdinal(d3.schemeCategory10);

    var area_detail = d3.area()
        //.curve(d3.curveMonotoneX) //선 곡선모양
        .x(function (d) { return x(d.data.date); })
        .y0(function (d) {
            if (d[0] >= 0) { }
            else { d[0] = 0; }
            return y(d[0]);
        })
        .y1(function (d) {
            if (d[1] >= 0) { }
            else { d[1] = d[0]; }
            return y(d[1]);
        });

    var area_overview = d3.area()
        //.curve(d3.curveMonotoneX) //선 곡선모양
        .x(function (d) { return x2(d.data.date); })
        .y0(function (d) {
            if (d[0] >= 0) { }
            else { d[0] = 0; }
            return y2(d[0]);
        })
        .y1(function (d) {
            if (d[1] >= 0) { }
            else { d[1] = d[0]; }
            return y2(d[1]);
        });

    // 축 그리기
    var xAxis = d3.axisBottom(x);
    var xAxis2 = d3.axisBottom(x2);
    var yAxis = d3.axisLeft(y);

    detail.append("g")
        .attr("class", "axis--x")
        .attr("transform", "translate(0," + area_height + ")")
        .call(xAxis);

    detail.append("g")
        .call(yAxis)
        .append("text")
        .text("Amount of Electricity Used")
        .attr("transform", "translate(10,123) rotate(90)")
        .attr('fill', 'black');

    overview.append("g")
        .attr("transform", "translate(0," + area_height2 + ")")
        .call(xAxis2);

    area_svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("class", "zoom")
        .attr("width", area_width)
        .attr("height", area_height);

    detail.append("g")
        .selectAll("g")
        .data(series)
        .enter().append("g")
        .attr("fill", function (d) { return z(d.key); })
        .append('path')
        .attr('class', "area")
        .attr("clip-path", "url(#clip)")
        .attr("d", area_detail)
        .on("mouseover", function (d) {

            d3.select(this)                          //on mouseover of each line, give it a nice thick stroke
                .style("stroke-width", '6px');

            var selectthegraphs = $('.area').not(this);     //select all the rest of the lines, except the one you are hovering on and drop their opacity
            d3.selectAll(selectthegraphs)
                .style("opacity", 0.2);

            var getname = document.getElementById(d.key);   //use get element cause the ID names have spaces in them
            var selectlegend = $('.legend').not(getname);    //grab all the legend items that match the line you are on, except the one you are hovering on

            d3.selectAll(selectlegend)    // drop opacity on other legend names
                .style("opacity", 0.2);

            d3.select(getname)
                .attr("class", "legend-select");  //change the class on the legend name that corresponds to hovered line to be bolder    

            focus.style("display", null);
            tooltip.style("visibility", "visible");

        }).on("mouseout", function (d) {        //undo everything on the mouseout
            d3.select(this)
                .style("stroke-width", '2.5px');

            var selectthegraphs = $('.area').not(this);
            d3.selectAll(selectthegraphs)
                .style("opacity", 1);

            var getname = document.getElementById(d.key);
            var getname2 = $('.legend[fakeclass="fakelegend"]')
            var selectlegend = $('.legend').not(getname2).not(getname);

            d3.selectAll(selectlegend)
                .style("opacity", 1);

            d3.select(getname)
                .attr("class", "legend");

            focus.style("display", "none");
            tooltip.style("visibility", "hidden");

        })
        .on("mousemove", mousemove)
        .call(zoom);

    /*overview.append("g")
        .selectAll("g")
        .data(series)
        .enter().append("g")
        .attr("fill", function (d) { return z(d.key); })
        .append('path')
        .attr("d", area_overview)*/

    d3.json('/seg2Data/seg2/company=' + companyName, function (error, data) {

        var orderData = sortByData(data.data);

        orderData.forEach(d => {
            d.date = Number(new Date(d.date).getTime());
            if (d.value < 0) {
                d.value = -d.value;
            }
        });

        var dataSet = largestTriangleThreeBucket(orderData, area_width / 2, "date", "value");

        var y3 = d3.scaleLinear()
            .domain([0, d3.max(dataSet, function (d) {
                return d.value;
            })])
            .range([area_height2, 0]);

        overview.append('g')
            .selectAll(".rect")
            .data(dataSet).enter()
            .append("rect")
            .attr("class", "brushChart")
            .attr("opacity", "0.6")
            .attr("x", function (d, i, da) { return (x2(d.date) - (area_width / da.length) * 0.5); })
            .attr("y", function (d, i) {
                return y3(d.value);
            })
            .attr("width", function (d, i, da) {
                return (area_width / da.length);
            })
            .attr("height", function (d) {
                return area_height2 - y3(d.value);
            })
            .attr("fill", " rgb(254, 164, 102)")
    });


    function mousemove(d) {
        var key = d.key;

        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(sData, x0, 1),
            d0 = sData[i - 1],
            d1 = sData[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        focus.attr("transform", "translate(" + (x(d.date) + 40) + "," + (y(sum(d, key)) + 22) + ")");
        focus.select(".x").attr("y2", area_height - y(sum(d, key)) + 5);

        //tooltip.style("top", (y(sum(d, key)) + 1100) + "px").style("left", x(d.date) + "px");
        tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        tooltip.html("Date: " + format(d.date) + "<hr>" + text(d, key));

    }

    function sum(d, key) {
        var sumd = 0;
        for (var i = 0; i < data.depart.length; i++) {
            if (d[data.depart[i]] > 0) {
                if (key == data.depart[i]) {
                    sumd += d[data.depart[i]];
                    return sumd;
                }
                sumd += d[data.depart[i]];
            }
        }
        return sumd;
    }

    function text(d, key) {
        var text = "";
        var sum = 0;
        for (var i = data.depart.length - 1; i >= 0; i--) {
            if (d[data.depart[i]] > 0) {
                if (key == data.depart[i]) {
                    text += "<font color=" + z(key) + ">" + data.depart[i] + "=" + d[data.depart[i]] + "</font></br>";
                }
                else {
                    text += data.depart[i] + "=" + d[data.depart[i]] + "</br>";
                }

                sum += d[data.depart[i]];
            }
        }

        text += "<hr><b>Total=" + sum + "</b>";
        return text;
    }

    var brush = d3.brushX()
        .extent([[0, 0], [area_width, area_height2]])
        .on("brush end", brushed);

    overview.append('g')
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, x.range());


    //toopltip 추가
    var focus = area_svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("circle")
        .attr("r", 5);

    focus.append("line")
        .attr("class", "x")
        .style("stroke", "black")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 1)
        .attr("y1", 0)
        .attr("y2", area_height);

    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("color", "white")
        .style("padding", "8px")
        .style("background-color", "rgba(0, 0, 0, 0.75)")
        .style("border-radius", "6px")
        .style("font", "12px sans-serif")
        .text("tooltip");

    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type == "zoom") return;
        var s = d3.event.selection || x2.range();

        x.domain(s.map(x2.invert)); //x2.invert: 치역의 값을 받았을 때 정의역의 값을 반환
        detail.selectAll(".area").attr("d", area_detail);
        detail.select(".axis--x").call(xAxis);
        area_svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(area_width / (s[1] - s[0])).translate(-s[0], 0));

        area_svg2.select(".axis-x").call(xAxis);

        var position = area_width / (s[1] - s[0]) * s[0];

        area_svg2.selectAll(".barChart")
            .attr("transform", function () {
                return "translate(" + -position + ", 0) scale(" + area_width / (s[1] - s[0]) + ", 1)"
            });

        area_svg2.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(area_width / (s[1] - s[0]))
            .translate(-s[0], 0));
    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type == "zoom") return;
        var t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        detail.selectAll(".area").attr("d", area_detail);
        detail.select(".axis--x").call(xAxis);
        overview.select(".brush").call(brush.move, x.range().map(t.invertX, t));

    }

    //legend 추가
    var legendRectSize = 20;
    var legendSpacing = 1;
    var legendHeight = legendRectSize + legendSpacing;

    var legend = area_svg.append('g')
        .selectAll('.legend')
        .data(series).enter().append('g')
        .attr("class", 'legend')
        .attr('id', function (d) { return d.key; })
        .attr("transform", function (d, i) {
            return 'translate(' + (area_width + 60) + ',' + (((i + 13) * legendHeight) + (-45 * i)) + ')';
        });

    legend.append('rect')
        .attr("width", legendRectSize).attr("height", legendHeight)
        .attr("rx", 20).attr("ry", 20)
        .style("fill", function (d) { return z(d.key); });

    legend.append('text')
        .attr("class", "areaTx")
        .attr("x", 30).attr("y", 15)
        .text(function (d) { return d.key; })
        .style("fill", 'black').style("font_size", '14px');
});

function stackMax(serie) {
    return d3.max(serie, function (d) { return d[1]; });
}

function sortByData(data) {

    var sData = data.sort(function (x, y) {
        return d3.ascending(x.date, y.date);
    })

    return sData;
}
