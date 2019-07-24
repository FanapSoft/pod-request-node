/**
 * @namespace PodRequest
 */

// External Modules
const axios = require('axios');
const qs = require('qs');

// Pod Modules
const util = require('pod-utilities');

// Project Modules
const config = require('./config');

// Variable Initialization
const errors = config.errors;

/**
 * PodRequest
 * @memberOf PodRequest
 *
 */
class PodRequest {
  /**
   * @description This function sends the request to the server
   * @param {string} baseUrl - This is the base url of your service
   * @param {string} apiPath - This is the API path
   * @param {string} method - This is the HTTP method
   * @param {object} headers - This is the request headers
   * @param {object} data - This is the request data
   * @param {boolean} [isUrlEncoded] - This determines if we have to change data to a querystring format
   * @param {string} [urlTrail] - This will be cancated to url
   * @returns {Promise}
   */
  request (baseUrl, apiPath, method, headers, data, isUrlEncoded, urlTrail) {
    let options = {
      url: this.appendUrls(baseUrl, apiPath, urlTrail),
      method: method
    };
    let isPodStandard = false;

    this.addHeaders(options, headers);
    this.addBody(options, method, headers, data, isUrlEncoded);

    return axios(options)
      .then((result) => {
        result = result.data;
        if (this.isPodStandard(result)) { // Pod service standard response is returned (result has to be an object with hasError property)
          isPodStandard = true;
          if (!result.hasError) { // No error occured (hasError considered to be a boolean)
            return result; // Maybe we need to check for other properties in result before returning it
          }
          else {
            // Uses errorCode (considered to be a number) & message (considered to be a string) in the response
            // Or unknowCode and unknownPhrase if these properties does not exists
            throw this.createErrorFromPodReponse(result);
          }
        }
        else {
          return result;
        }
      })
      .catch((error) => {
        if (isPodStandard) { // Our standard error object {code: considered to be a number, message: considered to be a stringّ}
          throw error;
        }
        else {
          if (error.hasOwnProperty('response') && error.response) { // Checks Restful Errors
            let code = error.response.status || errors.unexpected.code;
            let message = error.response.data || error.response.statusText || errors.unexpected.message;
            throw new util.PodError(code, message, null);
          }
          else if (error.hasOwnProperty('code')) { // Checks for connection error
            throw new util.PodError(errors.connection.code, errors.connection.message, null);
          }
          else {
            throw new util.PodError(errors.unexpected.code, errors.unexpected.message, null);
          }
        }
      });
  }

  /**
   * @description This function checks if headers is an object then adds the headers object to options
   * @param {object} options
   * @param {object} headers
   */
  addHeaders (options, headers) {
    if (typeof headers === 'object') {
      options.headers = headers;
    }
  }

  /**
   * @description This function checks the method and headers to add data to options correctly
   * @param {object} options
   * @param {string} method
   * @param {object} headers
   * @param {object} data
   * @param {boolean} [isUrlEncoded] - determines if we have to change data to a querystring format
   */
  addBody (options, method, headers, data, isUrlEncoded) {
    if (typeof method === 'string' && typeof data === 'object') {
      if (method.toLowerCase() === 'get') {
        options.params = data;
      }
      else if (this.isUrlencoded(headers)) {
        options.data = qs.stringify(data);
      }
      else if (isUrlEncoded) {
        options.data = options.data = qs.stringify(data);
      }
      else {
        options.data = data;
      }
    }
  }

  /**
   * @description This function checks the header object for application/x-www-form-urlencoded property
   * @param {object} headers
   * @returns {boolean}
   */
  isUrlencoded (headers) {
    let isEncoded = false;
    if (typeof headers === 'object' && headers.hasOwnProperty('Content-Type') && typeof headers['Content-Type'] === 'string') {
      if (headers['Content-Type'].toLowerCase() === 'application/x-www-form-urlencoded') {
        isEncoded = true;
      }
    }
    return isEncoded;
  }

  /**
   * @description This function checks if the input param is in Pod service standard formatِ
   * @param {object} inpParam
   * @returns {boolean}
   */
  isPodStandard (inpParam) {
    let isStandard = false;
    if (typeof inpParam === 'object' && (inpParam.hasOwnProperty('hasError') || inpParam.hasOwnProperty('HasError'))) {
      isStandard = true;
    }
    return isStandard;
  }

  /**
   * @description This function creates our standard error object from the standard service reponse
   * @param {object} PodStandardObj
   * @returns {object}
   */
  createErrorFromPodReponse (podStandardObj) {
    let code = podStandardObj.hasOwnProperty('ErrorCode') ? podStandardObj.ErrorCode : errors.unexpected.code;
    let message = podStandardObj.hasOwnProperty('Message') ? podStandardObj.Message : errors.unexpected.message;
    code = podStandardObj.hasOwnProperty('errorCode') ? podStandardObj.errorCode : errors.unexpected.code;
    message = podStandardObj.hasOwnProperty('message') ? podStandardObj.message : errors.unexpected.message;
    return new util.PodError(code, message, podStandardObj);
  }

  /**
   * @description This function create the final url for the request
   * @param {string} baseUrl
   * @param {string} apiPath
   * @param {string} [urlTrail]
   * @returns {string}
   */
  appendUrls (baseUrl, apiPath, urlTrail) { // Use an external module
    let finalUrl;
    finalUrl = this.checkAndAppend(baseUrl, apiPath);
    if (urlTrail) {
      finalUrl = this.checkAndAppend(finalUrl, urlTrail);
    }
    return finalUrl;
  }

  /**
   * @description This function adds a path to a url to form the complete url
   * @param {string} firstpart
   * @param {string} secondPart
   * @returns {string}
   */
  checkAndAppend (firstpart, secondPart) {
    let fullUrl;
    if (firstpart[firstpart.length - 1] !== '/' && secondPart[0] !== '/') {
      fullUrl = firstpart + '/' + secondPart;
    }
    else if (firstpart[firstpart.length - 1] === '/' && secondPart[0] === '/') {
      fullUrl = firstpart.substr(0, firstpart.length - 1) + secondPart;
    }
    else {
      fullUrl = firstpart + secondPart;
    }
    return fullUrl;
  }
}

module.exports = PodRequest;
