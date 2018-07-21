

d3.json('/moneyData/money', function (error, data) {
    if (error) throw error;

    //data sort
    var sData = sortByData(data.data);
    Line_chart(data.meta, sData);

});//json

function Line_chart(meta, sData) {

    var svg5 = d3.select('.seg5_chart');//.attr("transform", "translate(400, 10)");
    var margin = { top: 50, right: 200, bottom: 50, left: 60 };

    var width = +svg5.attr("width") - margin.left - margin.right,
        height = +svg5.attr("height") - margin.top - margin.bottom;

    var my_format = d3.timeFormat("%m/%Y");
    Money_format = d3.format(",");
    
    var bisectDate = d3.bisector(function(d) { return d.date; }).left;

    var x_min = d3.min(sData, function (d) { return d.date; });
    var x_max = d3.max(sData, function (d) { return d.date; });

    var newD = new Date(x_min.getYear() + 1900, x_min.getMonth(), 1);

    var xScale = d3.scaleTime()
        .domain([newD, x_max])
        .range([0, width]);

    var y_max = d3.max(sData, function (d) { return d.money; });
    y_max = y_max + 20000;

    console.log(y_max);
    var yScale = d3.scaleLinear()
        .domain([0, y_max])
        .range([height, 0]);

    var xAxis = d3.axisBottom(xScale)
        .tickFormat(my_format) //표시할 형태를 포메팅한다.
        .ticks(d3.timeMonth);

    var yAxis = d3.axisLeft(yScale);

    // 회사 이름
    var name = svg5.append("g")

    var g = svg5.append("g")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //X_Axis
    var wd = width - 10;
    g.append("g")
        .attr("class", "X_Axis")
        .style("font", "12px open-sans")
        .attr("transform", "translate(0," + height + ")")
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

    var line = d3.line()
        .x(function (d) { return xScale(d.date); })
        .y(function (d) { return yScale(d.money); });

    var lineFunction = d3.line()
        .x(function (d) { return xScale(d.date); })
        .y(function (d) { return yScale(d.money); });
    //.curve(d3.curveLinear);

    var path = g.append("path");

    path.attr("d", lineFunction(sData))
        .attr("stroke", "blue")
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
            return yScale(d.money);
        })
        .attr('r', 5)
        .style("fill", "blue");

    var focus = svg5.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("line")
        .attr("class", "x")
        .style("stroke", "blue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("y1", 0)
        .attr("y2", height);

    focus.append("rect")
        .attr("class", "tooltip2")
        .attr("width", 180)
        .attr("height", 50)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

    focus.append("text")
        .attr("class", "tooltip-date")
        .attr("x", 18)
        .attr("y", -2)
        .style("font", "18px sans-serif")
        .style("font-weight", "bold");

    focus.append("text")
        .attr("x", 13)
        .attr("y", 18)
        .text("전기요금:")
        .style("font", "18px sans-serif");


    focus.append("text")
        .attr("class", "tooltip-money")
        .attr("x", 90)
        .attr("y", 18)
        .style("font", "18px sans-serif")
        .style("font-weight", "bold");

    svg5.append("rect")
        .attr("class", "overlay")
        .attr("width", width+500)
        .attr("height", height+500)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);

    function mousemove(d) {
        var x0 = xScale.invert(d3.mouse(this)[0]),
            i = bisectDate(sData, x0, 1),
            d0 = sData[i - 1],
            d1 = sData[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        console.log(x0, i, d0, d1, d)
        var LineX = xScale(d.date) + 60;
        var LineY = yScale(d.money) + 50;

        focus.attr("transform", "translate(" + LineX + "," + LineY + ")");
        focus.select(".tooltip-date").text(my_format(d.date));
        focus.select(".tooltip-money").text(Money_format(Math.round(d.money/10)*10)+"원"); //일의 자리 반올림
        focus.select(".x").attr("y2", height - yScale(d.money));
        focus.select(".y").attr("x2", width + width);
    }
}

function sortByData(data) {

    var sData = data.sort(function (x, y) {
        return d3.descending(x.date, y.date);
    })
    sData = sData.slice(0, 6);

    sData = sData.sort(function (x, y) {
        return d3.ascending(x.date, y.date);
    })

    sData.forEach(e => {
        e.date = new Date(e.date);
        e.money = Number(e.money);
    });

    return sData;
}