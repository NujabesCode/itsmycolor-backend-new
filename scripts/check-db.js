const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'itsmycolor-new.c3gmmg6wggj1.ap-northeast-2.rds.amazonaws.com',
      user: 'admin',
      password: 'dkstjswnzjffj_',
      port: 3306
    });
    
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('Available databases:');
    databases.forEach(db => {
      console.log(`  - ${db.Database}`);
    });
    
    const dbExists = databases.some(db => db.Database === 'itsmycolor');
    if (!dbExists) {
      console.log('\nDatabase "itsmycolor" does not exist. Creating...');
      await connection.execute('CREATE DATABASE IF NOT EXISTS itsmycolor');
      console.log('Database "itsmycolor" created!');
    } else {
      console.log('\nDatabase "itsmycolor" exists!');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
