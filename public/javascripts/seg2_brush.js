
var svg2Size = d3.select('.seg2_chart');

var margin = { top: 50, right: 40, bottom: 60, left: 50 },
    margin2 = { top: 600, right: 20, bottom: 30, left: 50 },

    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    height2 = 700 - margin2.top - margin2.bottom,

    xScale, xScale2, yScaleB, yScaleA;

function myChart(jsonFile) {}

// user company 정보 가져오기
var companyName = document.getElementById("userCompany").innerHTML;

if (companyName.indexOf("(주)") != -1)
    companyName = companyName.replace("(주)", "")

myChart('/seg2Data/seg2/company=' + companyName);



myChart = function (jsonFile) {
    d3.json(jsonFile, function (error, myData) {

        var dataSet = myData.data;

        dataSet.forEach(function (d, i, da) {
            d.date = new Date(d.date);
            d.value = Number(d.value);

            if (i == 0) {
                da[i].current_power = da[i].value;
            } else {
                da[i].current_power = da[i].value - da[i - 1].value;
            }

            if (d.current_power < 0) {
                d.current_power = 0;
            }

            d.contact_demand = d.current_power; // 후에 변경해야 함.
            d.timeSlot = checkTimeSlot(d.date);
        });

    /*
        dataSet.forEach(function (d, i, da) {

            d.date = new Date(d.time_stamp);

            d.current_power = +d.accumulate_power;

            if (i > 0) {
                da[i].current_power = da[i].current_power - da[i - 1].accumulate_power;
            }

            d.contact_demand = d.current_power / d.contact_power;

            d.timeSlot = checkTimeSlot(d.date);
        })


        dataSet.forEach(function (d, i, da) {

            d.date = new Date(d.time_stamp);

            d.current_power = +d.accumulate_power;

            if (i > 0) {
                da[i].current_power = da[i].current_power - da[i - 1].accumulate_power;
            }

            d.contact_demand = d.current_power / d.contact_power;

            d.timeSlot = checkTimeSlot(d.date);
        })
    */

        setScales(dataSet);
        drawChart(dataSet);

    });
}


function setScales(dataSet) {
    
    var start_date = dataSet[0].date;
    var end_date = dataSet[dataSet.length-1].date;

    xScale = d3.scaleTime().domain(d3.extent([start_date, end_date])).range([0, width]);
    xScale2 = d3.scaleTime().domain(xScale.domain()).range(xScale.range());

    yScaleB = d3.scaleLinear()
        .domain([0, d3.max(dataSet, function (d) {
            return d.current_power;
        })])
        .range([height, 0]);

    yScaleA = d3.scaleLinear()
        .domain([0, 1])
        .range(yScaleB.range());
        
    y2 = d3.scaleLinear()
        .domain([0, d3.max(dataSet, function (d) {
            return d.current_power;
        })])
        .range([height2, 0]);

}


function drawChart(dataSet) {

    var xAxis = d3.axisBottom(xScale),
        xAxis2 = d3.axisBottom(xScale2),

        yAxisB = d3.axisLeft(yScaleB),
        yAxisA = d3.axisRight(yScaleA);
    
    var brush = d3.brushX()
        .extent([[0, 0], [width, 70]])
        .on("brush end", brushed);

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    var newRamp = d3.scaleLinear().domain([0, 1, 2])
        .range(["limegreen", "green", "darkgreen"]);

    // ON svg
    var svg = d3.select('.seg2_chart')
        .attr("width", width + 200)
        .attr("transform", function (d, i) {
            return "translate(100, 0)";
        })
        .call(zoom);


    var chartArea = svg.append("g");

    var legend = svg.selectAll(".legend")
        .data(newRamp.domain())
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) {
            return "translate(" + 150 + "," + (440 + (i * 20)) + ")";
        });


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
        .attr("clip-path", "url(#clip)")
        .append('g');

    var axis = chartArea.append("g")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //
    var bChart = chartArea.append("g")
        .attr("class", "BChart")
        .attr("width", width)
        .attr("height", height2)
        .attr("transform", "translate(" + margin.left + ", 530)")
        .attr("clip-path", "url(#clip)")
        .append('g');

    var axis2 = chartArea.append("g")
        .attr("class", "axis2")
        .attr("width", width + 10)
        .attr("height", height2)
        .attr("transform", "translate(" + margin.left + ",530)")
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
                "<span style=\"color:yellow\">" + d.current_power + "</span>" +
                "<br>Contract Demand: <span style=\"color:yellow\">" +
                d3.format(".0%")(d.contact_demand) + "</span>";
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
        chart.select(".areaChart").attr("d", valueArea);

        timeSlot.selectAll(".timeSlot")
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

        var position = width / (s[1] - s[0]) * s[0];

        chart.selectAll(".barChart")
            .attr("transform", function () {
                return "translate(" + -position + ", 0) scale(" + width / (s[1] - s[0]) + ", 1)"
            });
        chart.select(".areaChart").attr("d", valueArea);

        timeSlot.selectAll(".timeSlot")
            .attr("transform", function () {
                return "translate(" + -position + ", 0) scale(" + width / (s[1] - s[0]) + ", 1)"
            });

        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
    }

    // make chart
    var valueArea = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) { return xScale(d.date); })
        .y1(function (d) { return yScaleA(d.contact_demand); })
        .y0(yScaleA(0))
        .curve(d3.curveBasis);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    chart.append("path")
        .attr("class", "areaChart")
        .datum(dataSet)
        .attr("d", valueArea)
        .attr("clip-path", "url(#clip)");

/*
    axis2.append("path")
        .attr("class", "area")
        .datum(dataSet)
        .attr("d", area2);
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
            tip
                .attr("x", function () {
                    return d3.event.offsetX;
                })
                .attr("y", function () {
                    return d3.event.offsetY;
                })
        });

    //
    bChart.selectAll("rect")
        .data(dataSet).enter()
        .append("rect")
        .attr("class", "brushChart")
        .attr("opacity", "0.6")
        .attr("x", function (d, i, da) { return (xScale(d.date) - (width / da.length) * 0.5); })
        .attr("y", function (d, i) {
            return y2(d.current_power);
        })
        .attr("width", function (d, i, da) {
            return (width / da.length);
        })
        .attr("height", function (d) {
            return height2 - y2(d.current_power);
        })
        .attr("fill", " rgb(254, 164, 102)")
        .attr("clip-path", "url(#clip)");

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
        .text(function (d) {
            switch (d) {
                case 0: return "경부하";
                case 1: return "중간부하";
                case 2: return "최대부하";
            }
        });

    // set axis
    axis.append("g")
        .attr("class", "axis-x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    axis.append("g")
        .attr("class", "axis-y")
        .call(yAxisB)
        .append("text")
        .text("Amount of Electricity Used")
        .attr("transform", "translate(10,123) rotate(90)")
        .attr('fill', 'black');

    axis.append("g")
        .attr("transform", "translate(" + width + ", 0)")
        .call(yAxisA
            .tickFormat(d3.format(".0%")))
        .append("text")
        .text("Contact Demand")
        .attr("transform", "translate(-10,75) rotate(-90)")
        .attr('fill', 'black');

    //
    axis2.append("g")
        .attr("class", "axis axis-x")
        .attr("transform", "translate(0 , 70)")
        .call(xAxis2);

    axis2.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, xScale.range());
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
