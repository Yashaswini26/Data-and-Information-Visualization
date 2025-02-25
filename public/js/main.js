const index_grp = [
    { label: "Dystopia + residual", value: "Dystopia + residual" },
    { label: "Freedom to make life choices", value: "Explained by: Freedom to make life choices" },
    { label: "Log GDP per capita", value: "Explained by: Log GDP per capita" },
    { label: "Generosity", value: "Explained by: Generosity" },
    { label: "Healthy life expectancy", value: "Explained by: Healthy life expectancy" },
    { label: "Perceptions of corruption", value: "Explained by: Perceptions of corruption" },
    { label: "Social support", value: "Explained by: Social support" },
]
var totalCout = 0
var totalValuation = 0;

Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("../data/WHR2024.csv"),
])
    .then(function (result) {
        console.log("Yashu initial result", result[1])
        totalCout = result[1].length;
        result[1].map((d) => {
            totalValuation += parseFloat(d['Ladder score'])
        })
        drawConnectedScatter(result[1])
        drawWorldMap(result[0], result[1])
        drawGroupedChart(result[1])
        drawBubbleChart(result[1])
    })

function drawConnectedScatter(data) {
    const margin = { top: 10, right: 100, bottom: 30, left: 30 },
        width = 1200 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;
    const svg = d3.select("#happiness_by_index")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    d3.select("#selection").selectAll('ownOptions')
        .data(index_grp).enter()
        .append('option')
        .text(d => d.label)
        .attr("value", d => d.value)
    d3.select("#selection").on("change", function (event, d) {
        let selectedOption = d3.select(this).property("value")
        update(selectedOption)
    })
    var rMax = d3.max(data, (d) => { return d['Ladder score'] })
    var r = d3.scaleLinear().domain([0, rMax]).range([0, rMax]);
    var xMax = d3.max(data, (d) => { return Math.round(d['Ladder score']) })
    var xMin = d3.min(data, (d) => { return d['Ladder score'] })
    data.sort(function (a, b) {
        return b['Ladder score'] - a['Ladder score'];
    });
    var data_max = []
    data_max.push(data[0])
    var x = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, width]);
    let color_variable = []
    data.map((d) => {
        color_variable.push(d['Country name'])
    })
    var myColor = d3.scaleOrdinal()
        .domain(color_variable)
        .range(["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666"]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("Ladder score");
    var yMax = d3.max(data, (d) => {
        return d[index_grp[0].value]
    })
    var y = d3.scaleLinear()
        .domain([0, yMax])
        .range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));
    const path = svg
        .append('g')
        .append("path")
        .datum(data)
        .attr("d", d3.line()
            .x(d => x(+d['Ladder score']))
            .y(d => y(+d[index_grp[0].value]))
        )
        .attr("stroke", "#DE3163")
        .style("stroke-width", 2)
        .style("fill", "none")
    const line = svg
        .selectAll("myline")
        .data(data_max)
        .enter()
        .append("line")
        .attr("x1", function (d) { return x(+d['Ladder score']); })
        .attr("x2", xMin)
        .attr("y1", function (d) { return y(+d[index_grp[0].value]); })
        .attr("y2", function (d) { return y(+d[index_grp[0].value]); })
        .attr("stroke", "#e41a1c")
    const text = svg
        // .selectAll("mytext")
        .datum(index_grp[0].value)
        .append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(d => setText(d));
    
    // Initialize dots with group a
    const dot = svg
        .selectAll('circle')
        .data(data)
        .join('circle')
        .attr("cx", d => x(+d['Ladder score']))
        .attr("cy", d => y(+d[index_grp[0].value]))
        .attr("r", function (d) { return r(d['Ladder score']) })
        .style("fill", function (d) { return myColor(d['Country name']) })

    function setText(d) {
        // console.log(d)
        const result = index_grp.find(({ value }) => value === d);
        return result.label
    }
    function update(selectedOption) {
        var yMax = d3.max(data, (d) => { return d[selectedOption] })
        var y = d3.scaleLinear().domain([0, yMax]).range([height, 0]);
        text.datum(selectedOption).text(d => setText(d));
        path
            .datum(data)
            .transition()
            .duration(1000)
            .attr("d", d3.line()
                .x(d => x(+d['Ladder score']))
                .y(d => y(+d[selectedOption]))
            )
        dot
            .data(data)
            .transition()
            .duration(1000)
            .attr("cx", d => x(+d['Ladder score']))
            .attr("cy", d => y(+d[selectedOption]))
        line
            .transition()
            .duration(1000)
            .attr("y1", function (d) { return y(+d[selectedOption]); })
            .attr("y2", function (d) { return y(+d[selectedOption]); })
    }
}
function drawWorldMap(topo, data) {
    const margin = { top: 10, right: 30, bottom: 30, left: 30 },
        width = 1200 - margin.left - margin.right,
        height = 900 - margin.top - margin.bottom;
    const projection = d3.geoMercator().scale(180).center([0, 0])
        .translate([width / 2, height / 2 + 150]);
    let _map = new Map()
    // const colorScale = d3.scalePow().domain([0, 7]).range(["#999999", "#400000"]);
    var xMax = Math.ceil(d3.max(data, (d) => {
        return d['Ladder score']
    }))
    var xMin = Math.floor(d3.min(data, (d) => {
        return d['Ladder score']
    }))
    // const colorScale = d3.scaleLinear().domain([xMin, xMax]).range(["#ffffff", "#050095"]);
    const colorScale = d3.scaleLinear().domain([xMin, xMax]).range(["#ffffff", "red"]);


    var geoStat = d3.select("#geoStat")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")
    const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
    let mouseOver = function (d, i) {
        d3.select(this).transition().duration(200).style("opacity", 1).style("stroke", "red").style("stroke-width", 8)

        let map_country = i.properties.name
        let rank_country = _map.get(i.properties.name)
        console.log("tooltip data result : ", map_country, rank_country);
        if (map_country && rank_country) {
            tooltip.html("Country: " + i.properties.name + '<br>'
                + "Ladder score: " + rank_country[0] + '<br>'
                + "Rank: " + rank_country[1] + '<br>'
                + index_grp[0].label + ": " + rank_country[2] + '<br>'
                + index_grp[1].label + ": " + rank_country[3] + '<br>'
                + index_grp[2].label + ": " + rank_country[4] + '<br>'
                + index_grp[3].label + ": " + rank_country[5] + '<br>'
                + index_grp[4].label + ": " + rank_country[6] + '<br>'
                + index_grp[5].label + ": " + rank_country[7] + '<br>'
                + index_grp[6].label + ": " + rank_country[8] + '<br>'


                // + "Rank: " + rank_country[1] + '<br>'

            )
                .style("left", (d.pageX + 15) + "px").style("top", (d.pageY - 28) + "px")
                .transition().duration(400).style("opacity", 1)
        } else {
            tooltip.html("Country: " + i.properties.name + '<br>'
                + "No Data")
                .style("left", (d.pageX + 15) + "px").style("top", (d.pageY - 28) + "px")
                .transition().duration(400).style("opacity", 1)
        }
    }
    let mouseLeave = function (d) {
        d3.select(this).transition().duration(200).style("stroke", "transparent")
        tooltip.transition().duration(300).style("opacity", 0);
    }
    let mouseMove = function (d) {
        tooltip.style("left", (d.pageX + 15) + "px").style("top", (d.pageY - 28) + "px")

    }
    data.map((u) => {
        console.log("Map data : ", u);
        _map.set(u['Country name'],
            // [+u['Happiness score'],
            [+u['Ladder score'],
            +u['RANK'],
            +u[index_grp[0].value],
            +u[index_grp[1].value],
            +u[index_grp[2].value],
            +u[index_grp[3].value],
            +u[index_grp[4].value],
            +u[index_grp[5].value],
            +u[index_grp[6].value],
            ])
    })
    console.log("Final map value is : ", _map);
    geoStat.append("g")
        .selectAll("path")
        .data(topo.features)
        .join("path")
        // draw each country
        .attr("d", d3.geoPath()
            .projection(projection)
        )

        // set the color of each country
        .attr("fill", function (d) {
            d.total = _map.get(d.properties.name) ? _map.get(d.properties.name)[0] : 0;
            console.log("total value is : ", d.total);
            return colorScale(d.total);
            // return "red";

        })
        .on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave)
        .on("mousemove", mouseMove)




    const legend = geoStat.append('g')
        .attr('id', 'legend')
        .attr('transform', `translate(${width - 250}, 80)`);
    // legend.selectAll('rect')
    legend
        .append('rect')
        .attr('fill', "red")
        .attr('width', 15)
        .attr('height', 15)
        .attr('x', 85);
    legend.append('text').text("Happiest").attr('x', 120).attr('y', 12);
    legend.append('rect').attr('fill', "#ffffff").attr('width', 15).attr('height', 15).attr('x', 85).attr('y', 20);
    legend.append('text').text("Saddest or No Data").attr('x', 120).attr('y', 32);
}



