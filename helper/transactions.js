const { Types } = require('mongoose');
const { Users, Transactions } = require('../config/db').models;

const { performTransactionWithRetry } = require('./mongo');

async function debitUser({
  userId,
  amount,
  session,
  metadata,
}) {
  try {
    const user = await Users.findById(userId).lean();
    if (!user) {
      return {
        success: false,
        error: 'User does not exists',
        status: 400,
      };
    }
    if (amount > user.balance) {
      return {
        success: false,
        error: 'Insuffient balance',
        status: 400,
      };
    }

    const userAfterDebit = await Users.findOneAndUpdate({ _id: userId }, {
      $inc: { balance: -amount },
    }, { session, new: true }).lean();


    const [transaction] = await Transactions.create([
      {
        userId,
        metadata,
        balance: userAfterDebit.balance,
        amount,
        type: 'debit',
        reference: new Types.ObjectId(),
      },
    ],
    { session });

    return {
      success: true,
      data: { user, transaction },
      status: 200,
      message: 'Transaction successful',
    };
  } catch (error) {
    console.error(error);
    return {
      status: 400,
      success: false,
      error: 'Failed!',
    };
  }
}
async function creditUser({
  userId,
  amount,
  session,
  metadata,
}) {
  try {
    const user = await Users.findById(userId, '_id').lean();
    if (!user) {
      return {
        success: false,
        error: 'User does not exists',
        status: 400,
      };
    }
    const userAfterDebit = await Users.findOneAndUpdate({ _id: userId }, {
      $inc: { balance: +amount },
    }, { session, new: true }).lean();


    const [transaction] = await Transactions.create([
      {
        userId,
        metadata,
        balance: userAfterDebit.balance,
        amount,
        type: 'credit',
        reference: new Types.ObjectId(),
      },
    ],
    { session });

    return {
      success: true,
      data: { user, transaction },
      status: 200,
      message: 'Transaction successful',
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: 'Failed!',
      status: 400,
    };
  }
}

function getTransactionFnc({
  debitUserId,
  creditUserId,
  amount,
  session,
  metadata,
}) {
  return async function tnxFunc() {
    const transactions = [
      await debitUser({
        userId: debitUserId,
        amount,
        metadata,
        session,
      }),
      await creditUser({
        userId: creditUserId,
        amount,
        metadata,
        session,
      }),
    ];
    return transactions;
  };
}


async function transferFunds({
  debitUserId,
  creditUserId,
  amount,
  session,
  metadata,
}) {
  try {
    const tnxFunc = getTransactionFnc({
      debitUserId,
      creditUserId,
      amount,
      session,
      metadata,
    });

    const transxResponse = await performTransactionWithRetry(tnxFunc, session);
    for (let i = 0; i < transxResponse.length; i += 1) {
      if (!transxResponse[i].success) {
        // eslint-disable-next-line no-await-in-loop
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          error: transxResponse[i].error,
          status: transxResponse[i].status,
        };
      }
    }
    const [debitTransaction, creditTransaction] = transxResponse;
    return {
      success: true,
      data: {
        debitTransaction,
        creditTransaction,
      },
      status: 200,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: 'Oops something went wrong',
      status: 400,
    };
  }
}


module.exports = {
  debitUser,
  creditUser,
  transferFunds,
};
