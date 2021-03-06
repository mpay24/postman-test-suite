# postman-test-suite

## Global pre-request scripts

References:

- [Postman sandbox](https://www.getpostman.com/docs/v6/postman/scripts/postman_sandbox)
- [Parameter check (chai)](http://www.chaijs.com/api/bdd/)
- [Lodash documentation](https://lodash.com/docs/4.17.10)

usage:

```
let utils = eval(globals.loadUtils);
utils.parseSOAPResponse("etp:AcceptPayment");
```

Default variables which could be set before calling parseSOAPResponse:

`utils.expNs`: expected response soap namespace (default: SOAP-ENV)

`utils.expStatus`: expected response http status code (default: 200)

`utils.expSOAPContent`: expected SOAP response content type: (default: text/xml)

`utils.expHTTPContent`: expected HTTP response content type: (default: text/plain)

Variables set after calling parseHTTPResponse or parseSOAPResponse:

`utils.response` - contains the parsed response JSON

`utils.responseType` - contains the type (string) of the response

`utils.responseSubType` - contains the sub-type (string) of the response

### GENERAL

`urlDecode(value)`: url-decode `<value>`

`decodeFormURLEncoded(text)`: Decode `www-form-urlencoded` string `<text>` into a JSON object

`parseSOAPResponse(resType, subResType)`: defines the global variables for the other functions, expect `<resType>` response with `<subResType>` sub-response

`parseHTTPResponse(resType, subResType)`: defines the global variables for the other functions, expect `<resType>` response with `<subResType>` sub-response

`expectValue(name, value, expected, callback)`: check if the `<value>` named `<name>` is `<expected>` then call `<callback>` with the value

`expect(name, expected, callback)`: check if field `<name>` exists in the soap body and is `<expected>` then call `<callback>` with the value

### RESPONSE

`expectNoResponse(name)`: check that the response field `<name>` does not exist

`expectResponse(name, expected, callback)`: check if response field `<name>` exists containing `<expected>` and call `<callback>` with the value

`expectStatus(expected)`: check if the status field is `<expected>`

`expectReturnCode(expected)`: check if the `returnCode` field is `<expected>`

`expectMpayTID()`: check if `mpayTID` exist

`expectLocation(substring)`: check if response.location exists contains `<substring>`

`expectAll(number)`: check if `all` exists and is `<number>`

`expectAllAbove(number)`: check if `all` exists and is above `<number>`

`expectAllBelow(number)`: check if `all` exists and is below `<number>`

### SUB RESPONSE

`expectSubResponse(name, index, expected)`: check if sub-response parameter `<name>` exist at `<index>` and is `<expected>` and call `<callback>` with the value

`expectSubSortedBy(name)`: Check if the sub-response is sorted by the parameter `<name>`

`expectSubTStatus(expected, index)`: check if sub-response parameter `tStatus` exist at `<index>` and is `<expected>`

`expectSubTID(expected, index)`: check if sub-response parameter `tid` exist at `<index>` and is `<expected>`

`expectSubMPayTID(index)`: check if sub-response parameter `mPayTID` exist at `<index>`

### PARAMETER

`getParameter(name, callback)`: check if name/value parameter named `<name>` exist and call `<callback>` with the value

`expectParameter(name, expected)`: check if name/value parameter named `<name>` is `<expected>`

### ERRORS

`expectFaultCode(expected)`: check if the fault code is `<expected>`

`expectFaultString(expected)`: check if the fault string is `<expected>`

`expectErrNo(number)`: check if the error is `<number>`

`expectErrText(expected)`: check if the error text is `<expected>`

### SAVE

`saveResponseParameter(name, variable)`: save the response parameter `<name>` as environment variable <variable>

`saveMPayTID(name)`: save the mpayTID response parameter as environment variable `<name>` (default: MPayTID)

`saveLocation()`: save the location response parameter as environment variable Location
