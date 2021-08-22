'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const BookModel = require('./modals/books.js');

const app = express();
app.use(cors());
// in roder to acces the request body, we must use express.json();
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

// conntect to the db                    Name of DB-not related to books path
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

app.get('/test', (req, res) => {

  // Using split takes out the word bearer from the front end
  const token = req.headers.authorization.split(' ')[1];

  // Use the jsonwebtoken library to verify that it is a valid jwt
  // jsonwebtoken dock - https://www.npmjs.com/package/jsonwebtoken
  jwt.verify(token, getKey, {}, function (err, user) {
    if (err) {
      response.status(500).send('invlaid token');
    }
    res.send(user);
  });

})

app.get('/books', (req, res) => {
  try {
    // Using split takes out the word bearer from the front end
    const token = req.headers.authorization.split(' ')[1];
    // console.log('token',token)

    // // Use the jsonwebtoken library to verify that it is a valid jwt
    // // jsonwebtoken dock - https://www.npmjs.com/package/jsonwebtoken
    jwt.verify(token, getKey, {}, function (err, user) {
      if (err) {
        res.status(500).send('invlaid token');
      }
      // looking into our collection and finding all of our books
      // refers to the collection created by our schema
      BookModel.find((err, bookdb) => {
        res.status(200).send(bookdb);
      });
    });
    // C READ U D
  } catch (err) {
    res.status(500).send('dbase error');
  }
})

app.post('/post-books', (req, res) => {
  // const token = req.headers.authorization.split(' ')[1];
  // jwt.verify(token, getKey, {}, function (err, user) {
  //   if (err) {
  //     res.status(500).send('invlaid token');
  //   }
  //   // looking into our collection and finding all of our books
  //   // refers to the collection created by our schema
  //   BookModel.find((err, bookdb) => {
  //     res.status(200).send(bookdb);
  //   });
  // });

  // ###########################
  // Wrap this in auth like above
  // ###########################

  let { title, description, status, email } = req.body;
    
  let newBook = new BookModel({ title, description, status, email });
  // Saves to the Database
  newBook.save();
  res.send('Sucessfully Posted');
})

// handle delete request - wrapping it in auth is VERY GOOD
app.delete('/delete-books/:id', async (req, res) => {
  let myId = req.params.id;
  console.log('myId', myId);
  await BookModel.findByIdAndDelete(myId);
  // await CatModel.findByIdAndDelete(myId, auth information/callback);
  res.send(`Sucessfully Deleted: ${myId}`);
});

// ####################  Functions  ##############################

// Function to add book to DB
async function addBook(obj) {
  // CREATE R U D
  // {title: "", description: "", status: "", email: ""}
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
      email: "email1",
    })
    const newWayOfAddingBook = new BookModel({
      title: "New Book2",
      description: "Awesome Author2",
      status: "status2",
      email: "email2",
    })
    newWayOfAddingBook.save();
    BookModel.create({
      title: "New Book3",
      description: "Awesome Author3",
      status: "status3",
      email: "email3",
    })
  }
  res.send('Seeded the Database');
}

// ####################  Functions  ##############################













// listen to port
app.listen(PORT, () => console.log(`listening on ${PORT}`));
