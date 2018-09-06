var svg2Size = d3.select('.seg2_chart');

var margin = { top: 50, right: 40, bottom: 60, left: 50 },
    width = +svg2Size.attr("width") - margin.left - margin.right,
    height = +svg2Size.attr("height") - margin.top - margin.bottom;

var xScale, xScale2, yScaleB, yScaleA;

var name, id;

d3.json("/segData/seg2", function (error, myData) {

    var dataSet = myData.data;

    name = dataSet[0].name;
    id = dataSet[0].id;


    dataSet.forEach(function (d, i, da) {

        d.date = new Date(d.time_stamp);

        d.current_power = +d.accumulate_power;

        if (i > 0) {
            da[i].current_power = da[i].current_power - da[i - 1].accumulate_power;
        }

        // d.contact_demand = d.current_power / d.contact_power;
    })

    setScales(myData.meta, dataSet);
    drawChart(dataSet);
})


function setScales(meta, dataSet) {

    var start_date = new Date(meta.start_ts);
    var end_date = new Date(meta.end_ts);

    xScale = d3.scaleTime().domain([start_date, end_date]).range([0, width]);
    xScale2 = d3.scaleTime().domain(xScale.domain()).range(xScale.range());

    yScaleB = d3.scaleLinear()
        .domain([0, d3.max(dataSet, function (d) {
            return d.current_power;
        })])
        .range([height, 0]);

    yScaleA = d3.scaleLinear()
        .domain([0, 1])
        .range(yScaleB.range());
}


function drawChart(dataSet) {

    var xAxis = d3.axisBottom(xScale),
        yAxisB = d3.axisLeft(yScaleB),
        yAxisA = d3.axisRight(yScaleA);

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);


    // ON svg
    var svg = d3.select('.seg2_chart')
        .attr("width", width + 200)
        .attr("transform", function(d, i) {
        	return "translate(100, 0)";
        })
        .call(zoom);

    var chartArea = svg.append("g");


    chartArea.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("class", "zoom")
        .attr("width", width)
        .attr("height", height + margin.bottom);

    var chart = chartArea.append("g")
        .attr("class", "chart")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("clip-path", "url(#clip)");

    var axis = chartArea.append("g")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var getDate = d3.timeFormat("%Y-%m-%d %H:%M");




    // set tool tip
    var tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10,0])
        .html(function (d) {
            //console.log(d3.event.offsetX, d3.event.offsetY)
            return "Date: <span style=\"color:yellow\">" + getDate(d.date) +
                "</span><br>Amount of Electricity Used: " +
                "<span style=\"color:yellow\">" + d.current_power + "</span>" // +
                // "<br>Contract Demand: <span style=\"color:yellow\">" +
                // d3.format(".0%")(d.contact_demand)  + "</span>";
        });

    chartArea.call(tip);


    // zoom function
    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type == "brush") return;
        var t = d3.event.transform;
        xScale.domain(t.rescaleX(xScale2).domain());

        axis.select(".axis-x").call(xAxis);

        chart.selectAll(".barChart")
            .attr("transform", function () {
                return "translate(" + d3.event.transform.x + ", 0) scale(" + d3.event.transform.k + ", 1)"
            })
        // chart.select(".areaChart").attr("d", valueArea);
/*
        timeSlot.selectAll(".timeSlot")
            .attr("transform", function () {
                return "translate(" + d3.event.transform.x + ", 0) scale(" + d3.event.transform.k + ", 1)"
            });
*/
    }


    // make chart
/*
    var valueArea = d3.area()
        .x(function (d) { return xScale(d.date); })
        .y1(function (d) { return yScaleA(d.contact_demand); })
        .y0(yScaleA(0))
        .curve(d3.curveBasis);

    chart.append("path")
        .attr("class", "areaChart")
        .datum(dataSet)
        .attr("d", valueArea)
        .attr("clip-path", "url(#clip)");
*/
    chart.selectAll("rect")
        .data(dataSet).enter()
        .append("rect")
        .attr("class", "barChart")
        .attr("opacity", "0.6")
        .attr("x", function (d, i, da) { return (xScale(d.date) - (width / da.length) * 0.5); })
        .attr("y", function (d, i) {
            return yScaleB(d.current_power);
        })
        .attr("width", function (d, i, da) {
            return (width / da.length);
        })
        .attr("height", function (d) {
            return height - yScaleB(d.current_power);
        })
        .attr("clip-path", "url(#clip)")
        //.on("mouseover", tip.show)
        //.on("mouseout", tip.hide)
        .on("mouseover", function(d) {
            tip.show(d);
		   		d3.select(this)
		   			.attr("opacity", "0.9");
		   })
		   .on("mouseout", function() {
            tip.hide();
			    d3.select(this)
			   		.transition()
			   		.duration(500)
					.attr("opacity", "0.6");
		   })
       .on("mousemove", function(d){
           tip
            .attr("x", function(){
                return d3.event.offsetX;
            })
            .attr("y", function() {
                return d3.event.offsetY;
            })
       })


    // set axis
    axis.append("g")
        .attr("class", "axis-x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    axis.append("g")
        .call(yAxisB)
        .append("text")
	    .text("Amount of Electricity Used")
	    .attr("transform", "translate(10,123) rotate(90)")
	    .attr('fill','black');
/*
    axis.append("g")
        .attr("transform", "translate(" + width + ", 0)")
        .call(yAxisA
            .tickFormat(d3.format(".0%")))
        .append("text")
	    .text("Contact Demand")
	    .attr("transform", "translate(-10,75) rotate(-90)")
	    .attr('fill','black');
*/
}
