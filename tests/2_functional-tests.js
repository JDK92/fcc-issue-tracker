const chai      = require('chai');
const chaiHttp  = require('chai-http');
const { model } = require("mongoose");

const server    = require('../server');
const { Issue } = require('../db');

const assert = chai.assert;

const collection = model("functional-testing", Issue, "functional-testing");

chai.use(chaiHttp);

suite('Functional Tests', function () {
  test("Create an issue with every field", (done) => {
    chai.request(server)
      .post('/api/issues/functional-testing')
      .send({
        issue_title: "A title",
        issue_text: "Lorem ipsum",
        created_by: "Tester",
        assigned_to: "Some dude",
        status_text: "It's alive"
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.exists(res.body._id, "An _id must be created");
        assert.exists(res.body.open, "The issue must have an Open key");
        assert.isTrue(res.body.open, "The issue must be open (true) by default");
        done();
      });
  });

  test("Create an issue with only required fields", (done) => {
    chai.request(server)
      .post('/api/issues/functional-testing')
      .send({
        issue_title: "A title",
        issue_text: "Lorem ipsum",
        created_by: "Tester"
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.assigned_to, "", "This field be an empty string if no data is provided");
        assert.equal(res.body.status_text, "", "This field be an empty string if no data is provided");
        assert.exists(res.body._id, "An _id must be created");
        done();
      });
  });

  test("Create an issue with missing required fields", (done) => {
    chai.request(server)
      .post('/api/issues/functional-testing')
      .send({
        issue_text: "Oh no, I missed some fields."
      })
      .end((err, res) => {
        assert.equal(res.body.error, "required field(s) missing");
        done();
      });
  });

  test("View issues on a project", (done) => {
    chai.request(server)
      .get("/api/issues/functional-testing")
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body, "GET must show an array of issues");
        done();
      });
  });

  test("View issues on a project with one filter", (done) => {
    chai.request(server)
      .get("/api/issues/functional-testing?open=true")
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.include(res.req.path, "?", "This char indicates a query");
        assert.isArray(res.body, "GET must show an array of issues");
        done();
      });
  });

  test("View issues on a project with multiple filters", (done) => {
    chai.request(server)
      .get("/api/issues/functional-testing?open=true&created_by=Me")
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.include(res.req.path, "?", "This char indicates a query");
        assert.include(res.req.path, "&", "This char indicates multiple query values");
        assert.isArray(res.body, "GET must show an array of issues");
        done();
      });
  });

  test("Update one field on an issue", (done) => {
   collection.findOne({}, (err, doc) => {
    chai.request(server)
    .put("/api/issues/functional-testing")
    .send({
      _id: doc._id.toString(),
      issue_text: "I got this from DB"
    })
    .end((err, res) => {
      assert.equal(res.status, 200);
      assert.equal(res.body.result, "successfully updated");
      done();
    });
   });
  });

  test("Update multiple fields on an issue", (done) => {
    collection.findOne({}, (err, doc) => {
      chai.request(server)
      .put("/api/issues/functional-testing")
      .send({
        _id: doc._id.toString(),
        issue_text: "This is a new text",
        created_by: "A GHOOOOST!!"
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.result, "successfully updated");
        done();
      });
    });
  });

  test("Update an issue with missing", (done) => {
    chai.request(server)
      .put("/api/issues/functional-testing")
      .send({
        created_by: "A GHOOOOST!!"
      })
      .end((err, res) => {
        assert.equal(res.body.error, "missing _id");
        done();
      });
  });

  test("Update an issue with no fields to update", (done) => {
    collection.findOne({}, (err, doc) => {
      chai.request(server)
      .put("/api/issues/functional-testing")
      .send({
        _id: doc._id.toString()
      })
      .end((err, res) => {
        assert.equal(res.body.error, "no update field(s) sent");
        done();
      });
    });
  });

  test("Update an issue with an invalid _id", (done) => {
    chai.request(server)
      .put("/api/issues/functional-testing")
      .send({
        _id: "621bc5cd57b785b2de9999dp"
      })
      .end((err, res) => {
        assert.equal(res.body.error, "could not update");
        done();
      });
  });

  test("Delete an issue", (done) => {
   collection.findOne({}, (err, doc) => {
    chai.request(server)
    .delete("/api/issues/functional-testing")
    .send({
      _id: doc._id.toString()
    })
    .end((err, res) => {
      assert.equal(res.status, 200);
      assert.equal(res.body.result, "successfully deleted");
      done();
    });
   });
  });

  test("Delete an issue with an invalid _id", (done) => {
    chai.request(server)
      .delete("/api/issues/functional-testing")
      .send({
        _id: "621bc6d716cadf95d22fa5c1"
      })
      .end((err, res) => {
        assert.equal(res.body.error, "could not delete");
        done();
      });
  });

  test("Delete an issue with missing _id", (done) => {
    chai.request(server)
      .delete("/api/issues/functional-testing")
      .send({})
      .end((err, res) => {
        assert.equal(res.body.error, "missing _id");
        done();
      });
  });
});