const { Types } = require('mongoose');
const connection = require('../config/db').db;
const { Transactions } = require('../config/db').models;

const {
  performTransactionWithRetry,
  commitWithRetry,
} = require('../helper/mongo');

const TransactionHelper = require('../helper/transactions');

function getTransactionFunction({
  userId, amount, session, balance,
}) {
  return async function tnxFunc() {
    const [transaction] = await Transactions.create(
      [
        {
          userId,
          amount,
          balance,
          reference: Types.ObjectId,
        },
      ],
      { session },
    );

    return { success: true, transaction, status: 200 };
  };
}

async function createTransaction(call, callback) {
  const { userId, amount, balance } = call.request;
  try {
    const session = await connection.startSession();
    session.startTransaction();

    const tnxFunc = getTransactionFunction({
      userId,
      amount,
      balance,
    });

    const tranxResponse = await performTransactionWithRetry(tnxFunc, session);

    if (!tranxResponse.success) {
      await session.abortTransaction();
      session.endSession();
      return callback(null, {
        success: false,
        error: 'Something went wrong',
        status: 400,
      });
    }
    await commitWithRetry(session);
    return callback(null, {
      ...tranxResponse,
      data: JSON.stringify(tranxResponse),
    });
  } catch (error) {
    console.error(error);
    return callback(error);
  }
}

async function transferFunds(call, callback) {
  const {
    debitUserId,
    creditUserId,
    amount,
    metadata,
  } = call.request;
  try {
    const session = await connection.startSession();
    session.startTransaction();

    const transaction = await TransactionHelper.transferFunds({
      debitUserId,
      creditUserId,
      amount,
      metadata,
      session,
    });

    if (!transaction.success) {
      return callback(null, transaction);
    }

    await commitWithRetry(session);
    return callback(null, {
      ...transaction,
      data: JSON.stringify(transaction),
    });
  } catch (error) {
    console.error(error);
    return callback(error);
  }
}

module.exports = {
  createTransaction,
  transferFunds,
};
