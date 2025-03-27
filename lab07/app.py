from flask import Flask, render_template, request
import time
import pandas as pd
import numpy as np

app = Flask(__name__)
max_steps = 25
datasets = ['blobs', 'circles', 'lines', 'moons', 'uniform']
app.converged = False

@app.route('/')
def index():
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
    # determine label from distance to centroids (compute distance of pt to all centroids and take min)
    # assign pt to closest centroid!
    app.labels = None # TODO: calculate labels from centroids

def step():
    n_clusters = request_data['n_clusters']
    dataset = request_data['dataset']
    df = pd.read_csv(dataset)

    if not app.converged:
        if app.step == -1:
            # Randomly select n_clusters # of rows 
            rows = df.sample(n=n_clusters)
            app.centroids = rows[['x', 'y']].tolist() # TODO: initialize centroids
        else:
            app.step_centroids[app.step] = app.centroids.copy()
            app.centroids = None # TODO: calculate centroids from labels
            app.converged = None # TODO: check if k-means has converged
        set_labels()
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