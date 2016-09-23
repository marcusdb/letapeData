// (It's CSV, but GitHub Pages only gzip's JSON at the moment.)
d3.csv("data/letape2016.json", function(error, participants) {

    // Various formatters.
    var formatNumber = d3.format(",d"),
        formatChange = d3.format("+,d"),
        formatDate = d3.time.format("%B %d, %Y"),
        formatTime = d3.time.format("%H:%M:%S");

    // A nest operator, for grouping the participant list.
    var nestByMinute = d3.nest()
        .key(function(d) {
            return Math.floor(d / 1) * 1;
        });

    var convertToMinutes = function convertToMinutes(timeString) {
        var split = timeString.split(':');
        return (+split[0]) * 60 + (+split[1]);
    };

    var convertToFormatedHours = function convertToFormatedHours(minutes) {
        var formatedMinutes = minutes % 60;
        formatedMinutes = formatedMinutes < 10 ? '0' + formatedMinutes : formatedMinutes;
        return '' + Math.floor(minutes / 60) + ':' + formatedMinutes;
    }

    // A little coercion, since the CSV is untyped.
    participants.forEach(function(d, i) {
        d.index = i;
        d.numero = +d.numero;
        d.idade = +d.idade;
        d.tempoTotalM = convertToMinutes(d.tempoTotal);
        d.tempoMontanhaM = convertToMinutes(d.tempoMontanha);
    });

    var maximum = function maximum(data, property) {
        return d3.max(data, function(d) {
            return d[property];
        });
    };
    var minimum = function minimum(data, property) {
        return d3.min(data, function(d) {
            return d[property];
        });
    };

    var tempoMax = maximum(participants, 'tempoTotalM'),
        tempoMin = minimum(participants, 'tempoTotalM'),
        montanhaMax = maximum(participants, 'tempoMontanhaM'),
        montanhaMin = minimum(participants, 'tempoMontanhaM');


    // Create the crossfilter for the relevant dimensions and groups.
    var participant = crossfilter(participants),
        all = participant.groupAll(),
        tempoT = participant.dimension(function(d) {
            return d.tempoTotalM;
        }),
        temposT = tempoT.group(function(d) {
            return Math.floor(d / 2) * 2;
        }),
        montanhaT = participant.dimension(function(d) {
            return d.tempoMontanhaM;
        }),
        montanhasT = montanhaT.group(function(d) {
            return Math.floor(d / 5) * 5;
        }),
        sexo = participant.dimension(function(d) {
            return d.sexo === 'Masculino' ? 1 : 2
        }),
        sexos = sexo.group();
    idade = participant.dimension(function(d) {
            return d.idade;
        }),
        idades = idade.group(function(d) {
            return Math.floor(d / 5) * 5;
        });





    var charts = [
        barChart()
        .dimension(tempoT)
        .group(temposT).xTickFormat(function(d) {
            return convertToFormatedHours(d);
        })
        .x(d3.scale.linear()
            .domain([tempoMin, tempoMax])
            .rangeRound([0, 900])),
        barChart()
        .dimension(montanhaT)
        .group(montanhasT).xTickFormat(function(d) {
            return convertToFormatedHours(d);
        })
        .x(d3.scale.linear()
            .domain([0, 80])
            .rangeRound([0, 350])),
        barChart()
        .dimension(sexo)
        .group(sexos).tickValues([1, 2]).xTickFormat(function(d) {
            return d === 1 ? 'M' : 'F';
        })
        .x(d3.scale.linear().domain([1, 3]).rangeRound([0, 50])),
        barChart()
        .dimension(idade)
        .group(idades)
        .x(d3.scale.linear().domain([10, 70]).rangeRound([0, 350]))

    ];

    


    // Given our array of charts, which we assume are in the same order as the
    // .chart elements in the DOM, bind the charts to the DOM and render them.
    // We also listen to the chart's brush events to update the display.
    var chart = d3.selectAll(".chart")
        .data(charts)
        .each(function(chart) {
            
            chart.x().rangeRound([0, $(this.parentNode).width()]);// adjusting size
            chart.on("brush", renderAll).on("brushend", renderAll);
        });

    // Render the initial lists.
    var list = d3.selectAll(".list").data([participantList]);

    // Render the total.
    d3.selectAll("#total")
        .text(formatNumber(participant.size()));

    renderAll();

    // Renders the specified chart or list.
    function render(method) {
        console.log('render'+this);
        d3.select(this).call(method);
    }

    // Whenever the brush moves, re-rendering everything.
    function renderAll() {
        chart.each(render);
        list.each(render);
        d3.select("#active").text(formatNumber(all.value()));
    }


    window.filter = function(filters) {
        filters.forEach(function(d, i) {
            charts[i].filter(d);
        });
        renderAll();
    };

    window.reset = function(i) {
        charts[i].filter(null);
        renderAll();
    };
    function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

    function participantList(div) {
        var participantsByTime = tempoT.bottom(50);
        div.each(function() {
            var participantByTime = d3.select(this).selectAll(".tempo")
                .data(participantsByTime,function(d){console.log(d.index);return d.index});

            participantByTime.enter().append("div").attr("class", "tempo")
                .text(function(d) {
                    return toTitleCase(d.nome)+' ('+d.tempoTotal+')' ;
                });

            participantByTime.exit().remove();
            participantByTime.order();

           
        });
    }

    function barChart() {
        if (!barChart.id) barChart.id = 0;

        var margin = {
                top: 10,
                right: 10,
                bottom: 20,
                left: 10
            },
            x,
            y = d3.scale.linear().range([100, 0]),
            id = barChart.id++,
            axis = d3.svg.axis().orient("bottom"),
            brush = d3.svg.brush(),
            brushDirty,
            dimension,
            group,
            round;

        function chart(div) {
            var width = x.range()[1],
                height = y.range()[0];

            y.domain([0, group.top(1)[0].value]);

            div.each(function() {
                var div = d3.select(this),
                    g = div.select("g");

                // Create the skeletal chart.
                if (g.empty()) {
                    div.select(".title").append("a")
                        .attr("href", "javascript:reset(" + id + ")")
                        .attr("class", "reset")
                        .text("Limpar Seleção")
                        .style("display", "none");

                    g = div.append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    g.append("clipPath")
                        .attr("id", "clip-" + id)
                        .append("rect")
                        .attr("width", width)
                        .attr("height", height);

                    g.selectAll(".bar")
                        .data(["background", "foreground"])
                        .enter().append("path")
                        .attr("class", function(d) {
                            return d + " bar";
                        })
                        .datum(group.all());

                    g.selectAll(".foreground.bar")
                        .attr("clip-path", "url(#clip-" + id + ")");

                    g.append("g")
                        .attr("class", "axis")
                        .attr("transform", "translate(0," + height + ")")
                        .call(axis);

                    // Initialize the brush component with pretty resize handles.
                    var gBrush = g.append("g").attr("class", "brush").call(brush);
                    gBrush.selectAll("rect").attr("height", height);
                    gBrush.selectAll(".resize").append("path").attr("d", resizePath);
                }

                // Only redraw the brush if set externally.
                if (brushDirty) {
                    brushDirty = false;
                    g.selectAll(".brush").call(brush);
                    div.select(".title a").style("display", brush.empty() ? "none" : null);
                    if (brush.empty()) {
                        g.selectAll("#clip-" + id + " rect")
                            .attr("x", 0)
                            .attr("width", width);
                    } else {
                        var extent = brush.extent();
                        g.selectAll("#clip-" + id + " rect")
                            .attr("x", x(extent[0]))
                            .attr("width", x(extent[1]) - x(extent[0]));
                    }
                }

                g.selectAll(".bar").attr("d", barPath);
            });

            function barPath(groups) {
                var path = [],
                    i = -1,
                    n = groups.length,
                    d;
                while (++i < n) {
                    d = groups[i];
                    path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
                }
                return path.join("");
            }

            function resizePath(d) {
                var e = +(d == "e"),
                    x = e ? 1 : -1,
                    y = height / 3;
                return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) + "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
            }
        }

        brush.on("brushstart.chart", function() {
            var div = d3.select(this.parentNode.parentNode.parentNode);
            div.select(".title a").style("display", null);
        });

        brush.on("brush.chart", function() {
            var g = d3.select(this.parentNode),
                extent = brush.extent();
            if (round) g.select(".brush")
                .call(brush.extent(extent = extent.map(round)))
                .selectAll(".resize")
                .style("display", null);
            g.select("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
            
            dimension.filterRange(extent);
        });

        brush.on("brushend.chart", function() {
            if (brush.empty()) {
                var div = d3.select(this.parentNode.parentNode.parentNode);
                div.select(".title a").style("display", "none");
                div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
                dimension.filterAll();
            }
        });



        chart.tickValues = function(_) {
            axis.tickValues(_);
            return chart;
        };
        chart.xTickFormat = function(_) {
            axis.tickFormat(_);
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin = _;
            return chart;
        };

        chart.x = function(_) {
            if (!arguments.length) return x;
            x = _;
            axis.scale(x);
            brush.x(x);
            return chart;
        };

        chart.y = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };

        chart.dimension = function(_) {
            if (!arguments.length) return dimension;
            dimension = _;
            return chart;
        };

        chart.filter = function(_) {
            if (_) {
                brush.extent(_);
                dimension.filterRange(_);
            } else {
                brush.clear();
                dimension.filterAll();
            }
            brushDirty = true;
            return chart;
        };

        chart.group = function(_) {
            if (!arguments.length) return group;
            group = _;
            return chart;
        };

        chart.round = function(_) {
            if (!arguments.length) return round;
            round = _;
            return chart;
        };

        return d3.rebind(chart, brush, "on");
    }
});