var format = d3.timeFormat("%Y-%m-%d %H:%M");

var areaSvg = d3.select(".areaChart"),
    area_margin = { top: 20, right: 300, bottom: 30, left: 58 },
    area_margin2 = { top: 50, right: 40, bottom: 60, left: 70 },
    area_width = +areaSvg.attr("width") - area_margin2.left - area_margin2.right - 100,
    area_height = +areaSvg.attr("height");

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
    var sData = sortByData(data.data);

    sData.forEach(function (d, i, da) {
        d.date = new Date(d.date);
    });

    sData = largestTriangleThreeBucket(sData, area_width / 2, "date", data.depart[0]);
    
    areaSvg.append("defs").append("clipPath")
        .attr("id", "clip2")
        .append("rect")
        .attr("width", area_width)
        .attr("height", area_height);
    //.attr("transform", "translate(-100,0)");

    var area_chart = areaSvg.append("g")
        .attr("class", "areachart")
        .attr("width", area_width)
        .attr("height", area_height)
        .attr("transform", "translate(" + area_margin.left + ",0)");

    var area_axis = areaSvg.append("g")
        .attr("width", area_width)
        .attr("height", area_height)
        .attr("transform", "translate(" + area_margin.left + ",0)");


    var x_min = d3.min(sData, function (d) { return d.date; });
    var x_max = d3.max(sData, function (d) { return d.date; });

    var newD = new Date(x_min.getYear() + 1900, x_min.getMonth(), 1);

    var series = d3.stack()
        .keys(data.depart)
        //.order(d3.stackOrderDescending)
        .offset(d3.stackOffsetNone)
        (sData);

    var x = d3.scaleTime()
        .range([0, area_width])
        .domain([x_min, x_max]);

    /*
     var x = d3.scaleBand()
        .domain(data.data.map(function (d) { return d.date; }))
        .rangeRound([area_margin.left, area_width - area_margin.right])
        .padding(0.1);
    */
    var y = d3.scaleLinear()
        .domain([100, d3.max(series, stackMax)])
        .range([area_height - area_margin.bottom, 10]).nice();

    var z = d3.scaleOrdinal(d3.schemeCategory10);

    var area = d3.area()
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

    area_chart.append("g")
        .selectAll("g")
        .data(series)
        .enter().append("g")
        .attr("fill", function (d) { return z(d.key); })
        .append('path')
        .attr('class', "area")
        .attr('d', area)
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

        }).on("mousemove", mousemove);

    function mousemove(d) {
        var key = d.key;

        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(sData, x0, 1),
            d0 = sData[i - 1],
            d1 = sData[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        focus.attr("transform", "translate(" + x(d.date) + "," + y(sum(d, key)) + ")");
        focus.select(".x").attr("y2", area_height - y(sum(d, key)) - 25);

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

    var xAxis = d3.axisBottom(x);
    /*.tickFormat(format)
    .ticks(d3.timeMonth);*/

    var yAxis = d3.axisLeft(y);

    area_axis.append("g")
        .attr("class", "axis--x")
        .attr("transform", "translate(0," + y(0) + ")")
        .call(xAxis);
    /*
        areaSvg.append("g")
            .attr("class","axis--x")
            .attr("transform", "translate(0," + y(0) + ")")
            .call(xAxis);
    */
    area_axis.append("g")
        //.attr("transform", "translate(58,0)")
        .call(yAxis);

    function stackMin(serie) {
        return d3.min(serie, function (d) { return d[0]; });
    }

    function stackMax(serie) {
        return d3.max(serie, function (d) { return d[1]; });
    }

    //toopltip 추가
    var focus = areaSvg.append("g")
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

    //legend 추가
    var legendRectSize = 20;
    var legendSpacing = 1;
    var legendHeight = legendRectSize + legendSpacing;

    var legend = areaSvg.append('g')
        .selectAll('.legend')
        .data(series).enter().append('g')
        .attr("class", 'legend')
        .attr('id', function (d) { return d.key; })
        .attr("transform", function (d, i) {
            return 'translate(' + (area_width + 80) + ',' + (((i + 15) * legendHeight) + (-45 * i)) + ')';
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

function sortByData(data) {

    var sData = data.sort(function (x, y) {
        return d3.ascending(x.date, y.date);
    })

    return sData;
}
