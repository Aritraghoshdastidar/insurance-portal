const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
};

async function checkAdmins() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            "SELECT admin_id, name, email, role FROM administrator WHERE role LIKE '%Security%' OR role LIKE '%Officer%'"
        );
        console.log('Admins with Security/Officer roles:');
        console.table(rows);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkAdmins();
