var request = require('request-promise');
var bluebird = require('bluebird');
var _ = require('lodash');
var fs = require('fs')
var readFile = bluebird.promisify(fs.readFile);
var writeFile = bluebird.promisify(fs.writeFile);

readFile('newman-unit-tests.json', 'utf-8')
  .then((newFile) => {
    var inFile = JSON.parse(newFile);
    var fileName = "Rent-A-Ref-Tests.txt";

    return writeFile(fileName, processInFile(inFile));
    //return makeCalls(inFile);
  })
  .catch(error => console.log('Operation Terminated:', error));

var methods = ['post', 'put', 'patch', 'delete'];

function cleanString(string) {
  return String(string)
    .replace('localhost:3000', '')
    .replace('}}', '')
    .replace('{{', ':')
    .trim();
}

var environment = {};

function getEviromentVariable(uri) {
  return uri.replace(/{{[a-z0-9]+}}/ig, function(word) {
    return environment[word];
  });
}

function makeCalls(inFile) {
  var calls = [];
  inFile.item.forEach(function(item) {
    item.item.forEach(function(test) {
      var method = test.request.method;
      var requestObject = {};
      var headers = {};
      var body = test.request.body.urlencoded;
      var uri = getEviromentVariable(test.request.url);
      var ob = {
        json: true
      };

      ob['headers'] = headers;
      ob["body"] = requestObject;
      ob['method'] = method.toUpperCase();
      ob['uri'] = 'http://' + uri;
      /*
      ob = {
        method: 'get',
        uri: 'http://localhost:3000/api/user'
      };*/
      body.forEach(function(item) {
        requestObject[item.key] = item.value;
      });

      test.request.header.forEach(function(header) {
        var value = getEviromentVariable(header.value);
        if (header.key !== "Content-Type") {
          headers[header.key] = value;
        }
      });
      //ob = JSON.parse(JSON.stringify(ob));
      //console.log('called:', ob);

      var call = request(ob);

      calls.push(call);
      call.then(function(result) {
        var event = test.event[0].exec[0];
        var data = JSON.parse(result);
        console.log('result:', result);
        /*
                event.forEach(function(unitTest) {
                  if (/JSON\.parse\(responseBody\)/.test(unitTest)) {
                    data = 0;
                  } else if (/^var/.test(unitTest)) {
                    data = 0;
                  } else if (/postman\.setGlobalVariable/.test(unitTest)) {
                    unitTest = unitTest.replace("postman.setGlobalVariable", "");
                  }
                });*/
      })
      .catch(function (e) {
        console.log('error:', JSON.stringify(e.error, null, 't'));
      });


    });
  });
  /*
    bluebird.all(calls)
      .then(function(goal) {
        console.log('done calls');
      })
      .catch(function(error) {
        console.log('calls failed');
      });*/
}

function processInFile(inFile) {
  var outFile;
  outFile = "Title: " + inFile.info.name;
  outFile += "\nDescription: " + inFile.info.description;

  inFile.item.forEach(function(item) {
    outFile += '\n\nTest:' + item.name;

    item.item.forEach(function(test) {
      var request = test.request;
      var method = cleanString(request.method);
      var url = cleanString(request.url);
      var body = request.body.urlencoded;
      var requestObject = {};

      //  outFile += '\nName:     ' + cleanString(test.name);
      outFile += '\n' + cleanString(method + ': ' + url);
      if (methods.includes(method.toLowerCase())) {
        body.forEach(function(item) {
          requestObject[item.key] = item.value;
        });
        outFile += '\nPayload:\n' + JSON.stringify(requestObject, null, '\t');
      }
      outFile += '\n';
    });
  });
  return outFile;
}
