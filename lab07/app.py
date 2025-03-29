from flask import Flask, render_template, request
import time
import pandas as pd
import numpy as np
import math 

app = Flask(__name__)
max_steps = 25
datasets = ['blobs', 'circles', 'lines', 'moons', 'uniform']
app.converged = False

@app.route('/')
def index():
    print("here!")
    return render_template(
        'index.html', datasets=datasets,
        x_min=app.x_min, x_max=app.x_max, y_min=app.y_min, y_max=app.y_max, n_clusters=app.n_clusters,
        data=app.data.assign(label=app.labels).to_dict('records'), centroids=app.centroids.assign(label=range(app.n_clusters)).to_dict('records'),
        max_steps=max_steps
    )

def set_params(dataset, n_clusters):
    app.step = -1
    app.dataset = dataset
    app.n_clusters = n_clusters
    app.labels = None
    app.centroids = None
    app.data = pd.read_csv(f'{app.dataset}.csv')
    app.x_min = app.data['x'].min()
    app.x_max = app.data['x'].max()
    app.y_min = app.data['y'].min()
    app.y_max = app.data['y'].max()
    app.step_centroids = {}
    app.converged = False
    return step()

@app.route('/set_params', methods=["POST"])
def set_params_():
    request_data = request.get_json()
    return set_params(request_data['dataset'], int(request_data['n_clusters']))

def set_labels():
    if (app.labels == None):
      app.labels = [0] * len(app.data)

    # For each point, determine which centroid is closer
    for i, point in app.data.iterrows():
      # Get distance to each centroid
      min_distance = -1
      label = 0 # The label will be the index of the centroid it is closest to!
      for j, centroid in app.centroids.iterrows():
        d = math.sqrt((centroid['x'] - point['x'])**2 + (centroid['y'] - point['y'])**2)
        if (d < min_distance) or (min_distance == -1):
          min_distance = d
          label = j
      
      # Assign label
      app.labels[i] = label # TODO: calculate labels from centroids

def calculate_centroids():
  # For each group of points, calculate the mean and assign this as the new centroid
  # TODO 

  return None

def step():
    if not app.converged:
        if app.step == -1:
            # Randomly select n_clusters # of rows 
            app.centroids = app.data.sample(n=app.n_clusters).reset_index() # TODO: initialize centroids
            print("Initial Random Centroids:")
            print(app.centroids)
        else:
            app.step_centroids[app.step] = app.centroids.copy()
            app.centroids = calculate_centroids() # TODO: calculate centroids from labels
            app.converged = None # TODO: check if k-means has converged
        set_labels()
        print(app.labels)
        app.step += 1
        res = {
            'x_min': app.x_min, 'x_max': app.x_max, 'y_min': app.y_min, 'y_max': app.y_max,
            'n_clusters': app.n_clusters, 'data': app.data.assign(label=app.labels).to_dict('records'),
            'centroids': app.centroids.assign(label=range(app.n_clusters)).to_dict('records'),
            'step': app.step, 'converged': app.converged
        }
        return res
    else:
        return {'converged': app.converged}

@app.route('/step', methods=["POST"])
def step_wait():
    request_data = request.get_json()
    wait = request_data.get('wait')
    res = step()
    if wait:
        time.sleep(wait)
    return res

@app.route('/back', methods=["POST"])
def back():
    app.step -= 1
    app.converged = False
    app.centroids = None # TODO: get centroids from the previous step    
    set_labels()
    return {
        'x_min': app.x_min, 'x_max': app.x_max, 'y_min': app.y_min, 'y_max': app.y_max,
        'n_clusters': app.n_clusters, 'data': app.data.assign(label=app.labels).to_dict('records'),
        'centroids': app.centroids.assign(label=range(app.n_clusters)).to_dict('records'),
        'step': app.step, 'converged': app.converged
    }

if __name__ == "__main__":
    results = set_params('blobs', 2)
    app.run(debug=True)