'use strict'

let logger = require('koa-logger');
let route = require('koa-route');
let send = require('koa-send');
let Cache = require('./cache');
let AWS = require('aws-sdk');
let cors = require('kcors');
let path = require('path');
let ECS = require('./ecs');
let EC2 = require('./ec2');
let koa = require('koa');
let serve = require('koa-static');

/**
 * Create our app
 */

let app = koa();
let ecs = new ECS(AWS);
let ec2 = new EC2(AWS, ecs);
let cache = new Cache(ecs, ec2);

/**
 * Set a cache error handler
 */

cache.on('error', err => console.log('cache error:', err.stack));

/**
 * Export the app
 */

module.exports = app;

/**
 * Add in a logger
 */

app.use(logger());

/**
 * Setup an error handler.
 */

app.use(function* (next) {
  try {
    yield next;
  } catch (err) {
    console.log('error:', err.stack);
  }
});

/**
 * Add our CORS handler.
 */

app.use(cors());

/**
 * Create our state.
 */

app.use(function* (next) {
  this.cache = cache;
  this.ecs = ecs;
  this.ec2 = ec2;
  yield next;
});

/**
 * Set our routes.
 */

app.use(route.get('/api/clusters', list));
app.use(route.get('/api/clusters/:cluster', servicesAndContainerInstances));
app.use(route.get('/api/clusters/:cluster/services', services));
app.use(route.get('/api/clusters/:cluster/containerInstances', containerInstances));
app.use(route.get('/api/clusters/:cluster/task/:task', task));
app.use(route.get('/api/aws-config', awsConfig));

/**
 * Static routes.
 */

app.use(route.get('/bundle.js', bundle));
app.use(route.get('/bundle.js.map', sourcemap));
app.use(route.get('/bundle.css', stylesheet));
app.use(route.get('/bundle.css.map', stylesheetMap));
app.use(route.get('/*', index));

/**
 * Transfer the index page
 */

function* index() {
  yield send(this, 'build/index.html');
}

/**
 * Transfer js bundle
 */

function* bundle() {
  yield send(this, 'build/bundle.js');
}

/**
 * Transfer the bundle sourcemap.
 */

function* sourcemap() {
  yield send(this, 'build/bundle.js.map');
}

/**
 * Transfer stylesheet
 */

function* stylesheet() {
  yield send(this, 'build/bundle.css');
}

/**
 * Transfer stylesheet sourcemap
 */

function* stylesheetMap() {
  yield send(this, 'build/bundle.css.map');
}

/**
 * Return AWS details
 */

function* awsConfig() {
  const config = this.ecs.ecs.config;
  this.body = {
    region: config.region,
  };
}

/**
 * Return a json array of all the clusters
 */

function* list() {
  let cache = this.cache;
  let clusters = cache.clusters();
  this.body = clusters;
}

/**
 * Returns a json array of services and container
 * instances fora given cluster inthe path parameter.
 ** @param {String} cluster
 */

function* servicesAndContainerInstances(cluster) {
  let cache = this.cache;
  this.body = {
    services: cache.services(cluster),
    containerInstances: cache.containerInstances(cluster),
  };
}

/**
 * Returns a json array of services for a given cluster
 * in the path parameter.
 *
 * @param {String} cluster
 */

function* services(cluster) {
  let cache = this.cache;
  this.body = cache.services(cluster);
}

/**
 * Returns a json array of container instances for
 * a given cluster in the path parameter.
 *
 * @param {String} cluster
 */

function* containerInstances(cluster) {
  let cache = this.cache;
  this.body = cache.containerInstances(cluster);
}

/**
 * Further describes a task, given the ARN in
 * the path parameter
 *
 * @param {String} taskArn
 */

function* task(taskArn) {
  let ecs = this.state.ecs;
  let task = yield ecs.task(taskArn);
  this.body = task;
}