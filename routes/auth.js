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
      console.log("password del req.body", password);
      if (!email || !password) {
        return resp.status(400).json({ error: "Introduzca una contraseña y un correo electrónico" });
      }

      const db = await connect();
      const collection = db.collection("users");
      const user = await collection.findOne({ email });
      //Compara la contraseña proporcionada en la solicitud 
      //con la contraseña almacenada en la base de datos 
      console.log("user pruebas e2e", user);
      
      if (!user) {
        return resp.status(400).json({ error: "Correo electrónico o contraseña no válidos" });
      }

      const compare = await bcrypt.compare(password, user.password);

      if (compare) {
        const { _id, role } = user;
        const accesToken = jwt.sign({ _id: _id, role: role, email:email }, secret);
        resp.json({ ok: "Ingreso", token: accesToken });
      }else {
        return resp.status(400).json({ error: "Invalid email or password" });
      }
      
    } catch (error) {
      console.error("Error", error);
    }
  });

  return nextMain();
};