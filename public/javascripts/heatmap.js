
var margin = { top: 20, right: 0, bottom: 100, left: 30 },
    width = 960,
    height = 330,

    gridSize = Math.floor(width / 24),
    legendElementWidth = gridSize * 2,
    buckets = 8,
    //bubble
    diameter = 380,

    colors = ["#e9f79b", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"], // alternatively colorbrewer.YlGnBu[9]
    days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];
//datasets = ["data.tsv", "data2.tsv"];
//ffffaa f9f986 ffffd9
//#edf8b1

var m_svg = d3.select(".m_chart")
    .attr("width", 1400)
    .attr("height", 480)
    .attr("transform", "translate(10,10)")
    .append('g');

//label
var dayLabels = m_svg.append('g').selectAll(".dayLabel")
    .data(days).enter()
dayLabels.append("text")
    .text(function (d) { return d; })
    .attr("x", 6)
    .attr("y", function (d, i) { return i * gridSize + 20; })
    .style("font", "12px sans-serif")
    .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
    .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

var timeLabels = m_svg.append('g').selectAll(".timeLabel")
    .data(times).enter();

timeLabels.append("text")
    .text(function (d) { return d; })
    .attr("x", function (d, i) { return i * gridSize + 22; })
    .attr("y", 17)
    .style("font", "12px sans-serif").style("text-anchor", "middle")
    .attr("transform", "translate(" + gridSize / 2 + ", -6)")
    .attr("class", function (d, i) { return ((i >= 8 && i <= 17) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

//chart
var heatmapChart = function (jsonFile) {
    d3.json(jsonFile, function (error, data) {
        if (error) throw error;

        function valueSum(d) {
            var len = d.value.length, value = 0;

            for (k = 0; k < len; k++) {
                value += d.value[k].value;
            }
            return value;
        }

        const colorScale = d3.scaleQuantile()
            .domain([0, buckets - 1, d3.max(data.data, (d) => valueSum(d))])
            .range(colors);

        //chart
        var cards = m_svg.append('g').selectAll(".hour")
            .data(data.data, function (d) { return d.day + ':' + d.hour; });
        cards.append("title");

        cards.enter().append("rect")
            .attr("x", function (d) { return (d.hour - 1) * gridSize + 25; })
            .attr("y", function (d) { return (d.day - 1) * gridSize + 20; })
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("class", "hour bordered")
            .attr("width", gridSize)
            .attr("height", gridSize)
            .style("fill", colors[0])
            .style('opacity', 0.7)
            .merge(cards)

            .on("mouseover", function (d) {
                d3.select(this).style('opacity', 1);
                //부서 bubble
                bubble_chart(d)
            })
            .on("mouseout", function (d) {
                d3.select(this).style('opacity', 0.7);
                //node 제거
                node.remove();
            })

            .transition()
            .duration(1000)
            .style("fill", (d) => colorScale(valueSum(d)));

        cards.select("title").text((d) => colorScale(valueSum(d)));
        cards.exit().remove();

        //legend
        const legend = m_svg.append("g").selectAll(".legend")
            .data([0].concat(colorScale.quantiles()), (d) => d);

        const legend_g = legend.enter().append("g")
            .attr("class", "legend");

        legend_g.append("rect")
            .attr("x", (d, i) => legendElementWidth * i + 30)
            .attr("y", height)
            .attr("width", legendElementWidth)
            .attr("height", gridSize / 2)
            .style("fill", (d, i) => colors[i])
            .style('opacity', 0.8);

        legend_g.append("text")
            .attr("class", "mono")
            .text((d) => "≥ " + Math.round(d))
            .attr("x", (d, i) => legendElementWidth * i + 30)
            .attr("y", height + gridSize);
        legend.exit().remove();

        //bubble
        var bubble = d3.pack()
            .size([diameter, diameter])
            .padding(60);
        var trans = d3.transition()
            .duration(750)
            .ease(d3.easeBounce);

        function bubble_chart(d) {
            var root = d3.hierarchy(Hclasses(d))//data.data[0]
                .sum(function (d) { return d.value; })
                .sort(function (a, b) { return b.value - a.value; });//데이터 내림차수 정렬
            bubble(root);

            node = m_svg.append('g')
                .attr("transform", "translate(980, 10)")
                .selectAll(".node")
                .data(root.children)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

            node.append("circle")
                .transition(trans) //transition적용
                .attr("r", function (d) { if (d.value != 0) return d.r + 15; })
                .style("fill", (d) => colorScale(d.value));

            node.append("text")
                .attr("class", "label")
                .attr("dy", ".4em")
                .style("text-anchor", "middle")
                .style("fill", "white")
                .attr("transform", function (d) { return "translate(0,-10)"; })
                .text(function (d) { if (d.value != 0) return d.data.depart; });

            node.append("text")
                .attr("class", "label")
                .attr("dy", ".4em")
                .style("text-anchor", "middle")
                .style("fill", "white")
                .attr("transform", function (d) { return "translate(0,10)"; })
                .text(function (d) { if (d.value != 0) return d.value; });
        }
    });
};

function Hclasses(root) {
    var classes = [];
    var len = root.value.length;

    function recurse(node) { classes.push({ depart: node.depart, value: node.value }); }
    for (i = 0; i < len; i++) { recurse(root.value[i]); }

    return { children: classes };
}


var companyName = document.getElementById("userCompany").innerHTML;
if (companyName.indexOf("(주)") != -1)
    companyName = companyName.replace("(주)", "")

heatmapChart('/heatmapData/heatmap/company=' + companyName);