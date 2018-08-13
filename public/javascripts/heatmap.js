var margin_h = { top: 50, right: 0, bottom: 100, left: 30 },
    width_h = 960,
    height_h = 330,
    gridSize = Math.floor(width_h / 24),
    legendElementWidth = gridSize * 2,
    buckets = 9,
    colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"], // alternatively colorbrewer.YlGnBu[9]
    days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];
//datasets = ["data.tsv", "data2.tsv"];

var m_svg = d3.select(".m_chart")
    .attr("width", width + margin_h.left + margin_h.right)
    .attr("height", height_h + margin_h.top + margin_h.bottom)
    .attr("transform", "translate(10,10)")
    .append('g');

var dayLabels = m_svg.append('g').selectAll(".dayLabel")
    .data(days).enter()

dayLabels.append("text")
    .text(function (d) { return d; })
    .attr("x", 6)
    .attr("y", function (d, i) { return i * gridSize + 20; })
    .style("font", "12px sans-serif")//.style("text-anchor", "end")
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


var heatmapChart = function (jsonFile) {
    d3.json(jsonFile, function (error, data) {
        if (error) throw error;

        const colorScale = d3.scaleQuantile()
            .domain([0, buckets - 1, d3.max(data.data, (d) => d.value)])
            .range(colors);

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
            .merge(cards)
            .transition()
            .duration(1000)
            .style("fill", (d) => colorScale(d.value));

        cards.select("title").text((d) => d.value);

        cards.exit().remove();

        const legend = m_svg.append("g").selectAll(".legend")
            .data([0].concat(colorScale.quantiles()), (d) => d);

        const legend_g = legend.enter().append("g")
            .attr("class", "legend");

        legend_g.append("rect")
            .attr("x", (d, i) => legendElementWidth * i+30)
            .attr("y", height_h)
            .attr("width", legendElementWidth)
            .attr("height", gridSize / 2)
            .style("fill", (d, i) => colors[i]);

        legend_g.append("text")
            .attr("class", "mono")
            .text((d) => "≥ " + Math.round(d))
            .attr("x", (d, i) => legendElementWidth * i+30)
            .attr("y", height_h + gridSize);

        legend.exit().remove();

    });
};

heatmapChart("heatmap_data.json");