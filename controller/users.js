const { connect } = require("../connect");
const userSchema = require("../models/user");
const bcrypt = require("bcrypt");

module.exports = {
  getUsers: async (req, resp, next) => {
    try {
      const { _page, _limit } = req.query;
      const limit = parseInt(_limit) || 10;
      const page = parseInt(_page) || 1;
      const offset = (page - 1) * limit;

      const users = await userSchema
        .find({}, "email role")
        .skip(offset)
        .limit(limit);

      if (users.length === 0) {
        return resp
          .status(404)
          .json({ message: "No hay usuarios disponibles" });
      } else {
        return resp.status(200).json(users);
      }
    } catch (error) {
      return resp.status(500).send("Error en el servidor");
    }
  },
  // TODO: Implement the necessary function to fetch the `users` collection or table
  getUserById: async (req, resp) => {
    try {
      const { uid } = req.params;

      // Validación de identificador válido
      if (!mongoose.isValidObjectId(uid)) {
        return resp.status(400).json({ error: "Identificador inválido" });
      }

      // Buscar usuario por ID
      const user = await userSchema.findById(uid);

      // Validar si el usuario existe
      if (!user) {
        return resp.status(404).json({
          msg: "Usuario no encontrado, por favor intente de nuevo con un usuario válido.",
        });
      }

      // Validar si el usuario tiene permisos (asumo que validateOwnerOrAdmin es una función definida en otro lugar)
      if (!validateOwnerOrAdmin(req, user._id)) {
        console.log("roles", req.role);
        return resp.status(403).json({
          error: "El usuario no tiene permisos para ver esta información",
        });
      }

      return resp.status(200).json(user);
    } catch (error) {
      console.error("Error:", error);
      return resp.status(500).send("Error en el servidor");
    }
  },
  postUser: async (req, resp) => {
    try {
      const { email, password, role } = req.body;

      // Validaciones de campos obligatorios
      if (!email || !password) {
        return resp
          .status(400)
          .json({ msg: "Falta ingresar un email o password válidos" });
      }

      // Validación de rol válido
      const listRole = ["admin", "waiter", "chef"];
      if (!listRole.includes(role)) {
        return resp.status(400).json({ error: "El rol no es válido" });
      }

      // Validación del formato de correo electrónico
      if (!isValidEmail(email)) {
        return resp
          .status(400)
          .json({ error: "El correo electrónico proporcionado no es válido" });
      }

      // Validación de la longitud mínima de la contraseña
      if (password.length < 6) {
        return resp
          .status(400)
          .json({ error: "La contraseña debe tener al menos 6 caracteres" });
      }

      // Verificar si el correo ya está registrado o no
      const existingUser = await userSchema.findOne({ email: email });
      if (existingUser) {
        return resp.status(403).json({ msg: "Usuario ya registrado" });
      }

      // Generación de hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear nuevo usuario con Mongoose
      const newUser = new userSchema({
        email: email,
        password: hashedPassword,
        role: role,
      });
      await newUser.save();

      return resp.status(200).json(newUser);
    } catch (error) {
      console.log("Error:", error);
      return resp.status(500).send("Error en el servidor");
    }
  },
  putByUser: (req, resp, next) => {
    // TODO: Implement the necessary function to fetch the `users` collection or table
  },
  deleteByUser: (req, resp, next) => {
    // TODO: Implement the necessary function to fetch the `users` collection or table
  },
};
const validateOwnerOrAdmin = (req, uid) => {
  // Verificar si el usuario es administrador
  if (req.role === "admin") {
    return true; // Los administradores tienen acceso completo
  }

  // Verificar si el uid coincide con el uid del usuario o su correo electrónico
  if (req.uid === uid || req.email === uid) {
    return true; // El usuario es el propietario del recurso
  }
  // Si no es administrador y el uid no coincide, denegar el acceso
  return false;
};

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
