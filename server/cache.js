'use strict'

let LRU = require('lru-cache');
let debug = require('debug')('ecs:cache');
let inherits = require('util').inherits;
let defer = require('co-defer');
let Emitter = require('events');
let co = require('co');
let ms = require('ms');

module.exports = Cache;

/**
 * Cache constructor
 *
 * @param {ECS} ecs  ecs client
 */

function Cache(ecs){
  Emitter.call(this);
  this.taskDefs = LRU({
    max: 1000000,
    maxAge: ms('1d'),
    length: (val, key) => 1
  });
  this.ecs = ecs;
  this.cache([], [], [], []); // initial state
  this.start();
}

inherits(Cache, Emitter);

/**
 * Starts our cache polling for
 * changes from ECS.
 */

Cache.prototype.start = function(){
  let poll = this.poll.bind(this);
  defer(poll, err => {
    if (err) this.emit('error', err);
  });

  let self = this;
  defer.setInterval(function *(){
    try {
      yield poll();
    } catch (err) {
      self.emit('error', err);
    }
  }, ms('1m'));
};

/**
 * Polls ECS for the most recent cluster
 * definitions.
 */

Cache.prototype.poll = function *(){
  debug('polling ecs...');
  let ecs = this.ecs;

  // retrieve the cluster definitions
  let clusters = yield ecs.clusters();
  clusters = clusters.clusters;
  debug('received %d clusters', Object.keys(clusters).length);

  // from all the clusters, retrieve the services
  let serviceCalls = clusters.map(cluster => {
    return ecs.services(cluster.clusterArn);
  })
  let services = yield Promise.all(serviceCalls);
  services = flatten(services);
  debug('received %d services', services.length);

  // from all the clusters, retrieve the container instances
  let containerCalls = clusters.map(cluster => {
    return ecs.containerInstances(cluster.clusterArn);
  });
  let containerInstances = yield Promise.all(containerCalls);
  containerInstances = flatten(containerInstances);
  debug('received %d containers', containerInstances.length);

  // from all the tasks, get the versions running, then cache the result.
  let taskDefCache = this.taskDefs;
  let taskDefCalls = services.map(service => {
    let taskDef = taskDefCache.get(service.taskDefinition);
    if (taskDef) {
      return Promise.resolve(taskDef);
    }
    return ecs.taskDef(service.taskDefinition).then(taskDef => {
      taskDefCache.set(service.taskDefinition, taskDef);
      return taskDef;
    });
  });
  let taskDefs = yield Promise.all(taskDefCalls);
  services.forEach((service, i) => service.taskDef = taskDefs[i].taskDefinition);
  debug('received %d tasks', services.length);

  // for all clusters, get the tasks running
  let taskCalls = clusters.map(cluster => {
    return ecs.tasksByCluster(cluster.clusterArn)
      .then((tasks) => {
        cluster.tasks = tasks;
        return tasks;
      });
  });
  let tasks = yield Promise.all(taskCalls);
  this.cache(clusters, services, containerInstances, tasks);
};

/**
 * Return the clusters
 */

Cache.prototype.clusters = function(){
  return this._clusters;
}

/**
 * Return the services, optionally filtered by
 * cluster.
 *
 * @param {String} cluster [optional]
 */

Cache.prototype.services = function(cluster){
  if (!cluster) return this._services;
  return this._services.filter(service => {
    return clusterName(service.clusterArn) == cluster;
  });
};

/**
 * Return the containerInstances, optionally filtered by
 * cluster.
 *
 * @param {String} cluster [optional]
 */

Cache.prototype.containerInstances = function(cluster){
  if (!cluster) return this._containerInstances;
  return this._containerInstances.filter(instance => {
    return clusterName(instance.clusterArn) == cluster;
  });
};

/**
 * Sets the existing clusters and services in
 * the cache
 *
 * @param {Array} clusters
 * @param {Array} services
 */

Cache.prototype.cache = function(clusters, services, containerInstances, tasks){
  this._clusters = clusters;
  this._services = services;
  this._containerInstances = containerInstances;
  this._tasks = tasks;
};

/**
 * Flatten our list of lists into a single array.
 */

function flatten(arrays) {
  var output = [];
  arrays.forEach(arr => output = output.concat(arr));
  return output;
}

function clusterName(arn){
  return arn.split('/')[1];
}
