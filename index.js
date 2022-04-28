const path = require('path');
const Mocha = require('mocha');
// glob is available in the VS Code runtime
// eslint-disable-next-line import/no-extraneous-dependencies
const glob = require('glob');
const { initializeTestEnvironment } = require('./test_infrastructure/initialize_test_environment');
const { validateTestEnvironment } = require('./test_infrastructure/validate_test_environment');

const getAllTestFiles = testsRoot =>
  new Promise((resolve, reject) => {
    glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) reject(err);
      resolve(files);
    });
  });

async function run(testsRoot) {
  try {
    validateTestEnvironment();

    // Create the mocha test
    const mocha = new Mocha(
      process.env.CI && {
        reporter: 'mocha-junit-reporter',
        reporterOptions: {
          mochaFile: './reports/integration.xml',
        },
      },
    );
    mocha.timeout(3000);
    mocha.color(true);

    const files = await getAllTestFiles(testsRoot);

    // Add files to the test suite
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    // Initialize VS Code environment for integration tests
    initializeTestEnvironment();

    // Run the mocha test
    await new Promise((res, rej) =>
      mocha.run(failures => {
        if (failures) {
          rej(failures);
        } else {
          res();
        }
      }),
    );
  } catch (e) {
    // temporary fix for https://github.com/microsoft/vscode/issues/123882
    console.error(e);
    throw e;
  }
}

module.exports = { run };
