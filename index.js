const express = require('express');
const config = require('./config');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/error');
const routes = require('./routes');
const pkg = require('./package.json');
const { connect } = require('./connect');

const { port, secret } = config;
const app = express();

app.set('config', config);
app.set('pkg', pkg);

// parse application/x-www-form-urlencoded
// analizar los datos de formulario codificados 
//en la URL y convertir en un objeto JavaScript
app.use(express.urlencoded({ extended: false }));
// middleware para parsear el body de las request
app.use(express.json());
//middleware de autenticación en la aplicación Express
// importado desde el archivo de auth.js 
app.use(authMiddleware(secret));

//llamar a la funcion para conectar con la base de datos 
connect()

// Registrar rutas
routes(app, (err) => {
  if (err) {
    throw err;
  }
  //middleware de manejo de errores
  app.use(errorHandler);

  app.listen(port, () => {
    console.info(`App listening on port ${port}`);
  });
});
