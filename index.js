const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
require('dotenv').config();

const helloworld = require('./controllers/helloworld');
const transactions = require('./controllers/transactions');

const packageDefinition = protoLoader.loadSync(
  ['helloworld/helloWorld.proto', 'transactions/transaction.proto'], {
    includeDirs: [process.env.PROTO_LOCATION],
    enums: String,
  },
);
const transactionPackage = grpc.loadPackageDefinition(packageDefinition).transactions;
const userPackage = grpc.loadPackageDefinition(packageDefinition).helloworld;

const server = new grpc.Server();
server.addService(userPackage.HelloWorld.service, {
  ...helloworld,
});
server.addService(transactionPackage.Transactions.service, {
  ...transactions,
});
server.bind(`0.0.0.0:${process.env.SERVICE_PORT}`, grpc.ServerCredentials.createInsecure());
server.start();
console.info(
  `***\n
   service started successfully on 0.0.0.0:${process.env.SERVICE_PORT}
    \n***`,
);

module.exports = server;
