"use strict";

const { request, response } = require("express");

const { getCollection, isValidObjectId } = require("./db");

const apiGetIssue = async (req = request, res = response) => {
  try {
    const collection = await getCollection(req.params.project);
    let documents    = await collection.find(req.query);

    documents = documents.map(doc => {
      const {__v, ...data} = doc._doc;
      return data;
    });

    return res.json(documents);
  } catch (err) {
    return res.json({ error: "couldn't get issues"});
  }
};

const apiPostIssue = async (req = request, res = response) => {
  try {
    const Issue = await getCollection(req.params.project);
    
    const { 
      issue_title, 
      issue_text, 
      created_by, 
      ...optionalFields } = req.body;

    if (!issue_title || !issue_text || !created_by ) {
      return res.json({ error: "required field(s) missing" });
    }

    const newIssue = new Issue({ 
      issue_title,
      issue_text,
      created_by,
      ...optionalFields
    });
    
    await newIssue.save();
    
    const { __v, ...data } = newIssue._doc;
    
    return res.json(data);
    
  } catch (err) {
    return res.json({ error: "Could not post new issue. Try again." });
  }
};


const apiPutIssue = async (req = request, res = response) => {
  try {
    const { _id, ...data } = req.body;

    if (!_id) return res.json({ error: "missing _id" });

    if(!isValidObjectId(_id)) throw "No document found";

    if (Object.values(data).length == 0) {
      return res.json({ error: "no update field(s) sent", _id });
    }
    
    const collection = await getCollection(req.params.project);

    const document = await collection.findOne({ _id });

    if (!document) {
      return res.json({ error: "could not update", _id });
    };

    await collection.findByIdAndUpdate(_id, {
      ...data,
      updated_on: new Date()
    });

    res.json({ result: "successfully updated", _id });

  } catch (error) {
    return res.json({ error: "could not update", _id: req.body._id });
  }
};


const apiDeleteIssue = async (req = request, res = response) => {
  try {
    const { _id } = req.body;

    if (!_id) return res.json({ error: "missing _id" });
    
    const collection      = await getCollection(req.params.project);
    const deletedDocument = await collection.findByIdAndDelete(_id);

    if (!deletedDocument) throw "No document found";

    return res.json({ result: "successfully deleted", _id });

  } catch (error) {
    return res.json({ error: "could not delete", _id: req.body._id });
  }
};

module.exports = {
  apiGetIssue,
  apiPostIssue,
  apiPutIssue,
  apiDeleteIssue
}