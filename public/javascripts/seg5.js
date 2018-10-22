var svg5 = d3.select('.seg5_chart');
var svg5_margin = { top: 10, right: 200, bottom: 20, left: 60 };

var svg5_width = +svg5.attr("width") - svg5_margin.left - svg5_margin.right,
    svg5_height = +svg5.attr("height") - svg5_margin.top - svg5_margin.bottom;

var my_format = d3.timeFormat("%m/%Y"),
    Money_format = d3.format(",");

var bisectDate2 = d3.bisector(function (d) { return d.date; }).left;

var companyName = document.getElementById("userCompany").innerHTML;
if (companyName.indexOf("(주)") != -1)
    companyName = companyName.replace("(주)", "")

d3.json('/moneyData/money/company=' + companyName, function (error, data) {
    if (error) throw error;

    //data sort
    var sData = sortByData2(data.data);
    Line_chart(data.meta, sData);

});//json

function Line_chart(meta, sData) {

    var x_min = d3.min(sData, function (d) { return d.date; });
    var x_max = d3.max(sData, function (d) { return d.date; });

    var newD = new Date(x_min.getYear() + 1900, x_min.getMonth(), 1);

    var xScale = d3.scaleTime()
        .domain([newD, x_max])
        .range([0, svg5_width]);

    var y_max = d3.max(sData, function (d) { return d.value; });

    var yScale = d3.scaleLinear()
        .domain([0, y_max])
        .range([svg5_height, 0]).nice();

    var xAxis = d3.axisBottom(xScale)
        .tickFormat(my_format); //표시할 형태를 포메팅한다.

    var yAxis = d3.axisLeft(yScale);

    var g = svg5.append("g")
        .attr("width", svg5_width)
        .attr("height", svg5_height)
        .attr("transform", "translate(" + svg5_margin.left + "," + svg5_margin.top + ")");

    //X_Axis
    var wd = svg5_width - 10;

    g.append("g")
        .attr("class", "X_Axis")
        .style("font", "12px open-sans")
        .attr("transform", "translate(0," + svg5_height + ")")
        .call(xAxis)
        .append("text")
        .attr("transform", "translate(" + wd + ",-5)")
        .attr('fill', 'black')
        .style("font", "11px open-sans")
        .text("Date");

    //Y_Axis
    g.append("g")
        .attr("class", "Y_Axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "translate(13,3) rotate(-90)").attr("text-anchor", "end")
        .attr('fill', 'black')
        .style("font", "11px open-sans")
        .text("Price");

    var lineFunction = d3.line()
        .x(function (d) { return xScale(d.date); })
        .y(function (d) { return yScale(d.value); });
    //.curve(d3.curveLinear);

    var path = g.append("path");

    path.attr("d", lineFunction(sData))
        .attr("stroke", "#333")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    //circle
    g.append("g")
        .attr("class", "circle")
        .selectAll('circle')
        .data(sData).enter().append('circle')
        .attr('cx', function (d) {
            return xScale(d.date);
        })
        .attr('cy', function (d) {
            return yScale(d.value);
        })
        .attr('r', 5)
        .style("fill", "#333");

    //money text
    g.append("g")
        .attr("class", "circle_text")
        .selectAll('.circle_text')
        .data(sData).enter().append('text')
        .attr('x', function (d) {
            return xScale(d.date);
        })
        .attr('y', function (d, i) {
            var num = 15;
            if (i % 2 == 0) { num = - 10; }
            return yScale(d.value) + num;
        })
        .text(function (d) { return Money_format(Math.floor(d.value / 10) * 10) + "원" })
        .style("fill", 'black').style("font_size", '14px');


    var focus = svg5.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("line")
        .attr("class", "x")
        .style("stroke", "#333")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("y1", 0)
        .attr("y2", svg5_height);

    focus.append("rect")
        .attr("class", "tooltip2")
        .attr("width", 160)
        .attr("height", 50)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

    focus.append("text")
        .attr("class", "tooltip-date")
        .attr("x", 18)
        .attr("y", -2)
        .style("font", "12px sans-serif")
        .style("font-weight", "bold");

    focus.append("text")
        .attr("x", 18)
        .attr("y", 18)
        .text("전기요금:")
        .style("font", "12px sans-serif")
        .style("fill", "white");

    focus.append("text")
        .attr("class", "tooltip-value")
        .attr("x", 75)
        .attr("y", 18)
        .style("font", "12px sans-serif")
        .style("font-weight", "bold");

    svg5.append("rect")
        .attr("class", "overlay")
        .attr("width", svg5_width + 500)
        .attr("height", svg5_height + 500)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function () { focus.style("display", null); })
        .on("mouseout", function () { focus.style("display", "none"); })
        .on("mousemove", mousemove);

    function mousemove(d) {
        var x0 = xScale.invert(d3.mouse(this)[0] - 60),
            i = bisectDate2(sData, x0, 1),
            d0 = sData[i - 1],
            d1 = sData[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        var LineX = xScale(d.date) + 60;
        var LineY = yScale(d.value) + 5;

        var seg5_format = d3.timeFormat("%Y년 %m월");

        focus.attr("transform", "translate(" + LineX + "," + LineY + ")");
        focus.select(".tooltip-date").text(seg5_format(d.date));
        focus.select(".tooltip-value").text(Money_format(Math.round(d.value / 10) * 10) + "원"); //일의 자리 버림
        focus.select(".x").attr("y2", svg5_height - yScale(d.value));
        focus.select(".y").attr("x2", svg5_width + svg5_width);
    }
}

function sortByData2(data) {

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