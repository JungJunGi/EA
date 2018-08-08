var format = d3.timeFormat("%Y");

var svg = d3.select(".area"),
    margin = { top: 20, right: 30, bottom: 30, left: 60 },
    width = +svg.attr("width"),
    height = +svg.attr("height");

d3.json('new.json', function (error, data) {
    var sData = data.data;

    sData.forEach(e => {
        e.date = new Date(e.date);
    });

    var x_min = d3.min(sData, function (d) { return d.date; });
    var x_max = d3.max(sData, function (d) { return d.date; });

    var newD = new Date(x_min.getYear() + 1900,  0);

    var series = d3.stack()
        .keys(data.depart)
        //.order(d3.stackOrderDescending)
        .offset(d3.stackOffsetNone)
        (data.data);

    var x = d3.scaleTime()
        .range([margin.left, width - margin.right])
        .domain([newD, x_max]);

    /*
     var x = d3.scaleBand()
        .domain(data.data.map(function (d) { return d.date; }))
        .rangeRound([margin.left, width - margin.right])
        .padding(0.1);
    */

    var y = d3.scaleLinear()
        .domain([d3.min(series, stackMin), d3.max(series, stackMax)])
        .range([height - margin.bottom, margin.top]);

    var z = d3.scaleOrdinal(d3.schemeCategory10);

    var area = d3.area()
        //.curve(d3.curveMonotoneX) //선 곡선모양
        .x(function (d) { return x(d.data.date); })
        .y0(function (d) { return y(d[0]); })
        .y1(function (d) { return y(d[1]); });

    svg.append("g")
        .selectAll("g")
        .data(series)
        .enter().append("g")
        .attr("fill", function (d) { return z(d.key); })
        .append('path')
        .attr('class', 'area')
        .attr('d', area);

    var xAxis = d3.axisBottom(x)
    //.tickFormat(format)
    //.ticks(d3.timeYear);

    var yAxis = d3.axisLeft(y);

    svg.append("g")
        .attr("transform", "translate(0," + y(0) + ")")
        .call(xAxis);

    svg.append("g")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(yAxis);

    function stackMin(serie) {
        return d3.min(serie, function (d) { return d[0]; });
    }

    function stackMax(serie) {
        return d3.max(serie, function (d) { return d[1]; });
    }

    //tooltip 추가
    
    
    //legend 추가
    var legendRectSize = 20;
    var legendSpacing = 1;
    var legendHeight = legendRectSize + legendSpacing;

    var legend = svg.append('g')
        .selectAll('.legend')
        .data(series).enter().append('g')
        .attr("class", 'legend')
        .attr("transform", function (d, i) {
            return 'translate(860,' + (((i + 5) * legendHeight) + (-45 * i)) + ')';
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