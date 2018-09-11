
// user company 정보 가져오기
var companyName = document.getElementById("userCompany").innerHTML;

if (companyName.indexOf("(주)") != -1) {
    companyName = companyName.replace("(주)", "")
}

var chart2 = d3.select('.seg2_chart'),
    seg2_margin = { top: 20, right: 20, bottom: 150, left: 40 },
    seg2_margin2 = { top: 430, right: 20, bottom: 20, left: 40 },

    width = +chart2.attr("width") - seg2_margin.left - seg2_margin.right,
    height = +chart2.attr("height") - seg2_margin.top - seg2_margin.bottom,
    height2 = +chart2.attr("height") - seg2_margin2.top - seg2_margin2.bottom;

var x = d3.scaleTime().range([0, width]),
    x2 = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    y2 = d3.scaleLinear().range([height2, 0]);

var x_Axis = d3.axisBottom(x),
    x_Axis2 = d3.axisBottom(x2),
    y_Axis = d3.axisLeft(y);

var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush end", brushed);

var zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

var area_ = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function (d) { return x(d.date); })
    .y0(height)
    .y1(function (d) { return y(d.value); });

var area_2 = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function (d) { return x2(d.date); })
    .y0(height2)
    .y1(function (d) { return y2(d.value); });

chart2.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

var seg2_focus = chart2.append("g")
    .attr("class", "focus")
    .attr("width", width)
    .attr("transform", "translate(" + seg2_margin.left + "," + seg2_margin.top + ")");

var seg2_context = chart2.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + seg2_margin2.left + "," + seg2_margin2.top + ")");


d3.json('/seg2Data/seg2/company=' + companyName, function (error, data) {
    if (error) throw error;

    //data
    var Jdata = data.data;
    Jdata.forEach(e => {
        e.date = new Date(e.date);
        e.value = Number(e.value);
    });
    Jdata = Jdata.slice(1000, 2000);

    //chart
    x.domain(d3.extent(Jdata, function (d) { return d.date; }));
    y.domain([0, d3.max(Jdata, function (d) { return d.value; })]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    seg2_focus.append("path")
        .datum(Jdata)
        .attr("class", "barea")
        .attr("d", area_);

    seg2_focus.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(x_Axis);

    seg2_focus.append("g")
        .attr("class", "axis axis--y")
        .call(y_Axis);

    seg2_context.append("path")
        .datum(Jdata)
        .attr("class", "barea")
        .attr("d", area_2);

    seg2_context.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height2 + ")")
        .call(x_Axis2);

    seg2_context.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, x.range());

    chart2.append("rect")
        .attr("class", "zoom")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + seg2_margin.left + "," + seg2_margin.top + ")")
        .call(zoom);
});

function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;
    var s = d3.event.selection || x2.range();

    x.domain(s.map(x2.invert, x2));

    seg2_focus.select(".axis--x").call(x_Axis);
    seg2_focus.select(".barea").attr("d", area_);
    chart2.select(".zoom").call(zoom.transform, d3.zoomIdentity
        .scale(width / (s[1] - s[0]))
        .translate(-s[0], 0));
}

function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;
    var t = d3.event.transform;

    x.domain(t.rescaleX(x2).domain());
    seg2_focus.select(".axis--x").call(x_Axis);
    seg2_focus.select(".barea").attr("d", area_);
    seg2_ontext.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}
