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
    // Remove old axes if they exist
    svg.selectAll(".x-axis").remove();
    svg.selectAll(".y-axis").remove();
    
    // Create x-axis
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + height + ")") 
      .call(d3.axisBottom(x)); 

    // Create y-axis
    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));
}

// TODO: plot data and centroids, and display the current step number
function update_vis(data, centroids, step_num){
  svg.selectAll("circle").remove()// Select all circles (both points and centroids) to clear previous points
//   svg.selectAll("centroid").remove()
  // Plot points and color based on label
  svg.append("g")
        .selectAll("dot")
        .data(data)
        .join('circle')
        .attr("cx", function(d) { return x(d.x); }) 
        .attr("cy", function(d) { return y(d.y); })  
        .attr("r", 4) 
        .attr("stroke", "#3b3b3b") 
        .attr("stroke-width", 1) 
        .style("fill", function(d) { return color(d.label); });

  // Plot centroids
  svg.append("g")
        .selectAll("centroid")
        .data(centroids)
        .join('circle')
        .attr("cx", function(d) { return x(d.x); }) 
        .attr("cy", function(d) { return y(d.y); }) 
        .attr("r", 10)  // Make larger than normal points
        .attr("stroke", "black") 
        .attr("stroke-width", 2) 
        .style("fill", function(d, i) { return color(i)}); // Color based on index in centroids

  // Update step number in html
  document.getElementById("step").innerText = step_num
}

function init_plot(x_min, x_max, y_min, y_max, n_clusters, data, centroids){
    init_scales(x_min, x_max, y_min, y_max, n_clusters)
    init_axes()
    update_vis(data, centroids, 0)
}

function set_params(){
    var dataset = document.getElementById("dataset").value // TODO: get the selected dataset
    console.log("dataset: ", dataset)
    var n_clusters = document.getElementById("n_clusters").value // TODO: get the selected number of clusters

    // Update cluster input fields to correct number 
    // Get the container for cluster coordinates
    const container = document.getElementById('cluster-coordinates-container');
    
    // Clear any existing input fields
    container.innerHTML = '';

    // Generate input fields for each cluster
    for (let i = 1; i <= n_clusters; i++) {
        const div = document.createElement('div');
        div.classList.add('cluster-input');
        
        const label = document.createElement('span');
        label.textContent = `Cluster ${i}: `;

        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.placeholder = `X`;
        xInput.id = `x${i}`;

        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.placeholder = `Y`;
        yInput.id = `y${i}`;

        // Append the elements to the div
        div.appendChild(label);
        div.appendChild(xInput);
        div.appendChild(yInput);

        // Append the div to the container
        container.appendChild(div);
    }
    
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
        x_min=results.x_min
        x_max=results.x_max
        y_min=results.y_min
        y_max=results.y_max
        n_clusters=results.n_clusters
        dataset=results.data // TODO: get the dataset from results
        centroids=results.centroids
        init_plot(x_min, x_max, y_min, y_max, n_clusters, dataset, centroids)
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

function user_input(){
    var dataset = document.getElementById("dataset").value // TODO: get the selected dataset
    console.log("dataset: ", dataset)
    var n_clusters = document.getElementById("n_clusters").value // TODO: get the selected number of clusters
    var centroid_coords = []

    // Get the coordinates of the centroids as provided by the user
    for (let i = 1; i <= n_clusters; i++) {
        x = parseInt(document.getElementById(`x${i}`).value)
        y = parseInt(document.getElementById(`y${i}`).value)
        centroid_coords.push([x,y])
    }
    console.log("centroid: coords from script.js: ", centroid_coords)

    fetch('/set_params', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({dataset: dataset, n_clusters: n_clusters, centroid_coords: centroid_coords}),
        cache: 'no-cache',
        headers: new Headers({
            'content-type': 'application/json'
        })
    }).then(async function(response){
        var results = JSON.parse(JSON.stringify((await response.json())))
        // TODO: initialize the plot from the results
        x_min=results.x_min
        x_max=results.x_max
        y_min=results.y_min
        y_max=results.y_max
        n_clusters=results.n_clusters
        dataset=results.data // TODO: get the dataset from results
        centroids=results.centroids
        init_plot(x_min, x_max, y_min, y_max, n_clusters, dataset, centroids)
    }) 
}