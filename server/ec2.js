
'use strict'

let Promise = require('bluebird');

module.exports = EC2;

/**
 * Create a new EC2 client.
 *
 * @param {AWS} aws - an aws client
 */

function EC2(aws){
    this.ec2 = new aws.EC2();
}

/** Return a promise to return ec2 instances
 * @public
 *
 * */

EC2.prototype.instances = function(ec2Instances){
    // console.log('here in ec2.js with ecs.containerInstances(%s)', ec2Instances);
    return this.describeInstances(ec2Instances)
        .bind(this);
};

/**
 * Describe instances
 *
 * @private
 * @param {Array} one or more instance IDs
 */

EC2.prototype.describeInstances = function (instances){
    if (!instances || instances.length === 0) {
        return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
        let req = { InstanceIds: instances };
        this.ec2.describeInstances(req, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        })
    });
}