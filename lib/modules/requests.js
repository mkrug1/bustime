var requests = function (apiObj) {
  var http        = require('http'),
      querystring = require('querystring'),
      xml2js      = require('xml2js'),
      validate    = require('./validate'),
      services    = require('./services')
      ;
  return {
    specialMethod: function (name, reqObj, callback) {
      var parent = this;
      // Run reqObj through the validator:
      validate[name](reqObj, function (err, validatedObj) {
        if (err) {
          // If reqObj doesn’t validate, return error to callback:
          typeof(callback) === 'function' ? callback(err, null) : false;

        } else {
          // Make a request to BusTime API:
          parent.genericMethod('get' + name.toLowerCase(), reqObj, function (err, result) {
            if (err) {
              // If API call results in an error, return error to callback:
              typeof(callback) === 'function' ? callback(err, null) : false;

            } else {
              // Run resulting object through services:
              services[name](reqObj, result, function (err, processedResult) {

                // Return processed result to the callback:
                typeof(callback) === 'function' ? callback(err, processedResult) : false;
              });
            }
          });
        }
      });
    },

    genericMethod: function (requestType, reqObj, callback) {
      // Set a bunch of default variables for use in the request to the BusTracker API:
      var host        = apiObj.host,
          path        = apiObj.path || '/bustime/api/v1',
          port        = apiObj.port || 80,
          method      = 'GET',
          queryString = '',
          options     = {},
          request
          ;

      // Sometimes we might not get a reqObj, so create one:
      if (!reqObj) reqObj = {};

      reqObj.key = apiObj.key || null;
      reqObj.localestring = reqObj.localestring || apiObj.localestring || null;
      queryString = querystring.stringify(reqObj);

      options = {
        host: host,
        path: path + '/' + requestType + '?' + queryString,
        port: port,
        method: method
      }

      // Make request to BusTime API:
      request = http.request(options, function (response) {
        var body = '';
        response.on('data', function (data) {
          body += data;
        });

        // Do something with the response from the API:
        response.on('end', function () {
          // Turn XML response into JS object and do something with the result:
          var parser = new xml2js.Parser({
            explicitArray: false,
            trim: true
          });
          parser.parseString(body, function (err, parsedResponse) {
            var result = parsedResponse['bustime-response'];
            if (callback && typeof(callback) === 'function') {
              callback(err, result);
            } else {
              return {
                error: err,
                result: result
              };
            }
          });
        });
      });

      // If BusTime API responds with HTTP error, return the error:
      request.on('error', function (e) {
        if (callback && typeof(callback) === 'function') {
          callback(e.message, null);
        } else {
          return { err: e.message };
        }
      });

      request.end();
    }
  }
}

module.exports = requests;