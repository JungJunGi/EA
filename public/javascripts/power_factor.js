
var margin = { top: 60, right: 100, bottom: 20, left: 80 },
    width = 1800 - margin.left - margin.right,
    height = 370 - margin.top - margin.bottom;

var getDate = d3.timeFormat("%Y-%m-%d %H:%M");

var svg = d3.select("#graph")
    .append("svg")
    .style("width", width + margin.left + margin.right + "px")
    .style("height", height + margin.top + margin.bottom + "px")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "svg");

var companyName = document.getElementById("userCompany").innerHTML;
if (companyName.indexOf("(주)") != -1)
    companyName = companyName.replace("(주)", "")

d3.json("/segData/power/company=" + companyName, function (error, data) {
    if (error) throw error;

    var dataSet = sortByData4(data.data);

    // Format the data
    dataSet.forEach(function (d) {
        d.date = new Date(d.date);
        d.value = d.value * 100;
    });

    var start_date = d3.min(dataSet, function (d) { return d.date; });
    var end_date = d3.max(dataSet, function (d) { return d.date; });

    var nest = d3.nest()
        .key(function (d) {
            return d.depart;
        })
        .entries(dataSet);

    var AvgAmount = d3.nest()
        .key(function (d) { return d.date; })
        .rollup(function (v) { return d3.mean(v, function (d) { return d.value; }); })
        .entries(dataSet);

    // Set the ranges
    var x = d3.scaleTime().domain(d3.extent([start_date, end_date])).range([0, width]);
    var y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    // Set up the x axis
    var xaxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x axis")
        .call(d3.axisBottom(x));

    // Add the Y Axis
    var yaxis = svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "translate(13,3) rotate(-90)")
        .style("text-anchor", "end")
        .attr('fill', 'black')
        .style("font", "11px open-sans")
        .text("power_factor(%)");

    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("a simple tooltip");

    // Define the line
    var valueLine = d3.line()
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d.value); })
        .curve(d3.curveStep);

    var svgLine = d3.line()
        .x(function (d) { return x(new Date(d.key)); })
        .y(function (d) { return y(Number(d.value)); })
        .curve(d3.curveStep);

    svg.append("g")
        .attr("class", "avgData")
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", svgLine(AvgAmount));

    // Create a dropdown
    var popupMenu = d3.select("#departDropdown")

    popupMenu
        .append("select")
        .selectAll("option")
        .data(nest)
        .enter()
        .append("option")
        .attr("value", function (d) {
            return d.key;
        })
        .text(function (d) {
            return d.key;
        })

    //처음 그려지는 차트
    var initialGraph = function (depart) {

        // Filter Depart
        var selectDepart = nest.filter(function (d) {
            return d.key == depart;
        })

        var selectDepartGroups = svg.selectAll(".departGroups")
            .data(selectDepart, function (d) {
                return d ? d.key : this.key;
            })
            .enter()
            .append("g")
            .attr("class", "departGroups")

        selectDepartGroups
            .append("path")
            .attr("class", "line")
            .attr("d", function (d) {
                return valueLine(d.values);
            });

        selectDepartGroups.selectAll(".rect")
            .data(function (d) {
                return d.values;
            })
            .enter().append("rect")
            .attr("class", "rect")
            .attr("x", function (d) { return x(d.date) - 3.5; })
            .attr("y", function (d) { return y(d.value) - 2; })
            .attr("width", 7)
            .attr("height", 5)
            .style("fill", function (d) {
                if (d.value >= 90) return "#088A08";
                else if (60 <= d.value && d.value < 90) return "#DF7401";
                else return "#DF0101";
            })
            .on("mouseover", function () { return tooltip.style("visibility", "visible"); })
            .on("mousemove", function (d) {
                var text;
                if (d.value >= 90) text = "효율성 높음";
                else if (60 <= d.value && d.value < 90) text = "효율성 중간";
                else text = "효율성 낮음";

                tooltip.html("해당시간: " + getDate(d.date) + "</br>" + Math.floor(d.value) + "%로 " + text)
                tooltip.style("top", 670 + "px").style("left", 220 + "px");
            })
        // .on("mouseout", function () { return tooltip.style("visibility", "hidden"); });;
    }

    initialGraph(dataSet[0].depart)

    //data update
    var updateGraph = function (depart) {

        var selectDepart = nest.filter(function (d) {
            return d.key == depart;
        })

        var selectDepartGroups = svg.selectAll(".departGroups")
            .data(selectDepart)

        selectDepartGroups.select("path.line")
            .transition()
            .duration(1000)
            .attr("d", function (d) {
                return valueLine(d.values);
            })

        selectDepartGroups.selectAll(".rect")
            .remove().exit()
            .data(function (d) {
                return d.values;
            })
            .enter()
            .append("rect")
            .attr("class", "rect")
            .attr("x", function (d) { return x(d.date) - 3.5; })
            .attr("y", function (d) { return y(d.value) - 2; })
            .attr("width", 7)
            .attr("height", 5)
            .style("fill", function (d) {
                if (d.value >= 90) return "#088A08";
                else if (60 <= d.value && d.value < 90) return "#DF7401";
                else return "#DF0101";
            })
            .on("mouseover", function () { return tooltip.style("visibility", "visible"); })
            .on("mousemove", function (d) {
                var text;
                if (d.value >= 90) text = "효율성 높음";
                else if (60 <= d.value && d.value < 90) text = "효율성 중간";
                else text = "효율성 낮음";

                tooltip.html("해당시간: " + getDate(d.date) + "</br>" + Math.floor(d.value) + "%로 " + text)
                tooltip.style("top", 670 + "px").style("left", 220 + "px");
            });

    }


    //dropdown menu
    popupMenu.on('change', function () {

        //선택한 부서 찾기
        var selectedDepart = d3.select(this)
            .select("select")
            .property("value")

        //부서 update
        updateGraph(selectedDepart)

    });



})

function sortByData4(data) {

    var sData = data.sort(function (x, y) {
        return d3.ascending(x.date, y.date);
    })

    return sData;
}