/* eslint-disable no-prototype-builtins */
/* eslint-disable no-constant-condition */
/* eslint-disable no-await-in-loop */
/*
 * Retries Mongo transactions if a transient error occurs.
 * See: https://docs.mongodb.com/manual/core/transactions/
 */
async function performTransactionWithRetry(txnFunc, session) {
  while (true) {
    try {
      return await txnFunc(session);
    } catch (error) {
      const isTransientError = error.hasOwnProperty('errorLabels')
        && error.errorLabels.includes('TransientTransactionError');
      if (!isTransientError) {
        throw error;
      }

      if (['NoSuchTransaction', 'WriteConflict'].includes(error.codeName)) {
        await session.abortTransaction();
        await session.startTransaction({
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
        });
      }
    }
  }
}

async function commitWithRetry(session) {
  while (true) {
    try {
      await session.commitTransaction();
      session.endSession();
      break;
    } catch (error) {
      const isTransientError = error.hasOwnProperty('errorLabels')
        && error.errorLabels.includes('UnknownTransactionCommitResult');
      if (!isTransientError) {
        throw new Error(error);
      }
    }
  }
}

module.exports = { performTransactionWithRetry, commitWithRetry };
