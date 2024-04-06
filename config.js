exports.port = process.argv[2] || process.env.PORT || 8080;
exports.dbUrl = process.env.MONGO_URL || process.env.DB_URL || 'mongodb://127.0.0.1:27017/burguer_queenApi';
exports.secret = process.env.JWT_SECRET || 'esta-es-la-api-burger-queen';
exports.adminEmail = process.env.ADMIN_EMAIL || 'admin@localhost';
exports.adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

//Una variable de entorno es una variable cuyo valor se define fuera de un programa 
//y se utiliza por el sistema operativo o por otros programas en el mismo entorno. 

//Las variables de entorno son parte del entorno de ejecución de un proceso 
//y proporcionan información sobre el entorno en el que se ejecuta el programa.
