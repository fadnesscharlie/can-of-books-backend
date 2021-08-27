'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const BookModel = require('./modals/books.js');

const app = express();
app.use(cors());

// in order to acces the request body, we must use express.json();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// all of this came from jsonwebtoken docs
// ---------------------------------------
var jwksClient = require('jwks-rsa');
const { response } = require('express');
var client = jwksClient({
  // EXCEPTION!  jwksUri comes from your single page application -> settings -> advanced settings -> endpoint -> the jwks one
  jwksUri: 'https://dev-t7-jvcng.us.auth0.com/.well-known/jwks.json'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}
// ---------------------------------------

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Mongoose is connected');
});

// conntect to the db               Name of DB-not related to books path
mongoose.connect('mongodb://127.0.0.1:27017/books', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  // .then makes it connect to the DB first 
  //     Does not need to be in this promise
  .then(async () => {
    try {
      console.log('connected to the database');
      // storing a new book single
      let newBook = new BookModel({
        title: "Tobin's Spirit Guide",
        description: "H Thomas Tobin",
        status: "Status",
        email: "email",
      })
      await newBook.save();
    } catch (error) {
      console.log('error in mongoose connect', error)
    }
  });

// ####################  Routes  ##############################

app.get('/', (req, res) => {
  res.send('Hello World');
});

// Clears the Data Base
app.get('/clear', clear);

// Adds/Seeds the Database
app.get('/seed', seed);

app.get('/books', (req, res) => {
  try {
    // Using split takes out the word bearer from the front end
    const token = req.headers.authorization.split(' ')[1];

    // Using the email from the user in the front end, setting email along with requested books
    const email = req.query.email;

    // // Use the jsonwebtoken library to verify that it is a valid jwt
    // // jsonwebtoken dock - https://www.npmjs.com/package/jsonwebtoken
    jwt.verify(token, getKey, {}, function (err, user) {
      if (err) {
        res.status(500).send('invlaid token');
      }
      // looking into our collection and finding all of our books
      // refers to the collection created by our schema

      BookModel.find({ email }, (err, bookdb) => {
        // You can use the error to make a error handle
        // Stretch --
        res.status(200).send(bookdb);
      });
    });
  } catch (err) {
    res.status(500).send('dbase error');
  }
})

app.post('/post-books', (req, res) => {
  let { title, description, status, email } = req.body;

  // Creating a new book for us using the data from the body
  let newBook = new BookModel({ title, description, status, email });
  
  // Saves to the Database
  newBook.save();

  // Sends the book to the front end ALONG with the ID
  res.send('Sucessfully Posted');
})

// handle delete request
app.delete('/delete-books/:id', async (req, res) => {
  let myId = req.params.id;
  await BookModel.findByIdAndDelete(myId);
  res.send(`Sucessfully Deleted: ${myId}`);
});

// Handle Update Request
app.put('/update-books/:id', async (req, res) => {
  // ################################
  // User email printed here manually for testing
  // ################################

  try {
    let myId = req.params.id;
    let { title, description, status, email } = req.body;
    // Update our book with the matching ID, updating our properties we listed
    const updatedCat = await BookModel.findByIdAndUpdate(
      myId,
      { title, description, status, email: "boy_916@hotmail.com" },
      { new: true, overwrite: true }
    );
    res.status(200).send(updatedCat);
  } catch (error) {
    res.status(500).send('Update Error')
  }
});

// ####################  Functions  ##############################

// Function to add book to DB
async function addBook(obj) {
  // CREATE R U D
  // {title: "", description: "", status: "", email: User's Email}
  let newBook = new BookModel(obj);
  return await newBook.save();
}

// function to clear our DB
async function clear(req, res) {
  // C R U DELETE
  try {
    await BookModel.deleteMany({});
    res.status(200).send('Cleared the Database');
  } catch (err) {
    res.status(500).send('Error in clearing the Database');
  }
}

async function seed(req, res) {
  // Seeded Data
  let books = await BookModel.find({});
  if (books.length === 0) {
    // Is the only one that needs async and await
    await addBook({
      title: "New Book1",
      description: "Awesome Author1",
      status: "status1",
      email: "boy_916@hotmail.com",
    })
    // Create a new book, but needs to be saved
    const newWayOfAddingBook = new BookModel({
      title: "New Book2",
      description: "Awesome Author2",
      status: "status2",
      email: "boy_916@hotmail.com",
    })
    newWayOfAddingBook.save();
    // Creates and saves the new book for you
    BookModel.create({
      title: "New Book3",
      description: "Awesome Author3",
      status: "status3",
      email: "boy_916@hotmail.com",
    })
  }
  res.status(200).send('Seeded the Database');
}

// ####################  END  ##############################

// listen to port
app.listen(PORT, () => console.log(`listening on ${PORT}`));
