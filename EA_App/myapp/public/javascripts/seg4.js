var tooltip = d3.select("body")
.append("div")
.style("position", "absolute")
.style("z-index", "10")
.style("visibility", "hidden")
.style("color", "white")
.style("padding", "8px")
.style("background-color", "rgba(0, 0, 0, 0.75)")
.style("border-radius", "6px")
.style("font", "12px sans-serif");

var svg_1 = d3.select('.seg4_chart_1') //d3.select("body").select("svg")
//.attr("width", 1500).attr("height", 350)
.attr("transform", "translate(0, 50)")
.append('g');
var svg_2 = d3.select('.seg4_chart_2') //d3.select("body").select("svg")
.attr("transform", "translate(0, 50)")
.append('g');
var svg_3 = d3.select('.seg4_chart_3') //d3.select("body").select("svg")
.attr("transform", "translate(0, 50)")
.append('g');


//pie chart
pie("/segData/seg4_data1", "금일 총 사용량", svg_1);
pie("/segData/seg4_data2", "금일 피크전력", svg_2);
pie("/segData/seg4_data3", "금일 유효전력", svg_3);
//pie("/segData/seg4_data4", "금일 역률", svg_4);

//json

function classes_4(root, label) {
var classes = [];

function recurse_4(name, node) {
    if (node.data) node.data.forEach(function (child) { recurse_4(node.name, child); });
    else value_recurse(node, label);
}
function value_recurse(node, label) {
    if (label == '금일 총 사용량')
        classes.push({ siteName: node.name, siteID: node.id, value: node.accumulate_power });
    else if (label == '금일 피크전력')
        classes.push({ siteName: node.name, siteID: node.id, value: node.active_power });
    else if (label == '금일 유효전력')
        classes.push({ siteName: node.name, siteID: node.id, value: node.peak_power });
    else if (label == '금일 역률')
        classes.push({ siteName: node.name, siteID: node.id, value: node.power_factor });
    else
        console.log("error");
}

recurse_4(null, root);
return { children: classes };
}

// chart function
function pie(fileName, label, mysvg) {
var w = 300; var h = 250;

var outerRadius = (w - 50) / 2;
var innerRadius = (w - 50) / 3;

d3.json(fileName, function (error, data) {
    if (error) throw error;

    var root = d3.hierarchy(classes_4(data, label))
        .sum(function (d) {
            return d.value;
        })
        .sort(function (a, b) {
            return b.value - a.value;
        });

    var arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    var pie = d3.pie()
        .value(function (d, i) {
            return d.data.value;
        })
        .padAngle(.01);

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var sData = root.children.slice(0, 10);

    var arcs = mysvg.append('g')
        //.attr("transform", "translate(" + 180 * num + ", 10)")
        .selectAll(".arc")
        .data(pie(sData)).enter().append("g")
        .attr("class", "arc")
        .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")")

        .on("mouseover", function (d) { mouseOver(d.data); })
        .on("mousemove", function () {
            return tooltip.style("top", (d3.event.pageY - 10) + "px")
                .style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function () { tooltip.style("visibility", "hidden"); });

    var path = arcs.append("path")
        .attr("fill", function (d, i) { return color(i); })
        .attr("d", arc);

    //transition
    path.transition()
        .duration(1000)
        .attrTween('d', function (d) {
            var interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return function (t) {
                return arc(interpolate(t));
            };
        });

    var restOfTheData = function () {
        arcs.append('text')
            .transition()
            .duration(200)
            .attr("transform", function (d) {
                return "translate(" + arc.centroid(d) + ")";
            })
            .attr("text-anchor", "middle")
            .attr("dy", ".4em")
            .attr("text-anchor", "middle")
            .text(function (d) { return d.data.value; });

        //legend
        var legendRectSize = 20;
        var legendSpacing = 1;
        var legendHeight = legendRectSize + legendSpacing;

        /*sData.sort(function(a, b){
        console.log(a.data.siteName);
        if(a.data.siteName < b.data.siteName) return -1;
        if(a.data.siteName > b.data.siteName) return 1;
        return 0;
        })*/

        var legend = mysvg.append('g')
           // .attr("transform", "translate(" + (180 * num) + ", 10)")
            .selectAll('.legend')
            .data(sData).enter().append('g')
            .attr("class", 'legend')
            .attr("transform", function (d, i) {
                return 'translate(270,' + (((i + 1) * legendHeight) + (3 * i)) + ')';
            })
            .on("mouseover", function (d) { mouseOver(d); })
            .on("mousemove", function () {
                return tooltip.style("top", (d3.event.pageY - 10) + "px")
                    .style("left", (d3.event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
            });

        legend.append('rect')
            .attr("width", legendRectSize).attr("height", legendHeight)
            .attr("rx", 20).attr("ry", 20)
            .style("fill", function (d, i) { return color(i); });

        legend.append('text')
            .attr("x", 30).attr("y", 15)
            .text(function (d) { return d.data.siteName; })
            .style("fill", 'black').style("font_size", '14px');

        //var lx = (180 * num) + 150;
        mysvg.append('text')
        .attr("transform", function (d, i) {
            return 'translate(70, 280)';
        })
            .text(label).style("fill", 'black')
            .style("font", "18px sans-serif");
    };
    setTimeout(restOfTheData,1000);
}); //json file
}//pie function

//toolTip
function mouseOver(d) {
tooltip.html("Name : " + d.data.siteName + "<br/>Value : " + d.value + "<br/>ID : " + d.data.siteID);
tooltip.style("visibility", "visible");
}
