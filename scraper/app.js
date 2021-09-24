const async = require('async');
const request = require('request');
const csv = require('csv-parser');
const fs = require('fs');
var http = require('follow-redirects').http;
const https = require('https'); 
const { getSystemErrorMap } = require('util');

var entries = [];

function setup() {
  var dir = './data';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }
}

function readGuidesCSV () {
  fs.createReadStream('guides.csv')
    .pipe(csv())
    .on('data', (row) => {
        entries.push(row);
    })
    .on('end', () => {
      entries.forEach(function (drug, index) {
        setTimeout(function () {
          processDrug(drug)
        }, index * 250);
      });
    });
}

function processPDF(response, url, drug) {
  var filename = url.substring(url.lastIndexOf('/')+1);
  response.pipe(fs.createWriteStream('./data/' + filename));
}

function processDrug(drug) {
      console.log(drug["Drug Name"])
      console.log(drug);
      var url = drug["Link"];
      if (url.startsWith("https")) {
        https.get(url, resp => processPDF(resp, url, drug));
      } else {
        console.log(url);
        http.get(url, resp => processPDF(resp, url, drug));
      }
}

setup();
readGuidesCSV();