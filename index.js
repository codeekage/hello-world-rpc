const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
require('dotenv').config();

const helloworld = require('./controllers/helloworld');

const packageDefinition = protoLoader.loadSync('helloworld/helloworld.proto', {
  includeDirs: [process.env.PROTO_LOCATION],
  enums: String,
});
const userPackage = grpc.loadPackageDefinition(packageDefinition).helloworld;

const server = new grpc.Server();
server.addService(userPackage.HelloWorld.service, {
  ...helloworld,
});
server.bind(`0.0.0.0:${process.env.SERVICE_PORT}`, grpc.ServerCredentials.createInsecure());
server.start();
console.info(
  `***\n
   service started successfully on 0.0.0.0:${process.env.SERVICE_PORT}
    \n***`,
);

module.exports = server;
