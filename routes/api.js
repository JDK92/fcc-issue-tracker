'use strict';

const {
  apiGetIssue,
  apiPostIssue,
  apiPutIssue,
  apiDeleteIssue } = require("../controllers");

module.exports =  (app) => {
  app.route('/api/issues/:project')
    .get(apiGetIssue)

    .post(apiPostIssue)
    
    .put(apiPutIssue)

    .delete(apiDeleteIssue);
};