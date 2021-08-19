'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const BookModel = require('./modals/books.js');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

// all of this came from jsonwebtoken docs
// ---------------------------------------
var jwksClient = require('jwks-rsa');
const { response } = require('express');
var client = jwksClient({
  // EXCEPTION!  jwksUri comes from your single page application -> settings -> advanced settings -> endpoint -> the jwks one
  jwksUri: 'https://dev-t7-jvcng.us.auth0.com/.well-known/jwks.json'
});

function getKey(header, callback){
  client.getSigningKey(header.kid, function(err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}
// ---------------------------------------

app.get('/', (req, res) => {
  res.send('Hello World');
});

// app.get('/clear', clear);

app.get('/test', (req, res) => {

  // Using split takes out the word bearer from the front end
  const token = req.headers.authorization.split(' ')[1];

  // Use the jsonwebtoken library to verify that it is a valid jwt
  // jsonwebtoken dock - https://www.npmjs.com/package/jsonwebtoken
  jwt.verify(token, getKey, {}, function (err, user){
    if(err){
      response.status(500).send('invlaid token');
    }
    res.send(user);
  });

})

app.get('/books', async (req, res) => {
  try {
    // C READ U D
    let booksdb = await BookModel.find({});
    res.status(200).send(booksdb);
  } catch (err) {
    res.status(500).send('dbase error');
  }
})

// start the db
// terminal idAddress = ... Port 27017
// conntect to the db                    Name of DB-not related to books path
mongoose.connect('mongodb://127.0.0.1:27017/books',{
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
// .then makes it connect to the DB first 
// Does not need to be in this promise
.then( async () => {
  try {
  console.log('connected to the database');

  // Seeded Data
  let books = await BookModel.find({});
  if (books.length === 0) {
    await addBook({
      title: "New Book1",
      description: "Awesome Author",
      status: "status",
      email: "email",
    })
    await addBook({
      title: "New Book2",
      description: "Awesome Author",
      status: "status",
      email: "email",
    })
    await addBook({
      title: "New Book3",
      description: "Awesome Author",
      status: "status",
      email: "email",
    })
  }

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

  app.listen(3007, () => {
    console.log('Server up on 3001????????');
  });
});


// Function to add book to DB
async function addBook(obj){
  // CREATE R U D
  // {title: "", author ""}
  let newBook = new BookModel(obj);
  return await newBook.save();
}

// function to clear our DB
async function clear(){
  // C R U DELETE
  try {
    await BookModel.deleteMany({});
    console.log('Cleared the whole DB!!!');
  } catch (err) {
    console.log('Error in clearing the DB!');
  }
}


// listen to port
app.listen(PORT, () => console.log(`listening on ${PORT}`));
