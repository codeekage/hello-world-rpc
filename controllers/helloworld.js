
async function greetHelloWorld(call, callback) {
  const { name } = call.request;
  return callback(null, {
    greet: `Hello, ${name}`,
  });
}

module.exports = {
  greetHelloWorld,
};
