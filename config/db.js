// eslint-disable-next-line no-unused-vars
const { Connection, createConnection } = require('mongoose');

const transactionSchema = require('../models/transactions');
const userSchema = require('../models/users');

const MONGO_CONFIG = {
  keepAlive: true,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 0,
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};


/**
 * @type {Connection}
 */
const db = createConnection(process.env.MONGO_URL, MONGO_CONFIG, (err) => {
  if (err) {
    console.error(err);
    throw err;
  }
  console.info('db connected');
});

const connection = {
  db,
  models: {
    Transactions: db.model('transactions', transactionSchema),
    Users: db.model('users', userSchema),
  },
};

module.exports = connection;
