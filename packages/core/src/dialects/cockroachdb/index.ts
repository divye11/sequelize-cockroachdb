import type { Sequelize } from '../../sequelize.js';
import { createSpecifiedOrderedBindCollector } from '../../utils/sql';
import { AbstractDialect } from '../abstract';
import type { BindCollector } from '../abstract';
import { CockroachdbConnectionManager } from './connection-manager';
import * as DataTypes from './data-types';
import { CockroachDbQuery } from './query';
import { CockroachDbQueryGenerator } from './query-generator';
import { CockroachDbQueryInterface } from './query-interface';

export class CockroachDbDialect extends AbstractDialect {
  static readonly supports = AbstractDialect.extendSupport({
    'DEFAULT VALUES': true,
    'ON DUPLICATE KEY': false,
    'ORDER NULLS': true,
    returnValues: 'returning',
    bulkDefault: true,
    schemas: true,
    multiDatabases: true,
    lock: true,
    lockOf: true,
    forShare: 'FOR SHARE',
    index: {
      concurrently: true,
      using: 2,
      where: true,
      functionBased: true,
      operator: true,
      include: true,
    },
    inserts: {
      onConflictDoNothing: ' ON CONFLICT DO NOTHING',
      updateOnDuplicate: ' ON CONFLICT DO UPDATE SET',
      conflictFields: true,
    },
    dataTypes: {
      ARRAY: true,
      RANGE: true,
      GEOMETRY: true,
      GEOGRAPHY: true,
      JSON: true,
      JSONB: true,
      HSTORE: true,
      TSVECTOR: true,
      CITEXT: true,
      DATETIME: { infinity: true },
      DATEONLY: { infinity: true },
      FLOAT: { NaN: true, infinity: true },
      REAL: { NaN: true, infinity: true },
      DOUBLE: { NaN: true, infinity: true },
      DECIMAL: { unconstrained: true, NaN: true, infinity: true },
      CIDR: true,
      MACADDR: true,
      INET: true,
    },
    jsonOperations: true,
    REGEXP: true,
    IREGEXP: true,
    deferrableConstraints: true,
    searchPath: true,
    escapeStringConstants: true,
    globalTimeZoneConfig: true,
    dropTable: {
      cascade: true,
    },
    EXCEPTION: false,
  });

  readonly connectionManager: CockroachdbConnectionManager;
  readonly queryGenerator: CockroachDbQueryGenerator;
  readonly queryInterface: CockroachDbQueryInterface;

  readonly Query = CockroachDbQuery;

  readonly defaultVersion = '4.0.0';
  readonly TICK_CHAR = '`';
  readonly TICK_CHAR_LEFT = '`';
  readonly TICK_CHAR_RIGHT = '`';
  readonly dataTypesDocumentationUrl = 'https://www.cockroachlabs.com/docs/stable/data-types.html';

  constructor(sequelize: Sequelize) {
    super(sequelize, DataTypes, 'cockroachdb');
    this.connectionManager = new CockroachdbConnectionManager(this, sequelize);
    this.queryGenerator = new CockroachDbQueryGenerator({ dialect: this, sequelize });
    this.queryInterface = new CockroachDbQueryInterface(sequelize, this.queryGenerator);
  }

  createBindCollector(): BindCollector {
    return createSpecifiedOrderedBindCollector();
  }

  getDefaultSchema(): string {
    return 'defaultdb';
  }

  static getDefaultPort(): number {
    return 26_257;
  }
}
