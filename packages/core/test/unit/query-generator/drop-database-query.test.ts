import { createSequelizeInstance, expectsql, getTestDialect, sequelize } from '../../support';

const dialectName = getTestDialect();

const notSupportedError = new Error(`Databases are not supported in ${dialectName}.`);

describe('QueryGenerator#dropDatabaseQuery', () => {
  const queryGenerator = sequelize.getQueryInterface().queryGenerator;
  const noQuoteQueryGenerator = createSequelizeInstance({ quoteIdentifiers: false }).getQueryInterface().queryGenerator;

  it('produces a DROP DATABASE query in supported dialects', () => {
    expectsql(() => queryGenerator.dropDatabaseQuery('myDatabase'), {
      default: notSupportedError,
      'postgres snowflake cockroachdb': 'DROP DATABASE IF EXISTS [myDatabase];',
      mssql: `IF EXISTS (SELECT * FROM sys.databases WHERE name = N'myDatabase' ) BEGIN DROP DATABASE [myDatabase] ; END;`,
    });
  });

  it('omits quotes if quoteIdentifiers is false', async () => {
    expectsql(() => noQuoteQueryGenerator.dropDatabaseQuery('myDatabase'), {
      default: notSupportedError,
      'postgres snowflake cockroachdb': 'DROP DATABASE IF EXISTS myDatabase;',
      mssql: `IF EXISTS (SELECT * FROM sys.databases WHERE name = N'myDatabase' ) BEGIN DROP DATABASE [myDatabase] ; END;`,
    });
  });
});
