
var area_svg = d3.select(".areaChart");
var area_svg2 = d3.select(".seg2_chart");

var area_margin = { top: 20, right: 250, bottom: 30, left: 40 };
var area_margin2 = { top: 10, right: 250, bottom: 390, left: 40 }
var area_width = +area_svg.attr("width") - area_margin.left - area_margin.right;
var area_height = +area_svg.attr("height") - area_margin.top - area_margin.bottom;
var area_height2 = +area_svg2.attr("height") - area_margin2.top - area_margin2.bottom;

var format = d3.timeFormat("%Y-%m-%d %H:%M");

var svg2_margin = { top: 120, right: 250, bottom: 50, left: 40 },
    svg2_height = +area_svg2.attr("height") - svg2_margin.top - svg2_margin.bottom;

var bisectDate = d3.bisector(function (d) {
    return d.date;
}).left;

var area_color = ["#90A5C1", "#EFA561", "#B8B19E", "#748F63", "#F0DFA7",
    "#C3F09A", "#D56365", "#B1D5C3", "#8F6B84", "#F59F8E"];

var companyName = document.getElementById("userCompany").innerHTML;
if (companyName.indexOf("(주)") != -1)
    companyName = companyName.replace("(주)", "")

function largestTriangleThreeBucket(data, threshold, xProperty) {

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
            g += +data[a][xProperty];
        }

        for (var g = g / k,
            h = h / k,
            a = m((e + 0) * p) + 1,
            d = m((e + 1) * p) + 1,
            k = +data[c][xProperty],
            c = -1; a < d; a++) {
            "undefined" != typeof data[a] &&
                (u = .5 * y((k - g) * (k - data[a][xProperty])),
                    u > c && (c = u, v = data[a], w = a));
        }

        n[t++] = v;
        c = w;
    }

    n[t++] = data[f - 1];

    return n;
};

