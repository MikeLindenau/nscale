#!/usr/bin/env node
/*
 * release script for nscale
 */
/*
 * usage:
 * use changessh to determine changed modules
 * comment out modules that you do not want to release from the toProcess array below
 *
 * Run the script from a directory that contains all of the nscale modules checked out
 *
 * the script will modify package.json and dependent package.jsons
 *
 * you will still need to publish manually
 */ 

'use strict';

var versionNo = '0.10.0';
var pre = '-pre.1';

var fs = require('fs');
var _ = require('lodash');


var toProcess = [
  'aws-ami-container',
  'aws-elb-container',
  'aws-sg-container',
//  'blank-container',
  'docker-container',
//  'docker-registry-container',
  'nscale-api',
  'nscale-aws-analyzer',
  'nscale-client',
  'nscale-compiler',
  'nscale-direct-analyzer',
  'nscale-docker-analyzer',
  'nscale-docker-ssh-analyzer',
  'nscale-kernel',
  'nscale-local-analyzer',
//  'nscale-noauth',
//  'nscale-planner',
//  'nscale-protocol',
//  'nscale-sdk',
  'nscale-util',
  'nscale-web',
  'nscale'
//  'process-container'
  ];

var applyPre = [
  'nscale-kernel',
  'nscale'];



var loadDeps = function(cb) {
  var deps = {};
  fs.readdir(__dirname, function (err, list) {
    if (err) { return cb(err); }

    list.forEach(function(entry) {
      var stat = fs.statSync(entry);
      if (stat.isDirectory()) {
        if (fs.existsSync(entry + '/package.json')) {
          var pkg = _.cloneDeep(require(__dirname + '/' + entry + '/package.json'));
          if (_.find(toProcess, function(proc) { return proc === entry; })) {
            deps[entry] = pkg.dependencies;
          }
        }
      }
    });
    cb(null, deps);
  });
};



var pruneDeps = function(deps) {
  var keys = _.keys(deps);
  _.each(_.keys(deps), function(key) {
    var dropList = [];
    _.each(_.keys(deps[key]), function(item) {
      if (!_.find(keys, function(key) { return item === key; })) {
        dropList.push(item);
      }
    });
    _.each(dropList, function(drop) {
      delete deps[key][drop];
    });
  });
  return deps;
};



var bumpCommitPublish = function(deps) {
  _.each(_.keys(deps), function(dep) {
    var pkg = _.cloneDeep(require(__dirname + '/' + dep + '/package.json'));
    if (!_.find(applyPre, function(ap) { return ap === dep; })) {
      pkg.version = versionNo;
    }
    else {
      pkg.version = versionNo + pre;
    }

    var myDeps = _.keys(deps[dep]);
    _.each(myDeps, function(myDep) {
      if (_.find(_.keys(deps), function(dep) { return dep === myDep; })) {
        if (!_.find(applyPre, function(ap) { return ap === myDep; })) {
          //myDeps[myDep] = '~' + versionNo;
          pkg.dependencies[myDep] = '~' + versionNo;
        }
        else {
          //myDeps[myDep] = '~' + versionNo + pre;
          pkg.dependencies[myDep] = '~' + versionNo + pre;
        }
      }
    });
    fs.writeFileSync(__dirname + '/' + dep + '/package.json', JSON.stringify(pkg, null, 2), 'utf8');
  });
};


loadDeps(function(err, deps) { 
  deps = pruneDeps(deps);
  console.log(JSON.stringify(deps, null, 2));
  bumpCommitPublish(deps);
});



