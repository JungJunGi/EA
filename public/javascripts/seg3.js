var height = 500,
    width = 960,
    diameter = 300,
    format = d3.format(",d");
    margin = { top: 30 },
    margin2 = { top: 20, left: 20 };

var bubble = d3.pack()
    .size([diameter, diameter])
    .padding(2);

var zoomer = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoom)

var svg_3 = d3.select(".seg3_chart")
    //.call(zoomer) //여기다 붙이면 svg안에서 모두 줌 적용.
    .attr("transform", function(d, i) {
        return "translate(100, 0)";
    })
    .append('g')
    .attr("class", "zooms")
    .call(zoomer);

//MouseOver시 Shadow
var defs = svg_3.append("defs");

var filter = defs.append("filter")
    .attr("id", "dropShadow")
    .attr('x', '-40%')
    .attr('y', '-40%')
    .attr("filterUnits", "userSpaceOnUse")

filter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 7)
    .attr("result", "blur");

filter.append("feOffset")
    .attr("in", "blur")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("result", "offsetBlur");

filter.append("feFlood")
    .attr("in", "offsetBlur")
    .attr("flood-color", '#FF00DD')
    .attr("flood-opacity", "1")
    .attr("result", "offsetColor");

filter.append("feComposite")
    .attr("in", "offsetColor")
    .attr("in2", "offsetBlur")
    .attr("operator", "in")
    .attr("result", "offsetBlur");

var feMerge = filter.append("feMerge");

feMerge.append("feMergeNode")
    .attr("in", "offsetBlur")
feMerge.append("feMergeNode")
    .attr("in", "SourceGraphic");

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

var x = 0;

var trans = d3.transition()
    .duration(750)
    .ease(d3.easeBounce); //d3.easeLinear

//차트그리기 함수
function addChart(jsonFile, color) {
    //json파일 불러오기
    d3.json(jsonFile, function (error, data) {
        if (error) throw error;

        var root = d3.hierarchy(classes(data))
            .sum(function (d) { return d.value; })
            .sort(function (a, b) { return b.value - a.value; });//데이터 내림차수 정렬

        bubble(root);

        var node = svg_3.append('g')
            .attr("transform", "translate(" + (x * diameter + 10) + "," + margin.top + ")")
            .selectAll(".node")
            .data(root.children.slice(0, 10)) //데이터 최대 10만 가져오기
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

        node.append("circle")
            .transition(trans) //transition적용
            .attr("r", function (d) { return d.r; })
            .style("fill", color);

        node.on("mouseover", function (d) {
            tooltip.html("name: " + d.data.className + "<br/>accumulate_power: " + format(d.value));
            tooltip.style("visibility", "visible");
            d3.select(this).attr("filter", "url(#dropShadow)");

        })
            .on("mousemove", function () {
                return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
                d3.select(this).attr('filter', null);
            });

        node.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .style("pointer-events", "none")
            //.style("fill", "black")
            .text(function (d) { return d.data.className.substring(0, d.r / 3); });

        x++;
    });

}

//mouseZoom in / out
function zoom() {
    svg_3.attr("transform", d3.event.transform);
}

// Returns a flattened hierarchy containing all leaf nodes under the root.
function classes(root) {
    var classes = [];

    function recurse(node) {
        if (node.data) node.data.forEach(function (child) { recurse(child); });
        else classes.push({ className: node.name, value: node.accumulate_power });
    }

    recurse(root);
    return { children: classes };
}

d3.select(self.frameElement).style("height", height + "px");

addChart("/segData/seg3_tag1", "#B2EBF4");
addChart("/segData/seg3_tag2", "#A6A6A6");
addChart("/segData/seg3_tag3", "#FFB2F5");