d3.json('/segData/area/company=' + companyName, function (error, data) {
    d3.json('/seg2Data/seg2/company=' + companyName, function (error, data2) {

        area_svg.attr("width", area_width + 300);

        //area data
        var AreaData = sortByData(data.data);

        AreaData.forEach(e => {
            e.date = Number(new Date(e.date).getTime());
        });

        var sData = largestTriangleThreeBucket(AreaData, area_width / 3, "date");

        data.depart.sort(function (a, b) {
            return b.localeCompare(a);
        })

        var series = d3.stack()
            .keys(data.depart)
            //.order(d3.stackOrderDescending)
            .offset(d3.stackOffsetNone)
            (sData);

        series.sort(function (a, b) {
            return a.key.localeCompare(b.key);
        });

        var startD = d3.min(sData, function (d) { return d.date; });//시작시간
        var lastD = d3.max(sData, function (d) { return d.date; });//끝시간

        var zoom = d3.zoom()
            .scaleExtent([1, Infinity])
            .translateExtent([[0, 0], [area_width, area_height]])
            .extent([[0, 0], [area_width, area_height]])
        //.on("zoom", zoomed);

        var detail = area_svg.append('g')
            .attr("transform", "translate(" + area_margin.left + "," + area_margin.top + ")");

        //부서별 전력사용 text
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

        var y3 = d3.scaleLinear()
            .range([area_height2, 0])
            .domain(y.domain());

        var z = d3.scaleOrdinal(d3.schemeCategory10);

        var area_detail = d3.area()
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

        // 축 그리기
        var xAxis = d3.axisBottom(x);
        var xAxis2 = d3.axisBottom(x2);
        var yAxis = d3.axisLeft(y);

        //x축
        detail.append("g")
            .attr("class", "axis--x")
            .attr("transform", "translate(0," + area_height + ")")
            .call(xAxis);

        //y축
        detail.append("g")
            .attr("class", "axis--y")
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

        //area그리기
        detail.append("g")
            .selectAll("g")
            .data(series)
            .enter().append("g")
            .attr("fill", function (d, i) { return area_color[i]; })
            .append('path')
            .attr('class', "area")
            .attr("clip-path", "url(#clip)")
            .attr("d", area_detail)
            .on("mouseover", function (d) {

                d3.select(this)
                    .style("stroke-width", '6px');

                var selectthegraphs = $('.area').not(this);     //나머지 area opercity 낮춤.
                d3.selectAll(selectthegraphs)
                    .style("opacity", 0.2);

                var getname = document.getElementById(d.key);
                var selectlegend = $('.legend').not(getname);    //나머지 legend opercity 낮춤.

                d3.selectAll(selectlegend)
                    .style("opacity", 0.2);

                d3.select(getname)
                    .attr("class", "legend-select");

                focus.style("display", null);
                tooltip.style("visibility", "visible");

            }).on("mouseout", function (d) {
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

        //brush bar
        var orderData = sortByData(data2.data);

        orderData.forEach(d => {
            d.date = Number(new Date(d.date).getTime());
            d.depart = d.depart;
            d.value = Number(d.value);
            if (d.value < 0) {
                d.value = -d.value;
            }
        });

        //회사전체 전력사용량 총 합계
        var sumValue = d3.nest()
            .key(function (d) { return d.date; })
            .rollup(function (v) { return d3.sum(v, function (d) { return d.value; }); })
            .entries(orderData);

        var dataSet = largestTriangleThreeBucket(sumValue, area_width / 3, "key");

        var yScale = d3.scaleLinear()
            .domain([0, d3.max(dataSet, function (d) {
                return d.value;
            })])
            .range([svg2_height, 0]).nice();

        //brush bar
        overview.append('g')
            .selectAll(".rect")
            .data(dataSet).enter()
            .append("rect")
            .attr("class", "brushChart")
            .attr("opacity", "0.6")
            .attr("x", function (d, i, da) { return (x2(d.key) - (area_width / da.length) * 0.5); })
            .attr("y", function (d, i) {
                return y3(d.value);
            })
            .attr("width", function (d, i, da) {
                return (area_width / da.length);
            })
            .attr("height", function (d) {
                return area_height2 - y3(d.value);
            })
            .attr("fill", " rgb(239,165,97)")

        function sum(d, key) {
            var sumd = 0;

            data.depart.sort(function (a, b) {
                return a.localeCompare(b);
            })

            for (var i = data.depart.length - 1; i >= 0; i--) {
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

            data.depart.sort(function (a, b) {
                return a.localeCompare(b);
            })

            for (var i = 0; i < data.depart.length; i++) {
                if (d[data.depart[i]] > 0) {
                    if (key == data.depart[i]) {
                        text += "<font color=" + area_color[i] + ">" + data.depart[i] + "=" + d[data.depart[i]] + "</font></br>";
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

        //brush작동
        function brushed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type == "zoom") return;
            var s = d3.event.selection || x2.range();

            x.domain(s.map(x2.invert)); //x2.invert: 치역의 값을 받았을 때 정의역의 값을 반환

            var date = [];
            AreaData.forEach(e => {
                if ((x.domain()[0] < e.date) && (x.domain()[1] > e.date)) {
                    e.date = Number(new Date(e.date).getTime());
                    date.push(e);
                }
            });


            var date2 = [];
            sumValue.forEach(d => {
                if ((x.domain()[0] < d.key) && (x.domain()[1] > d.key)) {
                    date2.push(d);
                }
            });

            //차트 새로 그리기
            resize(date);
            resize2(date2);

            detail.select(".axis--x").call(xAxis);
            area_svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
                .scale(area_width / (s[1] - s[0])).translate(-s[0], 0));

            //bar chart brush
            area_svg2.select(".axis-x").call(xAxis);
            area_svg2.select(".zoom").call(zoom.transform, d3.zoomIdentity
                .scale(area_width / (s[1] - s[0]))
                .translate(-s[0], 0));
        }

        //area다시 그리기
        function resize(date) {

            var reData = largestTriangleThreeBucket(date, area_width / 3, "date");

            data.depart.sort(function (a, b) {
                return b.localeCompare(a);
            })

            var series2 = d3.stack()
                .keys(data.depart)
                //.order(d3.stackOrderDescending)
                .offset(d3.stackOffsetNone)
                (reData);

            series2.sort(function (a, b) {
                return a.key.localeCompare(b.key);
            });


            //y축 갱신
            y.domain([0, d3.max(series2, stackMax)]).nice();
            detail.select(".axis--y").call(yAxis);

            detail.selectAll(".area")
                .remove().exit()
                .data(series2)
                .enter().append("g")
                .attr("fill", function (d, i) { return area_color[i]; })
                .append('path')
                .attr('class', "area")
                .attr("clip-path", "url(#clip)")
                .attr("d", area_detail)
                .on("mouseover", function (d) {

                    d3.select(this)
                        .style("stroke-width", '6px');

                    var selectthegraphs = $('.area').not(this);     //나머지 area opercity 낮춤.
                    d3.selectAll(selectthegraphs)
                        .style("opacity", 0.2);

                    var getname = document.getElementById(d.key);
                    var selectlegend = $('.legend').not(getname);    //나머지 legend opercity 낮춤.

                    d3.selectAll(selectlegend)
                        .style("opacity", 0.2);

                    d3.select(getname)
                        .attr("class", "legend-select");

                    focus.style("display", null);
                    tooltip.style("visibility", "visible");

                }).on("mouseout", function (d) {
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

            function mousemove(d) {
                var key = d.key;

                var x0 = x.invert(d3.mouse(this)[0]),
                    i = bisectDate(reData, x0, 1),
                    d0 = reData[i - 1],
                    d1 = reData[i],
                    d = x0 - d0.date > d1.date - x0 ? d1 : d0;

                focus.attr("transform", "translate(" + (x(d.date) + 40) + "," + (y(sum(d, key)) + 22) + ")");
                focus.select(".x").attr("y2", area_height - y(sum(d, key)) + 5);

                //tooltip.style("top", (y(sum(d, key)) + 1100) + "px").style("left", x(d.date) + "px");
                tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                tooltip.html("Date: " + format(d.date) + "<hr>" + text(d, key));

            }

        }

        //bar다시 그리기
        function resize2(data) {

            var dataSet = largestTriangleThreeBucket(data, area_width / 3, "key");

            var tip = d3.tip()
                .attr("class", "d3-tip")
                .offset([-10, 0])
                .html(function (d) {
                    return "Date: <span style=\"color:yellow\">" + format(d.key) +
                        "</span><br>Amount of Electricity Used: " +
                        "<span style=\"color:yellow\">" + d.value + "</span>";
                });


            area_svg2.select(".axis-y").call(yAxis);

            var chart = area_svg2.select('.chart').call(tip);

            //y축 갱신
            yScale = d3.scaleLinear()
                .domain([0, d3.max(dataSet, function (d) {
                    return d.value;
                })])
                .range([svg2_height, 0]).nice();

            chart.selectAll(".barChart")
                .remove().exit()
                .data(dataSet).enter()
                .append("rect")
                .attr("class", "barChart")
                .attr("opacity", "0.6")
                .style("fill", function (d, i, da) {
                    if (d.value == d3.max(dataSet, function (d) { return d.value; })) {
                        return "#C33325";
                    }
                })
                .attr("x", function (d, i, da) { return (x(d.key) - ((area_width / da.length) - 0.5) * 0.5); })
                .attr("y", function (d, i) {
                    return yScale(d.value);
                })
                .attr("width", function (d, i, da) {
                    return (area_width / da.length) - 0.5;
                })
                .attr("height", function (d) {
                    return svg2_height - yScale(d.value);
                })
                .attr("clip-path", "url(#clip2)")
                .on("mouseover", function (d) {
                    tip.show(d);
                    d3.select(this)
                        .attr("opacity", "0.9");
                    if (d.value == d3.max(dataSet, function (d) { return d.value; })) {
                        tooltip2.style("visibility", "visible");
                        tooltip2.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                        Peak(d.key);
                    }
                })
                .on("mouseout", function () {
                    tip.hide();
                    d3.select(this)
                        .transition()
                        .duration(500)
                        .attr("opacity", "0.6");

                    tooltip2.style("visibility", "hidden");
                })
                .on("mousemove", function (d) {
                    tip.attr("x", function () {
                        return d3.event.offsetX;
                    })
                        .attr("y", function () {
                            return d3.event.offsetY;
                        })
                });

        }

        //피크전력 tool
        var tooltip2 = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("padding", "8px")
            .style("background-color", "rgba(255, 255, 255, 0.75)")
            .style("border-radius", "6px")
            .style("font", "12px sans-serif");

        tooltip2.append("svg")
            .style("width", 300 + "px")
            .style("height", 300 + "px")
            .attr("width", 300)
            .attr("height", 300)
            .append("g")
            .attr("class", "peak")

        function Peak(date) {
            d3.select(".peak").select("*").remove();

            var peak = [];

            orderData.forEach(d => {
                if (d.date == date) {
                    peak.push(d);
                }
            });

            peak.sort(function (a, b) {
                return a.depart.localeCompare(b.depart);
            });

            var peakY = d3.scaleBand()
                .range([250, 0])
                .domain(peak.map(function (d) { return d.depart; }))
                .padding(0.1);

            var peakX = d3.scaleLinear()
                .range([0, 250])
                .domain([0, d3.max(peak, function (d) { return d.value; })]).nice();

            var g = d3.select(".peak")
                .append("g")
                .attr("transform",
                    "translate(50,10)");

            g.selectAll(".pbar")
                .data(peak)
                .enter().append("rect")
                .attr("class", "pbar")
                .attr("x", 0)
                .attr("y", function (d) { return peakY(d.depart); })
                .attr("width", function (d) { return peakX(d.value); })
                .attr("height", peakY.bandwidth())
                .style("fill", function (d, i) { return area_color[i]; })

            g.selectAll(".peakText")
                .data(peak)
                .enter().append("text")
                .attr("class", "peakText")

                .attr("y", function (d) {
                    return peakY(d.depart) + peakY.bandwidth() / 2 + 4;
                })
                .attr("x", function (d) {
                    return peakX(d.value) + 4;
                })
                .text(function (d) {
                    return d.value;
                });

            g.append("g")
                .call(d3.axisLeft(peakY));
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
                return 'translate(' + (area_width + 60) + ',' + (((i + 8) * legendHeight) + (3 * i)) + ')';
            });

        legend.append('rect')
            .attr("width", legendRectSize).attr("height", legendHeight)
            .attr("rx", 20).attr("ry", 20)
            .style("fill", function (d, i) { return area_color[i]; });

        legend.append('text')
            .attr("class", "areaTx")
            .attr("x", 30).attr("y", 15)
            .text(function (d) { return d.key; })
            .style("fill", 'black').style("font_size", '14px');
    });
});

function stackMax(serie) {
    return d3.max(serie, function (d) { return d[1]; });
}

function sortByData(data) {

    var sData = data.sort(function (x, y) {
        return d3.ascending(x.date, y.date);
    });

    return sData;
}
