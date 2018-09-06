var format = d3.timeFormat("%m/%Y");

var areaSvg = d3.select(".areaChart"),
    area_margin = { top: 20, right: 300, bottom: 30, left: 60 },
    area_width = +areaSvg.attr("width"),
    area_height = +areaSvg.attr("height");

var bisectDate = d3.bisector(function (d) {
    return d.date;
}).left;

var companyName = document.getElementById("userCompany").innerHTML;
if (companyName.indexOf("(주)") != -1)
    companyName = companyName.replace("(주)", "")

d3.json('/segData/area/company=' + companyName, function (error, data) {
    var sData = sortByData(data.data);

    sData.forEach(e => {
        e.date = new Date(e.date);
    });

    var x_min = d3.min(sData, function (d) { return d.date; });
    var x_max = d3.max(sData, function (d) { return d.date; });

    var newD = new Date(x_min.getYear() + 1900, x_min.getMonth(), 1);

    var series = d3.stack()
        .keys(data.depart)
        //.order(d3.stackOrderDescending)
        .offset(d3.stackOffsetNone)
        (sData);

    var x = d3.scaleTime()
        .range([area_margin.left, area_width - area_margin.right])
        .domain([newD, x_max]);

    /*
     var x = d3.scaleBand()
        .domain(data.data.map(function (d) { return d.date; }))
        .rangeRound([area_margin.left, area_width - area_margin.right])
        .padding(0.1);
    */
    var y = d3.scaleLinear()
        .domain([0, d3.max(series, stackMax)])
        .range([area_height - area_margin.bottom, area_margin.top]).nice();

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
    console.log(series)

    areaSvg.append("g")
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
        for (var i = 0; i < data.depart.length; i++) {
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

    var xAxis = d3.axisBottom(x)
        .tickFormat(format)
        .ticks(d3.timeMonth);

    var yAxis = d3.axisLeft(y);

    areaSvg.append("g")
        .attr("transform", "translate(0," + y(0) + ")")
        .call(xAxis);

    areaSvg.append("g")
        .attr("transform", "translate(" + area_margin.left + ",0)")
        .call(yAxis);

    function stackMin(serie) {
        return d3.min(serie, function (d) { return d[0]; });
    } //만약 값이 없을때??

    function stackMax(serie) {
        return d3.max(serie, function (d) { return d[1]; });
    }

    //toopltip 추가
    var focus = areaSvg.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("circle")
        .attr("r", 5);

    /*focus.append("line")
    .attr("class", "x")
    .style("stroke", "black")
    .style("stroke-dasharray", "3,3")
    .style("opacity", 1)
    .attr("y1", 0)
    .attr("y2", area_height);*/

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
            return 'translate(1530,' + (((i + 18) * legendHeight) + (-45 * i)) + ')';
        });

    legend.append('rect')
        .attr("width", legendRectSize).attr("height", legendHeight)
        .attr("rx", 20).attr("ry", 20)
        .style("fill", function (d) { return z(d.key); });

    legend.append('text')
        .attr("x", 30).attr("y", 15)
        .text(function (d) { return d.key; })
        .style("fill", 'black').style("font_size", '14px');


});

function sortByData(data) {

    var sData = data.sort(function (x, y) {
        return d3.descending(x.date, y.date);
    })
    sData = sData.slice(0, 12);

    sData = sData.sort(function (x, y) {
        return d3.ascending(x.date, y.date);
    })

    sData.forEach(e => {
        e.date = new Date(e.date);
        e.value = Number(e.value);
    });

    return sData;
}