function drawGroupedChart(data) {
    // console.log(totalCout)
    // console.log(totalValuation)
    const tooltip = d3.select("body").append("div").attr("class", "tooltip_2").style("opacity", 0);
    let mouseOver = function (d, i) {
        console.log(i)
        d3.select(this).transition().duration(200).style("opacity", 1).style("stroke", "black")
        tooltip.html("Score Range: " + i.label + '<br>'
        )
            .style("left", (d.pageX - 100) + "px").style("top", (d.pageY - 120) + "px")
            .transition().duration(400).style("opacity", 1)

    }

    let mouseLeave = function (d) {
        d3.select(this).transition().duration(200).style("stroke", "transparent")
        tooltip.transition().duration(300).style("opacity", 0);
    }
    let mouseMove = function (d) {
        tooltip.style("left", (d.pageX - 100) + "px").style("top", (d.pageY - 120) + "px")
    }



    var margin = { top: 40, right: 30, bottom: 120, left: 80 },
        width = 1200 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var svg = d3.select("#rankStats")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    var rankStats = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    let color_variable = []
    data.map((d) => {
        color_variable.push(d['Country name'])
    })
    var myColor = d3.scaleOrdinal()
        .domain(color_variable)
        .range(d3.schemeSet1);
    var xMax = Math.ceil(d3.max(data, (d) => {
        return d['Ladder score']
    }))
    var xMin = Math.floor(d3.min(data, (d) => {
        return d['Ladder score']
    }))
    var x = d3.scaleLinear()
        .domain([xMin, xMax])
        // .range([ width, 0 ]);
        .range([0, width]);




    var rMax = d3.max(data, (d) => {
        return d['Ladder score']
    })
    var r = d3.scaleLinear()
        .domain([0, rMax])
        .range([0, rMax]);
    var delta = (xMax - xMin) * 2
    var stats_data = []
    for (var i = 0; i < delta; i++) {

        // var label = `${xMax - i * 0.5} ~ ${xMax - ( i + 1) * 0.5 }` 
        var label = `${xMax - (i + 1) * 0.5} to ${xMax - i * 0.5}`

        var k = 0
        var value = 0
        data.map((d) => {
            if ((xMax - i * 0.5) >= d['Ladder score'] && d['Ladder score'] >= (xMax - (i + 1) * 0.5)) {
                k = k + 1
                value += parseFloat(d['Ladder score'])
            }
        })
        var obj = {}
        obj.label = label
        obj.count = k
        obj.value = value
        stats_data.push(obj)
    }

    rankStats.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + 65)
        .text("Ladder score Range");
    var x = d3.scaleBand()
        // .range([ 0, width ])
        .range([width, 0])
        .domain(stats_data.map(function (k) {
            // console.log(Object.keys(k)[0])
            return k.label;
        }))
        .padding(0.1);
    rankStats.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(0,0)")
        .style("text-anchor", "middle")
        .style("font-size", 14);
    var yMax = d3.max(stats_data, (d) => {
        // console.o
        return d.count
    })
    // console.log(stats_data)
    var countMax = d3.max(stats_data, (d) => {
        return d.count
    })
    var countColorScale = d3.scaleLinear().range(['#FF0000', '#8B0000']).domain([0, countMax]);
    var y = d3.scaleLinear()
        .domain([0, yMax + 5])
        .range([height, 0]);
    rankStats.append("g")
        .call(d3.axisLeft(y));
    rankStats.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("x", margin.left - 15)
        .attr("dy", ".75em")
        .attr("transform", "rotate(0)")
        .text("Count");
    let bars = rankStats.selectAll('.bar')
        .data(stats_data)
        .enter()
        .append("g");
    bars.append('rect')
        .attr('class', 'bar')
        .attr("fill", d => countColorScale(d.count))
        .attr("x", function (d) {
            // console.log(d)
            return x(d.label);
        })
        .attr("y", function (d) { return y(d.count); })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d.count); })
        .on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave)
        .on("mousemove", mouseMove);
    bars.append("text")
        .text(function (d) {
            return `${d.count} Countries`;
        })
        .attr("x", function (d) {
            return x(d.label) + x.bandwidth() / 2;
        })
        .attr("y", function (d) {
            return y(d.count) - 5;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "14px")
        .attr("fill", "black")
        .attr("text-anchor", "middle");




    //#region Pie 
    // const width = 450,
    //     height = 450,
    //     margin = 40;
    // create 2 data_set
    var margin = { top: 40, right: 85, bottom: 30, left: 85 },
        width = 1200 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

    // var pie = d3.pie().value(function(d) {return d[1]; })
    //     .sort(function(a, b) {return d3.descending(a.key, b.key);} )
    var countPercent = {}
    var valuePercent = {}
    stats_data.map((d) => {
        countPercent[d.label] = Math.round((d.count / totalCout) * 10000) / 100
        valuePercent[d.label] = Math.round((d.value / totalValuation) * 10000) / 100
    })


    const data1 = { a: 9, b: 20, c: 30, d: 8, e: 12 }
    const data2 = { a: 6, b: 16, c: 20, d: 14, e: 19, f: 12 }
    d3.select("#pieSelect").on("change", async function (d) {
        var option = d3.select(this).property("value")
        // console.log(option)
        if (option == "Count") {
            update(countPercent)
            //   update(value_pie_data)


        } else {
            // console.log('afsdddddddddddd')

            //   update(number_pie_data)
            update(valuePercent)


        }
    })
    var pie_w = 250
    var pie_m = 20
    var pie_margin = { left: 10, gap: 280, top: 50 }
    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    const radius = pie_w / 2;


    const pie_svg_in = d3.select("#pieChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    var pie_g = pie_svg_in
        .append("g")
        .attr("class", "pie_g")
        // .attr("transform", "translate(" + pie_w / 2 + "," + pie_w / 2 + ")");
        //   .attr("transform", `translate(${pie_w / 2 + pie_margin.left}, ${pie_w / 2 + pie_margin.top})`)
        .attr("transform", `translate(${width / 2.5}, ${pie_w / 2 + pie_margin.top})`)



    // set the color scale
    const color = d3.scaleOrdinal()
        .domain(["a", "b", "c", "d", "e", "f"])
        .range(["#d7e1ee", "#cbd6e4", "#bfcbdb", "#b3bfd1", "#a4a2a8", "#df8879", "#c86558", "#b04238", "#991f17"]);
    // A function that create / update the plot for a given variable:
    function update(data) {
        pie_g.selectAll("text")
            .remove()
        // Compute the position of each group on the pie:
        const pie = d3.pie()
            .value(function (d) { return d[1]; })
            .sort(function (a, b) { return d3.ascending(a.key, b.key); }) // This make sure that group order remains the same in the pie chart
        const data_ready = pie(Object.entries(data))

        // map to data
        const u = pie_g.selectAll("path")
            .data(data_ready)

        // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
        u
            .join('path')
            .transition()
            .duration(1000)
            .attr('d', d3.arc()
                .innerRadius(0)
                .outerRadius(radius)
            )
            .attr('fill', function (d) { return (color(d.data[0])) })
            .attr("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", 1)
        console.log('e')
        console.log(data_ready)
        const t = pie_g.selectAll("text")
            .data(data_ready)
        t
            .enter()
            .append('text')
            .text(function (d) { return d.data[0] + " : " + + Math.round(d.data[1] * 100) / 100 + "%" })
            .attr("transform", function (d, i) { return "translate(" + (420 - 125 + 100) + "," + (25 * i - 130) + ")rotate(-0)"; })
            .style("text-anchor", "middle")
            .style("font-size", 20)
        var rt = pie_g.selectAll("rect")
            .data(data_ready)
        rt
            .enter()
            .append('rect')
            .attr("width", 25)
            .attr("height", 25)
            .attr("transform", function (d, i) { return "translate(" + (420 - 250 + 100) + "," + (25 * i - 150) + ")rotate(-0)"; })
            .attr('fill', function (d) { return (color(d.data[0])) })

    }

    // Initialize the plot with the first dataset
    update(countPercent)

}
function drawBubbleChart(data) {
    const margin = { top: 50, right: 100, bottom: 30, left: 100 },
        width = 1200 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;
    const svg = d3.select("#bubbleChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    var myColor = d3.scaleOrdinal()
        .range(d3.schemeDark2);

    var legend = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    var rMax = d3.max(data, (d) => { return parseFloat(d['Ladder score']) })
    var r = d3.scaleLinear().domain([0, rMax]).range([0, rMax]);
    var xMax = d3.max(data, (d) => { return d['Explained by: Generosity'] })
    var xMin = d3.min(data, (d) => { return d['Explained by: Generosity'] })

    var x = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, width]);

    legend.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));
    legend.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("Generosity");
    var yMax = d3.max(data, (d) => {
        return d['Explained by: Healthy life expectancy']
    })
    var y = d3.scaleLinear()
        .domain([0, yMax])
        .range([height, 0]);

    legend.append("g").call(d3.axisLeft(y));
    legend
        .append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", -50)
        // .attr("x", -50)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text('Healthy life expectancy');
    // Initialize dots with group a
    console.log(rMax)
    const dot = legend
        .selectAll('#myBubbles')
        .data(data)
        .join('circle')
        .attr("id", "myBubbles")
        .attr("cx", d => x(+d['Explained by: Generosity']))
        .attr("cy", d => y(+d['Explained by: Healthy life expectancy']))
        .attr("r", function (d) {
            // console.log(d['Explained by: Generosity'])
            return r(d['Ladder score'])
        })
        .style("fill", function (d) { return myColor(d['Country name']) })



    d3.select("#vol").on("input", updateGraph)
    legend.append("text").text("Ladder Score : < " + 0).attr("class", "mytext")
        .attr("transform", "translate(" + (width / 2 - 125) + "," + (-25) + ")")
    function updateGraph() {
        legend.selectAll(".mytext").remove()
        legend.append("text").text("Ladder Score : < " + this.value).attr("class", "mytext")
            .attr("transform", "translate(" + (width / 2 - 125) + "," + (-25) + ")")

        let value = this.value

        console.log(value)
        dot

            .style("fill", d => resetColor(d))

        function resetColor(d) {
            if (d['Ladder score'] < value) {

                return "red"
            } else {
                return myColor(d['Country name'])
            }
        }
    }
}
