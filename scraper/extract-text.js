
const async = require('async');
const request = require('request');
const csv = require('csv-parser');
const fs = require('fs');
var http = require('follow-redirects').http;
const https = require('https'); 
const { getSystemErrorMap } = require('util');
var path = require('path')
var extract = require('pdf-text-extract')

var entries = [];

var chapters = [];

{
    var chapter = {};
    chapter.key = "important-information";
    chapter.identifier = ["What is the most important information"];
    chapter.endMark = "?";
    chapters.push(chapter);
}
{
    var chapter = {};
    chapter.key = "what-is";
    chapter.identifier = ["What is ##PRODUCT_NAME##"];
    chapter.endMarks = "?";
    chapters.push(chapter);
}

{
    var chapter = {};
    chapter.key = "avoid-during-threatmenet";
    chapter.identifer = ["What should be avoided during treatment with"];
    chapter.endMarks = "?";
    chapters.push(chapter);
}

{
    var chapter = {};
    chapter.key = "other-medicine";
    chapter.identifier = ["Can ##PRODUCT_NAME## be taken with other medicines"];
    chapter.endMark = "?"
    chapters.push(chapter);
}

{
    var chapter = {};
    chapter.key = "do-not-take";
    chapter.identifier = ["Do not take ##PRODUCT_NAME## if you or your child are", "Do not use ##PRODUCT_NAME## if you", "Who should not take"];
    chapter.endMark = ":";
    chapters.push(chapter);
}

{
    var chapter = {};
    chapter.key = "healthcare-provider";
    chapter.identifier = ["Before you receive ##PRODUCT_NAME##, tell your healthcare provider"];
    cahtper.endMark = ":";
    chapters.push(chapter);
}


{
    var chapter = {};
    chapter.key = "administration";
    chapter.identifier = ["How will I receive", "How should ##PRODUCT_NAME## be taken"];
    cahtper.endMark = "?";
    chapters.push(chapter);
}


{
    var chapter = {};
    chapter.key = "side-effects";
    chapter.identifier = "What are the possible side effects";
    chapter.endMark = "?";
    chapters.push(chapter);
}

{
    var chapter = {};
    chapter.key = "storage";
    chapter.identifier = ["How should I store"];
    chapter.endMark = "?";
    chapters.push(chapter);
}

{
    var chapter = {};
    chapter.key = "general-information";
    chapter.identifier = ["General information about the safe and effective use of", "General information about ##PRODUCT_NAME##"];
    chapter.endMark = ".";
    chapters.push(chapter);
}

{
    var chapter = {};
    chapter.key = "ingredients";
    chapter.identifier = ["What are the ingredients"];
    chapter.endMark = "?";
    chapters.push(chapter);
}


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

function processDrug(drug) {
    var url = drug["Link"];
    var filename = "data/" + url.substring(url.lastIndexOf('/')+1);
    extract(filename, function (err, pages) {
        console.log(filename);

        if (err) {
            console.dir(err)
            return
        }

        var startPage = 0;

        if (url.includes("#page=")) {
            startPage = url.split("#page=") [1] * 1 - 1;
        }

        pagesSliced = pages.splice(startPage, pages.length);

        console.log(pagesSliced);
    })
}

setup();
readGuidesCSV();