import { env } from 'process';

export default {
  datasource: {
    db: {
      url: env('DATABASE_URL')
    }
  }
};
