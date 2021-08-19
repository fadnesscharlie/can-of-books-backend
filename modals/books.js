'use strict';

const mongoose = require('mongoose');

// Simular to a constructor
// Is our layout
const bookSchema = new mongoose.Schema({
  title: {type: String, required: true},
  description: {type: String},
  status: {type: String},
  email: {type: String},
});

// Create a model                file?    our model
const BookModel = mongoose.model('books', bookSchema);


// Export our layout through model
module.exports = BookModel;
