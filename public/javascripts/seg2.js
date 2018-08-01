
var margin = { top: 50, right: 40, bottom: 60, left: 50 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

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

        d.contact_demand = d.current_power / d.contact_power;

        d.timeSlot = checkTimeSlot(d.date);
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

    var newRamp = d3.scaleLinear().domain([0, 1, 2])
        .range(["limegreen", "green", "darkgreen"]);

    // ON svg
    var svg = d3.select('.seg2_chart') //d3.select("svg")
        .attr("width", width + 200)
        .attr("transform", function(d, i) {
        	return "translate(100, 0)";
        })
        .call(zoom);

    var user = svg.append("g");

    var chartArea = svg.append("g");

    var legend = svg.selectAll(".legend")
        .data(newRamp.domain())
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
        	return "translate(" + 150 + "," + (440 + (i * 20)) + ")";
        });
/*
    user.append("text")
        .attr("class", "user")
        .text("USER >>  NAME : " + name + ", ID : " + id)
        .attr("transform", "translate(20, 25)");
*/

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

    var timeSlot = chartArea.append("g")
        .attr("width", width)
        .attr("height", margin.bottom)
        .attr("transform", "translate(" + margin.left + ", " + height + ")")
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
                "<span style=\"color:yellow\">" + d.current_power + "</span>" +
                "<br>Contract Demand: <span style=\"color:yellow\">" +
                d3.format(".0%")(d.contact_demand)  + "</span>";
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
        chart.select(".areaChart").attr("d", valueArea);

        timeSlot.selectAll(".timeSlot")
            .attr("transform", function () {
                return "translate(" + d3.event.transform.x + ", 0) scale(" + d3.event.transform.k + ", 1)"
            })
    }


    // make chart
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


    // make timeSlot
    timeSlot.selectAll("rect")
        .data(dataSet).enter()
        .append("rect")
        .attr("class", "timeSlot")
        .attr("x", function (d, i, da) { return (xScale(d.date) - (width / da.length) * 0.5); })
        .attr("y", margin.top)
        .attr("width", function (d, i, da) {
            return (width / da.length) * 1.1;
        })
        .attr("height", margin.bottom)
        .style("fill", function (d) { return newRamp(d.timeSlot); })
        .attr("clip-path", "url(#clip)");


    legend.append("rect")
          .attr("x", width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", newRamp);

    legend.append("text")
          .attr("x", width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .attr("font-size", "11px")
          .text(function(d) {
              switch (d) {
                  case 0: return "경부하";
                  case 1: return "중간부하";
                  case 2: return "최대부하";
              }});



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

    axis.append("g")
        .attr("transform", "translate(" + width + ", 0)")
        .call(yAxisA
            .tickFormat(d3.format(".0%")))
        .append("text")
	    .text("Contact Demand")
	    .attr("transform", "translate(-10,75) rotate(-90)")
	    .attr('fill','black');

}


function checkTimeSlot(d) {

    var getM = d3.timeFormat("%b");
    var getH = d3.timeFormat("%H");

    var dMonth = -1;
    var dHour = parseInt(getH(d));

    switch (getM(d)) {
        case "Jan": dMonth = 1; break;
        case "Feb": dMonth = 2; break;
        case "Mar": dMonth = 3; break;
        case "Apr": dMonth = 4; break;
        case "May": dMonth = 5; break;
        case "Jun": dMonth = 6; break;
        case "Jul": dMonth = 7; break;
        case "Aug": dMonth = 8; break;
        case "Sep": dMonth = 9; break;
        case "Oct": dMonth = 10; break;
        case "Nov": dMonth = 11; break;
        case "Dec": dMonth = 12; break;
        default: dMonth = -1; break;
    }

    // summer
    if (dMonth == 6 || dMonth == 7 || dMonth == 8) {
        switch (dHour) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8: return 0;
            case 9: return 1;
            case 10:
            case 11: return 2;
            case 12: return 1;
            case 13:
            case 14:
            case 15:
            case 16: return 2;
            case 17:
            case 18:
            case 19:
            case 20:
            case 21:
            case 22: return 1;
            case 23: return 0;
            default: return -1;
        }
    } // spring OR autumn
    else if (dMonth == 3 || dMonth == 4 || dMonth == 5 || dMonth == 9 || dMonth == 10) {
        switch (dHour) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8: return 0;
            case 9: return 1;
            case 10:
            case 11: return 2;
            case 12: return 1;
            case 13:
            case 14:
            case 15:
            case 16: return 2;
            case 17:
            case 18:
            case 19:
            case 20:
            case 21:
            case 22: return 1;
            case 23: return 0;
            default: return -1;
        }
    } //winter
    else if (dMonth == 11 || dMonth == 12 || dMonth == 1 || dMonth == 2) {
        switch (dHour) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8: return 0;
            case 9: return 1;
            case 10:
            case 11: return 2;
            case 12: return 1;
            case 13:
            case 14:
            case 15:
            case 16:
            case 17: return 2;
            case 18:
            case 19:
            case 20:
            case 21:
            case 22: return 1;
            case 23: return 0;
            default: return -1;
        }
    }
    else {
        return -1;
    }
}
