const mysql = require('mysql2/promise');
// mysql2/promise = version moderne avec async/await
// (vs l'ancienne API avec callbacks)

const pool = mysql.createPool({
  host:     process.env.DB_HOST,     // "mysql" (nom du service Docker)
  port:     process.env.DB_PORT,     // 3306
  database: process.env.DB_NAME,     // "fittrack"
  user:     process.env.DB_USER,     // "fittrack_user"
  password: process.env.DB_PASSWORD, // "fittrack_pass"

  charset:         'utf8mb4',
  // Crucial pour les accents, emojis, caractères spéciaux

  timezone: '+00:00',
  // UTC partout pour éviter les problèmes de fuseau horaire

  waitForConnections: true,
  // Si toutes les connexions sont occupées, attendre qu'une se libère

  connectionLimit: 10,
  // Maximum 10 connexions simultanées vers MySQL
  // Un pool évite d'ouvrir/fermer une connexion pour chaque requête

  queueLimit: 0,
  // 0 = file d'attente illimitée
});

pool.getConnection()
  .then(conn => {
    console.log('MySQL connected successfully');
    conn.release(); // Libère la connexion de test
  })
  .catch(err => {
    console.error('MySQL connection failed:', err.message);
  });

module.exports = pool;
// Utilisation dans les models :
// const [rows] = await pool.execute('SELECT * FROM User');

