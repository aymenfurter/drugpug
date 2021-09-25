
const async = require('async');
const request = require('request');
const csv = require('csv-parser');
const fs = require('fs');
var http = require('follow-redirects').http;
const Fuse = require('fuse.js')
const https = require('https'); 
const { getSystemErrorMap } = require('util');
var path = require('path')
var extract = require('pdf-text-extract')
const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const elasticHost = process.env.ELASTIC_IP;
const { Client } = require('@elastic/elasticsearch')
const elasticClient = new Client({ node: elasticHost })

console.log(elasticHost);

const key = process.env.API_KEY;
const endpoint = 'https://text-analysis-octopus.cognitiveservices.azure.com/'; 

const options = {
  includeScore: true
}

console.log(key);
const client = new TextAnalyticsClient(endpoint,  new AzureKeyCredential(key));


var entries = [];

var chapters = [];

{
    var chapter = {};
    chapter.key = "importantInformation";
    chapter.identifier = ["What is the most important information"];
    chapter.endMark = "?";
    chapters.push(chapter);
}
{
    var chapter = {};
    chapter.key = "whatIs";
    chapter.identifier = ["What is ##PRODUCT_NAME##"];
    chapter.endMarks = "?";
    chapters.push(chapter);
}

{
    var chapter = {};
    chapter.key = "avoidDuringThreatmenet";
    chapter.identifier = ["What should be avoided during treatment with"];
    chapter.endMarks = "?";
    chapters.push(chapter);
}

{
    var chapter = {};
    chapter.key = "otherMedicine";
    chapter.identifier = ["Can ##PRODUCT_NAME## be taken with other medicines"];
    chapter.endMark = "?"
    chapters.push(chapter);
}

{
    var chapter = {};
    chapter.key = "doNotTake";
    chapter.identifier = ["Do not take ##PRODUCT_NAME## if you or your child are", "Do not use ##PRODUCT_NAME## if you", "Who should not take"];
    chapter.endMark = ":";
    chapters.push(chapter);
}

{
    var chapter = {};
    chapter.key = "healthcareProvider";
    chapter.identifier = ["Before you receive ##PRODUCT_NAME##, tell your healthcare provider"];
    chapter.endMark = ":";
    chapters.push(chapter);
}


{
    var chapter = {};
    chapter.key = "administration";
    chapter.identifier = ["How will I receive", "How should ##PRODUCT_NAME## be taken"];
    chapter.endMark = "?";
    chapters.push(chapter);
}


{
    var chapter = {};
    chapter.key = "sideEffects";
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
    chapter.key = "generalInformation";
    chapter.identifier = ["General information about the safe and effective use of ##PRODUCT_NAME##", "General information about ##PRODUCT_NAME##"];
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
          processCSVLine(drug)
        }, index * 2000);
      });
    
    });
}

function nextChapter(text) {
    var identifiedChapter;


    var response = {}
    response.remainingText;
}

function analyzeDrug(drug) {
    var text = drug.text;

    var textLines = text.split(/\r?\n/); 

    var identifiedChapters = [];

    for (let chapter of chapters) {
        const fuse = new Fuse(textLines, options);
        const results = fuse.search(chapter.identifier[0].replace("##PRODUCT_NAME##", drug.name));
        var result = results[0];
        
        if (result && result.score <= 0.75) {
            var identifiedChapter = result;
            identifiedChapter.key = chapter.key;
            identifiedChapters.push(identifiedChapter);
        }
    }

    identifiedChapters.sort(function(a, b) {
        return a.refIndex - b.refIndex;
    });


    var finalElements = [];
    var prevChapter;
    for (let chapter of identifiedChapters) {
        if (prevChapter) {
            var prevChapterText = textLines.slice(prevChapter.refIndex + 1, chapter.refIndex).join();
            prevChapter.text = prevChapterText;
            finalElements.push(prevChapter);
        }

        prevChapter = chapter;

        if (prevChapter.refIndex == identifiedChapters.slice(-1)[0].refIndex) {
            var prevChapterText = textLines.slice(prevChapter.refIndex + 1, textLines.length).join();
            prevChapter.text = prevChapterText;
            finalElements.push(prevChapter);
        }
    }

    executeNER(drug, finalElements);
}

function allowlisted(str, drug) {
    // Product name should not be part of the tag name
    if (str.replace(/\s/g, '').toLowerCase().includes(drug.name.replace(/\s/g, '').toLowerCase())) {
        return false;
    }

    var allowlist = ["medicines", "tablet"];
    allowlist.push(drug.name);
    for (let allowlistEntry of allowlist) {
        if (allowlistEntry.replace(/\s/g, '').toLowerCase() === str.replace(/\s/g, '').toLowerCase()) {
            return false;
        }
    }
    return true;
}

async function executeNER(drug, finalElements) {
    for (let element of finalElements) {
        if (element.text) {
            const entityResults = await client.recognizeEntities( [element.text] );
            for (let document of entityResults) {
                if (document.entities) {
                    processedEntities = {}
                    for (let entity of document.entities) {
                        if (!drug[element.key]) {
                            drug[element.key] = [];
                        }
                        if (!processedEntities[entity.text] &&((entity.category != "PersonType" && entity.category != "Location" && entity.category != "Organization") && entity.confidenceScore >= 0.85)) {
                            if (allowlisted(entity.text, drug)) {
                                processedEntities[entity.text] = true;
                                var tag = {};
                                tag.name = entity.text;
                                tag.category = entity.category;
                                drug[element.key].push(tag);
                            }
                        }

                    }
                }
            };

        }
    }

    ingestData(drug);
}

async function ingestData (drug) {  
    delete drug.text;  


    console.log("Sending ... " + drug.name + " to " + elasticHost);
    console.log(drug);

    var s = drug.name + drug.formRoute + drug.pdf.url;
    const hashCode = s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0)

    await elasticClient.index({
        index: 'leaflets',
        id: hashCode,
        body: drug
    });
}

function processCSVLine(drug) {
    var url = drug["Link"];
    var filename = "data/" + url.substring(url.lastIndexOf('/')+1);
    extract(filename, function (err, pages) {

        if (err) {
            console.dir(err)
            return
        }

        var startPage = 0;

        if (url.includes("#page=")) {
            startPage = url.split("#page=") [1] * 1 - 1;
        }

        pagesSliced = pages.splice(startPage, pages.length);
        var entry = {}
        entry.name = drug["Drug Name"];
        entry.activeIngredient = drug["Active Ingredient"];
        entry.formRoute = drug["Form;Route"];
        //entry.applNo = drug["Appl. No."]; - is always undefined
        entry.company = drug["Company"];
        entry.pdf = {};
        entry.pdf.url = drug["Link"];
        entry.pdf.startPage = startPage;
        entry.date = drug["Date"];
        entry.text = pagesSliced.join();
        analyzeDrug(entry);
    })
}

setup();
elasticClient.indices.delete({
  index: 'aymentest',
}).then(function(resp) {
    readGuidesCSV();
}, function(err) {
  console.trace(err.message);
});