postman.setGlobalVariable(
  "loadUtils",
  function loadUtils(body) {
    var _ = require("lodash");
    let utils = {
      expNs: "SOAP-ENV",
      expStatus: 200,
      expContent: "text/xml",
      responseType: "Fault"
    };

    //GENERAL
    utils.urlDecode = value => {
      let result = unescape(value);
      return result.replace(/\+/g, " ");
    };
    utils.decodeFormURLEncoded = text => {
      let form = text.replace(/^\s+|\s+$/g, "");
      let result = form
        .split("&")
        .map(val => val.split("="))
        .map(values => values.map(utils.urlDecode));
      return _.fromPairs(result);
    };
    utils.paramName = name => {
      if (utils.responseType === "HTTP") return name.toUpperCase();
      return `${utils.responseType}.${name}`;
    };
    utils.parseSOAPResponse = (resType, resSubType) => {
      utils.responseType =
        resType === undefined ? `${utils.expNs}:Fault` : resType;
      if (resSubType !== undefined) {
        utils.responseSubType = utils.responseType + "." + resSubType;
      }
      pm.test("Parse SOAP response", () => {
        if (resType === undefined && utils.expStatus != 500) {
          utils.expStatus = 500;
        }
        let responseJSON = xml2Json(pm.response.text());
        pm.expect(responseJSON, "Cannot parse the response to JSON").to.exist;
        let soapEnvelope = responseJSON[`${utils.expNs}:Envelope`];
        pm.expect(soapEnvelope, `${utils.expNs}:Envelope`).to.exist;
        utils.response = soapEnvelope[`${utils.expNs}:Body`];
        pm.expect(utils.response, `${utils.expNs}::Body`).to.exist;
        let value = _.get(utils.response, utils.responseType);
        pm.expect(value, utils.responseType).to.exist;
        if (resSubType !== undefined) {
          let subValue = _.get(utils.response, utils.responseSubType);
          pm.expect(subValue, utils.responseSubType).to.exist;
        }
        let content = postman.getResponseHeader("Content-Type");
        pm.expect(content, "Missing Content-Type header").to.exist;
        pm.expect(content, "Wrong Content-Type").to.contain(utils.expContent);
        pm.response.to.have.status(utils.expStatus, "Invalid http status");
      });
    };
    utils.parseHTTPResponse = () => {
      pm.test("Parse HTTP response", () => {
        utils.expContent = "text/plain";
        utils.responseType = "HTTP";
        let response = _.trim(pm.response.text());
        if (response.includes("\n")) {
          var lines = response.split("\n").map(utils.decodeFormURLEncoded);
          lines = lines.map((obj, idx) =>
            _.mapKeys(obj, (value, key) => _.trim(key, "_" + idx))
          );
          utils.response = lines[0];
          utils.response.lines = _.drop(lines, 1);
          utils.responseSubType = "lines";
        } else {
          utils.response = utils.decodeFormURLEncoded(pm.response.text());
        }
        let content = postman.getResponseHeader("Content-Type");
        pm.expect(content, "Missing Content-Type header").to.exist;
        pm.expect(content, "Wrong Content-Type").to.contain(utils.expContent);
        pm.response.to.have.status(utils.expStatus, "Invalid http status");
      });
    };
    utils.expectValue = (name, value, expected, callback) => {
      if (expected instanceof RegExp) {
        pm.test(`${name} matches: ${expected}`, () => {
          pm.expect(value).to.match(expected);
        });
      } else if (expected !== undefined) {
        pm.test(`${name} is: ${expected}`, () => {
          pm.expect(value).to.equal(expected);
        });
      } else if (callback === undefined) {
        pm.test(`${name} exist`, () => {
          pm.expect(value).to.exist;
        });
      }
      if (typeof callback === "function") {
        callback(value);
      }
    };
    utils.expect = (name, expected, callback) => {
      pm.expect(name, "expect: name argument").to.exist;
      let value = _.get(utils.response, name);
      utils.expectValue(name, value, expected, callback);
    };

    //RESPONSE
    utils.expectNoResponse = name => {
      pm.expect(name, "expectResponse name argument").to.exist;
      pm.expect(utils.responseType, "responseType").to.exist;
      let paramName = utils.paramName(name);
      let value = _.get(utils.response, paramName);
      pm.test(`${paramName} does not exist`, () => {
        pm.expect(value).to.not.exist;
      });
    };
    utils.expectResponse = (name, expected, callback) => {
      utils.expect(utils.paramName(name), expected, callback);
    };
    utils.expectStatus = expected => {
      utils.expectResponse("status", expected);
    };
    utils.expectReturnCode = expected => {
      utils.expectResponse("returnCode", expected);
    };
    utils.expectMPayTID = () => {
      utils.expectResponse("mpayTID");
    };
    utils.expectLocation = substring => {
      if (substring === undefined) {
        utils.expectResponse("location");
      } else {
        utils.expectResponse("location", undefined, locationValue => {
          pm.test(`Location contains: ${substring}`, () => {
            pm.expect(locationValue).to.include(substring);
          });
        });
      }
    };
    utils.expectAll = number => {
      utils.expectResponse("all", String(number));
    };
    utils.expectAllAbove = number => {
      pm.expect(number, "expectAllAbove number argument").to.exist;
      utils.expectResponse("all", undefined, allValue => {
        pm.test(`${utils.paramName("all")} is bigger than ${number}`, () => {
          pm.expect(Number(allValue)).to.be.above(Number(number));
        });
      });
    };
    utils.expectAllBelow = number => {
      pm.expect(number, "expectAllBelow number argument").to.exist;
      utils.expectResponse("all", undefined, allValue => {
        pm.test(`${utils.paramName("all")} is smaller than ${number}`, () => {
          pm.expect(Number(allValue)).to.be.below(Number(number));
        });
      });
    };

    //SUB RESPONSE
    utils.expectSubResponse = (name, index, expected, callback) => {
      pm.expect(name, "expectSubResponse name argument").to.exist;
      pm.expect(utils.responseSubType, "responseSubType").to.exist;
      var paramName = `${utils.responseSubType}.${name}`;
      let values = _.get(utils.response, utils.responseSubType);
      if (values instanceof Array) {
        if (index === undefined) {
          index = 1;
        }
        pm.expect(index, "index").to.be.at.least(1);
        pm.expect(index, "index").to.be.at.most(values.length);
        paramName = `${utils.responseSubType}[${index - 1}].${name}`;
      }
      utils.expect(paramName, expected, callback);
    };
    utils.expectSubSortedBy = name => {
      pm.expect(name, "expectSubSortedBy name argument").to.exist;
      pm.test(`${utils.responseSubType} is sorted by ${name}`, () => {
        let values = _.get(utils.response, utils.responseSubType);
        let sorted = _.sortBy(values, name);
        let isEqual = _.isEqual(values, sorted);
        pm.expect(values, utils.responseSubType).to.be.an("array");
        pm.expect(isEqual).to.be.true;
      });
    };
    utils.expectSubTStatus = (expected, index) => {
      utils.expectSubResponse("tStatus", index, expected);
    };
    utils.expectSubTID = (expected, index) => {
      utils.expectSubResponse("tid", index, expected);
    };
    utils.expectSubMPayTID = index => {
      utils.expectSubResponse("mpayTID", index);
    };

    //PARAMETER
    utils.expectParameter = (name, expected, callback) => {
      pm.expect(name, "getParameter name argument").to.exist;
      pm.expect(utils.responseType, "responseType").to.exist;
      var value;
      var valueName = `${name} parameter`;
      let parameters = _.get(utils.response, `${utils.responseType}.parameter`);
      if (parameters !== undefined) {
        let index = _.findIndex(parameters, { name: name });
        if (index != -1) {
          value = parameters[index].value;
          valueName = `${name} parameter (${
            utils.responseType
          }.parameter[${index}].value)`;
        }
      }
      utils.expectValue(valueName, value, expected, callback);
    };

    //ERRORS
    utils.expectFaultCode = expected => {
      utils.expectResponse("faultcode", expected);
    };
    utils.expectFaultString = expected => {
      utils.expectResponse("faultstring", expected);
    };
    utils.expectErrNo = expected => {
      utils.expectResponse("errNo", String(expected));
    };
    utils.expectErrText = expected => {
      utils.expectResponse("errText", expected);
    };

    //SAVE
    utils.saveResponseParameter = (name, variable) => {
      pm.expect(name, "saveResponseParameter name argument").to.exist;
      pm.expect(variable, "saveResponseParameter variable argument").to.exist;
      pm.expect(utils.responseType, "responseType").to.exist;
      postman.clearEnvironmentVariable(name);
      pm.test(`Saving ${utils.paramName(name)} as ${variable}`, () => {
        let value = _.get(utils.response, utils.paramName(name));
        pm.expect(value).to.exist;
        postman.setEnvironmentVariable(variable, value);
      });
    };
    utils.saveMPayTID = name => {
      let variable = name !== undefined ? name : "MPayTID";
      utils.saveResponseParameter("mpayTID", variable);
    };
    utils.saveLocation = () => {
      utils.saveResponseParameter("location", "Location");
    };
    return utils;
  } + "; loadUtils();"
);
