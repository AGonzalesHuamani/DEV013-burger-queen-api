const jwt = require('jsonwebtoken');

module.exports = (secret) => (req, resp, next) => {
  const { authorization } = req.headers;

  //si no hay token continua
  if (!authorization) {
    return next();
  }

  const [type, token] = authorization.split(' ');
  console.log("🚀 ~ token:", token)
  console.log("🚀 ~ type:", type)

  

  if (type.toLowerCase() !== 'bearer') {
    return next();
  }

  // vamos a verificar si el token JWT proporcionado es válido y está firmado correctamente.
  jwt.verify(token, secret, (err, decodedToken) => {
    // console.log("🚀 ~ jwt.verify ~ decodedToken:", decodedToken)
    if (err) {
      return next(403);
    }
    // TODO: Verify user identity using `decodeToken.uid`

    //req es un bojeto recuerda!!!!!!
    //ID único del usuario
    req.uid = decodedToken._id;
    // console.log("🚀 ~ jwt.verify ~ req.uid:", req.uid)
    // rol del usuario
    req.role = decodedToken.role;
    // console.log("🚀 ~ jwt.verify ~ req.role:", req.role)
    // correo del usuario
     req.email = decodedToken.email
    //pasar el control al siguiente middleware
    // ya terminamos de manejar la verificación del token JWT 
    //podemos proceder con el siguiente paso en el flujo de la solicitud.
    next()
  });
};

// Funciones de autenticación y autorización
//req es un bojeto recuerda!!!!!!
module.exports.isAuthenticated = (req) => {
  // TODO: Decide based on the request information whether the user is authenticated
  // Decidir en función de la información de la solicitud si el usuario está autenticado

  //Si req.uid está definido, la función devuelve true
  //lo que significa que el usuario está autenticado.
  if(req.uid) return true;

  //Si req.uid no está definido en el objeto de solicitud
  //la función devuelve false, lo que indica que el usuario no está autenticado.
  return false;

};
  

module.exports.isAdmin = (req) => {
  // if the user is an admin
  // TODO: Decide based on the request information whether the user is an admin
  console.log("🚀 ~ req.role:", req.role);
  return req.role === 'admin' ?  true : false;
};
module.exports.requireAuth = (req, resp, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : next()
);

module.exports.requireAdmin = (req, resp, next) => (
  // eslint-disable-next-line no-nested-ternary
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : (!module.exports.isAdmin(req))
      ? next(403)
      : next()
);
