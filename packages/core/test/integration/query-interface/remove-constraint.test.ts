import { expect } from 'chai';
import { DataTypes, Op } from '@sequelize/core';
import { sequelize } from '../support';

const queryInterface = sequelize.queryInterface;
const dialect = sequelize.getDialect();

describe('QueryInterface#removeConstraint', () => {
  describe('Without schema', () => {
    beforeEach(async () => {
      await queryInterface.createTable('levels', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      });

      await queryInterface.createTable('actors', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        age: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        level_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      });
    });

    if (sequelize.dialect.supports.constraints.check) {
      it('should remove CHECK constraint', async () => {
        await queryInterface.addConstraint('actors', {
          name: 'custom_constraint_name',
          type: 'CHECK',
          fields: ['age'],
          where: {
            age: {
              [Op.gt]: 10,
            },
          },
        });

        const constraints = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
        expect(constraints).to.have.length(1);
        expect(constraints[0].constraintName).to.equal('custom_constraint_name');
        expect(constraints[0].constraintType).to.equal('CHECK');
        expect(constraints[0].definition).to.not.be.null;

        await queryInterface.removeConstraint('actors', 'custom_constraint_name');
        const constraints1 = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
        expect(constraints1).to.have.length(0);
      });
    }

    if (sequelize.dialect.supports.constraints.default) {
      it('should remove DEFAULT constraints', async () => {
        await queryInterface.addConstraint('actors', {
          name: 'custom_constraint_name',
          type: 'DEFAULT',
          fields: ['status'],
          defaultValue: 'active',
        });

        const constraints = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
        expect(constraints).to.have.length(1);
        expect(constraints[0].constraintName).to.equal('custom_constraint_name');
        expect(constraints[0].constraintType).to.equal('DEFAULT');
        expect(constraints[0].definition).to.not.be.null;

        await queryInterface.removeConstraint('actors', 'custom_constraint_name');
        const constraints1 = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
        expect(constraints1).to.have.length(0);
      });
    }

    if (sequelize.dialect.supports.constraints.unique) {
      it('should remove UNIQUE constraints', async () => {
        await queryInterface.addConstraint('actors', {
          name: 'custom_constraint_name',
          type: 'UNIQUE',
          fields: ['name', 'age'],
        });

        const constraints = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
        expect(constraints).to.have.length(1);
        expect(constraints[0].constraintName).to.equal('custom_constraint_name');
        expect(constraints[0].constraintType).to.equal('UNIQUE');

        await queryInterface.removeConstraint('actors', 'custom_constraint_name');
        const constraints1 = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
        expect(constraints1).to.have.length(0);
      });
    }

    if (sequelize.dialect.supports.constraints.foreignKey) {
      it('should remove FOREIGN KEY constraints', async () => {
        await queryInterface.addConstraint('actors', {
          name: 'custom_constraint_name',
          type: 'FOREIGN KEY',
          fields: ['level_id'],
          references: {
            table: 'levels',
            field: 'id',
          },
          onDelete: 'CASCADE',
        });

        const constraints = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
        expect(constraints).to.have.length(1);
        expect(constraints[0].constraintName).to.equal('custom_constraint_name');
        expect(constraints[0].constraintType).to.equal('FOREIGN KEY');

        await queryInterface.removeConstraint('actors', 'custom_constraint_name');
        const constraints1 = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
        expect(constraints1).to.have.length(0);
      });
    }

    if (sequelize.dialect.supports.constraints.foreignKey) {
      it('should remove PRIMARY KEY constraints', async () => {
        await queryInterface.addConstraint('actors', {
          name: 'custom_constraint_name',
          type: 'PRIMARY KEY',
          fields: ['id'],
        });

        if (['mariadb', 'mysql'].includes(dialect)) {
          const constraints = await queryInterface.showConstraints('actors', { constraintName: 'PRIMARY' });
          expect(constraints).to.have.length(1);
          expect(constraints[0].constraintName).to.equal('PRIMARY');
          expect(constraints[0].constraintType).to.equal('PRIMARY KEY');

          await queryInterface.removeConstraint('actors', 'PRIMARY');
          const constraints1 = await queryInterface.showConstraints('actors', { constraintName: 'PRIMARY' });
          expect(constraints1).to.have.length(0);
        } else if (dialect === 'cockroachdb') {
          // Cockroachdb does not allow dropping primary key constraints without subsequently creating a new one.
          const constraints = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
          expect(constraints).to.have.length(1);
          expect(constraints[0].constraintName).to.equal('custom_constraint_name');
          expect(constraints[0].constraintType).to.equal('PRIMARY KEY');

          const t = await sequelize.startUnmanagedTransaction();
          await queryInterface.removeConstraint('actors', 'custom_constraint_name', { transaction: t });
          await queryInterface.addConstraint('actors', {
            name: 'custom_constraint_name_2',
            type: 'PRIMARY KEY',
            fields: ['name'],
            transaction: t,
          });
          await t.commit();
          const constraints1 = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
          expect(constraints1).to.have.length(0);
        } else {
          const constraints = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
          expect(constraints).to.have.length(1);
          expect(constraints[0].constraintName).to.equal('custom_constraint_name');
          expect(constraints[0].constraintType).to.equal('PRIMARY KEY');

          await queryInterface.removeConstraint('actors', 'custom_constraint_name');
          const constraints1 = await queryInterface.showConstraints('actors', { constraintName: 'custom_constraint_name' });
          expect(constraints1).to.have.length(0);
        }
      });
    }
  });

  if (sequelize.dialect.supports.schemas) {
    describe('With schema', () => {
      beforeEach(async () => {
        await queryInterface.createSchema('archive');

        await queryInterface.createTable({
          tableName: 'levels',
          schema: 'archive',
        }, {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
        });

        await queryInterface.createTable({
          tableName: 'actors',
          schema: 'archive',
        }, {
          id: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          status: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          age: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          level_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
        });
      });

      if (sequelize.dialect.supports.constraints.check) {
        it('should remove CHECK constraint', async () => {
          await queryInterface.addConstraint({ tableName: 'actors', schema: 'archive' }, {
            name: 'custom_constraint_name',
            type: 'CHECK',
            fields: ['age'],
            where: {
              age: {
                [Op.gt]: 10,
              },
            },
          });

          const constraints = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
          expect(constraints).to.have.length(1);
          expect(constraints[0].constraintName).to.equal('custom_constraint_name');
          expect(constraints[0].constraintType).to.equal('CHECK');
          expect(constraints[0].definition).to.not.be.null;

          await queryInterface.removeConstraint({ tableName: 'actors', schema: 'archive' }, 'custom_constraint_name');
          const constraints1 = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
          expect(constraints1).to.have.length(0);
        });
      }

      if (sequelize.dialect.supports.constraints.default) {
        it('should remove DEFAULT constraints', async () => {
          await queryInterface.addConstraint({ tableName: 'actors', schema: 'archive' }, {
            name: 'custom_constraint_name',
            type: 'DEFAULT',
            fields: ['status'],
            defaultValue: 'active',
          });

          const constraints = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
          expect(constraints).to.have.length(1);
          expect(constraints[0].constraintName).to.equal('custom_constraint_name');
          expect(constraints[0].constraintType).to.equal('DEFAULT');
          expect(constraints[0].definition).to.not.be.null;

          await queryInterface.removeConstraint({ tableName: 'actors', schema: 'archive' }, 'custom_constraint_name');
          const constraints1 = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
          expect(constraints1).to.have.length(0);
        });
      }

      if (sequelize.dialect.supports.constraints.unique) {
        it('should remove UNIQUE constraints', async () => {
          await queryInterface.addConstraint({ tableName: 'actors', schema: 'archive' }, {
            name: 'custom_constraint_name',
            type: 'UNIQUE',
            fields: ['name', 'age'],
          });

          const constraints = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
          expect(constraints).to.have.length(1);
          expect(constraints[0].constraintName).to.equal('custom_constraint_name');
          expect(constraints[0].constraintType).to.equal('UNIQUE');

          await queryInterface.removeConstraint({ tableName: 'actors', schema: 'archive' }, 'custom_constraint_name');
          const constraints1 = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
          expect(constraints1).to.have.length(0);
        });
      }

      if (sequelize.dialect.supports.constraints.foreignKey) {
        it('should remove FOREIGN KEY constraints', async () => {
          await queryInterface.addConstraint({ tableName: 'actors', schema: 'archive' }, {
            name: 'custom_constraint_name',
            type: 'FOREIGN KEY',
            fields: ['level_id'],
            references: {
              table: { tableName: 'levels', schema: 'archive' },
              field: 'id',
            },
            onDelete: 'CASCADE',
          });

          const constraints = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
          expect(constraints).to.have.length(1);
          expect(constraints[0].constraintName).to.equal('custom_constraint_name');
          expect(constraints[0].constraintType).to.equal('FOREIGN KEY');

          await queryInterface.removeConstraint({ tableName: 'actors', schema: 'archive' }, 'custom_constraint_name');
          const constraints1 = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
          expect(constraints1).to.have.length(0);
        });
      }

      if (sequelize.dialect.supports.constraints.foreignKey) {
        it('should remove PRIMARY KEY constraints', async () => {
          await queryInterface.addConstraint({ tableName: 'actors', schema: 'archive' }, {
            name: 'custom_constraint_name',
            type: 'PRIMARY KEY',
            fields: ['id'],
          });

          if (['mariadb', 'mysql'].includes(dialect)) {
            const constraints = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'PRIMARY' });
            expect(constraints).to.have.length(1);
            expect(constraints[0].constraintName).to.equal('PRIMARY');
            expect(constraints[0].constraintType).to.equal('PRIMARY KEY');

            await queryInterface.removeConstraint({ tableName: 'actors', schema: 'archive' }, 'PRIMARY');
            const constraints1 = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'PRIMARY' });
            expect(constraints1).to.have.length(0);
          } else if (dialect === 'cockroachdb') {
            // Cockroachdb does not allow dropping primary key constraints without subsequently creating a new one.
            const constraints = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
            expect(constraints).to.have.length(1);
            expect(constraints[0].constraintName).to.equal('custom_constraint_name');
            expect(constraints[0].constraintType).to.equal('PRIMARY KEY');

            const t = await sequelize.startUnmanagedTransaction();
            await queryInterface.removeConstraint({ tableName: 'actors', schema: 'archive' }, 'custom_constraint_name', { transaction: t });
            await queryInterface.addConstraint({ tableName: 'actors', schema: 'archive' }, {
              name: 'custom_constraint_name_2',
              type: 'PRIMARY KEY',
              fields: ['name'],
              transaction: t,
            });
            await t.commit();
            const constraints1 = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
            expect(constraints1).to.have.length(0);
          } else {
            const constraints = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
            expect(constraints).to.have.length(1);
            expect(constraints[0].constraintName).to.equal('custom_constraint_name');
            expect(constraints[0].constraintType).to.equal('PRIMARY KEY');

            await queryInterface.removeConstraint({ tableName: 'actors', schema: 'archive' }, 'custom_constraint_name');
            const constraints1 = await queryInterface.showConstraints({ tableName: 'actors', schema: 'archive' }, { constraintName: 'custom_constraint_name' });
            expect(constraints1).to.have.length(0);
          }
        });
      }
    });
  }
});
