const { connect } = require("../connect");
const jwt = require("jsonwebtoken");
const config = require("../config");
const bcrypt = require("bcrypt");

const { secret } = config;

module.exports = (app, nextMain) => {
  app.post("/login", async (req, resp) => {
    try {
      // TODO: Authenticate the user
      // It is necessary to confirm if the email and password
      // match a user in the database
      // If they match, send an access token created with JWT
      
      //Es necesario confirmar si el correo electrónico y la contraseña
      // coincide con un usuario en la base de datos
      // Si coinciden, envía un token de acceso creado con JWT
      const { email, password } = req.body;
      const db = await connect();
      const collection = db.collection("users");
      const user = await collection.findOne({ email });
      //Compara la contraseña proporcionada en la solicitud 
      //con la contraseña almacenada en la base de datos 
      const compare = await bcrypt.compare(password, user.password);
      if (!email && !password) {
        resp.status(400).json({ error: "Enter a password and email" });
      }
      if (compare) {
        const { _id, role } = user;
        const accesToken = jwt.sign({ _id: _id, role: role }, secret);
        resp.json({ ok: "Ingreso", token: accesToken });
      }
      // next(400);
    } catch (error) {
      console.error("Error", error);
      // next(500);
    }
  });

  return nextMain();
};