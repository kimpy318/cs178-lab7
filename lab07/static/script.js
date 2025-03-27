function scatterplot(data, r, stroke, stroke_weight){
    svg.append("g")
        .selectAll("dot")
        .data(data).join('circle')
        .attr("cx", function(d) {return x(d.x)})
        .attr("cy", function(d) {return y(d.y)})
        .attr("r", r)
        .attr("stroke", stroke)
        .attr("stroke-weight", stroke_weight)
        .style("fill", function(d) {return color(d.label)})
}

function init_scales(x_min, x_max, y_min, y_max, n_clusters){
    x = d3.scaleLinear()
          .domain([x_min, x_max])
          .range([0, width]) // TODO: set x scale from min/max (hint: d3.scaleLinear()...)
    y = d3.scaleLinear()
          .domain([y_min, y_max]) // TODO: set y scale from min/max (hint: d3.scaleLinear()...)
          .range([height, 0])
    color = d3.scaleOrdinal(d3.schemeCategory10) // Assigns colors based on cluster labels
               .domain(d3.range(n_clusters)); // TODO: set color scale from n_clusters (hint: d3.scaleOrdinal()...)
}

// TODO: create x and y axes
function init_axes(){
}

// TODO: plot data and centroids, and display the current step number
function update_vis(data, centroids, step_num){
}

function init_plot(x_min, x_max, y_min, y_max, n_clusters, data, centroids){
    init_scales(x_min, x_max, y_min, y_max, n_clusters)
    init_axes()
    update_vis(data, centroids, 0)
}

function set_params(){
    var dataset = document.getElementById('dataset').value // TODO: get the selected dataset
    var n_clusters = document.getElementByID('n_clusters').value // TODO: get the selected number of clusters
    fetch('/set_params', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({dataset: dataset, n_clusters: n_clusters}),
        cache: 'no-cache',
        headers: new Headers({
            'content-type': 'application/json'
        })
    }).then(async function(response){
        var results = JSON.parse(JSON.stringify((await response.json())))
        // TODO: initialize the plot from the results
        console.log(results)
        // x_min = 
        // x_max = 
        // y_min = 
        // x_max = 
       // init_plot(x_min, x_max, y_min, y_max, n_clusters, dataset, centroids)
        // init_plot(...)
    })
}

function step(){
    fetch('/step', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-cache',
        body: JSON.stringify({wait: null}),
        headers: new Headers({
            'content-type': 'application/json'
        })
    }).then(async function(response){
        var results = JSON.parse(JSON.stringify((await response.json())))
        if (!results['converged']){
            update_vis(results['data'], results['centroids'], results['step'])
        }
    })
}

function back(){
    fetch('/back', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-cache',
        headers: new Headers({
            'content-type': 'application/json'
        })
    }).then(async function(response){
        var results = JSON.parse(JSON.stringify((await response.json())))
        update_vis(results['data'], results['centroids'], results['step'])
    })
}

function run(){
    fetch('/step', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-cache',
        body: JSON.stringify({wait: 1}),
        headers: new Headers({
            'content-type': 'application/json'
        })
    }).then(async function(response){
        var results = JSON.parse(JSON.stringify((await response.json())))
        var step_num = results['step']
        update_vis(results['data'], results['centroids'], step_num)
        if (!results['converged'] & step_num<max_steps){
            run()
        }
    })
}