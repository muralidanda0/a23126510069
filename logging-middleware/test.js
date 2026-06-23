const { Log } = require('./logger');

async function test() {
  await Log('backend', 'info', 'middleware', 'Logging middleware test - initialized successfully');
  console.log('Log sent');
}

test();