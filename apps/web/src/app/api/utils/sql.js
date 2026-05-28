import { neon } from '@neondatabase/serverless';

let realSql = null;

function getRealSql() {
  if (realSql) return realSql;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'No database connection string was provided to `neon()`. Perhaps process.env.DATABASE_URL has not been set'
    );
  }

  realSql = neon(connectionString);
  return realSql;
}

const sql = new Proxy(() => {}, {
  apply(target, thisArg, argumentsList) {
    return getRealSql().apply(thisArg, argumentsList);
  },
  get(target, prop, receiver) {
    if (prop === 'transaction') {
      return (...args) => getRealSql().transaction(...args);
    }
    return Reflect.get(getRealSql(), prop, receiver);
  }
});

export default sql;