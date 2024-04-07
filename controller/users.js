const User = require("../models/user");
const bcrypt = require("bcrypt");
const mongoose = require('mongoose');

module.exports = {
  getUsers: async (req, resp, next) => {
    try {
      const { _page, _limit } = req.query;
      const limit = parseInt(_limit) || 10;
      const page = parseInt(_page) || 1;
      const skip = (page - 1) * limit;

      const users = await User
        .find({}, "_id email role")
        .skip(skip)
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
      const user = await User.findById(uid);

      // Validar si el usuario existe
      if (!user) {
        return resp.status(404).json({
          msg: "Usuario no encontrado, por favor intente de nuevo con un usuario válido.",
        });
      }

      // Verificar permisos
      if (!validateOwnerOrAdmin(req, user._id)) {
        console.log("roles", req.role);
        return resp.status(403).json({
          error: "El usuario no tiene permisos para ver esta información",
        });
      }

      // Devolver la información del usuario
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
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return resp.status(403).json({ msg: "Usuario ya registrado" });
      }

      // Generación de hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear nuevo usuario con Mongoose
      const newUser = new User({
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
  putByUser: async (req, resp) => {
    try {
      const { uid } = req.params;
      const { email, password, role } = req.body;
  
      // Verificación de permisos del usuario actual
      if (!validateOwnerOrAdmin(req, uid)) {
        return resp.status(403).json({
          error: "El usuario no tiene permisos para actualizar",
        });
      }
  
      // Verificación del ID de usuario proporcionado
      if (!mongoose.Types.ObjectId.isValid(uid)) {
        return resp.status(400).json({
          error: "El ID de usuario proporcionado no es válido",
        });
      }
  
      // Verificación de si existe un usuario en la BD
      const existingUser = await User.findById(uid);
      if (!existingUser) {
        return resp.status(404).json({
          msg: "El usuario con el ID proporcionado no existe en la base de datos",
        });
      }
  
      // Validación de información enviada para modificar
      if (Object.keys(req.body).length === 0) {
        return resp
          .status(400)
          .json({ error: "No se envió ninguna información para modificar" });
      }
  
      // Hashing de la contraseña si se proporciona
      let hashedPassword;
      if (password) {
        const saltRound = 10;
        const salt = await bcrypt.genSalt(saltRound);
        hashedPassword = await bcrypt.hash(password, salt);
      }
  
      // Verificación de cambios en el rol de usuario
      if (role && role !== existingUser.role && role === "admin" && !isAdmin(req)) {
        return resp.status(403).json({
          msg: "El usuario no tiene permisos para cambiar el rol",
        });
      }
  
      // Actualización del usuario en la base de datos
      existingUser.email = email || existingUser.email;
      existingUser.password = hashedPassword || existingUser.password;
      existingUser.role = role || existingUser.role;
  
      await existingUser.save();
  
      return resp.json(existingUser);
    } catch (error) {
      console.error(error);
      return resp.status(500).send("Error en el servidor");
    }
  },
  deleteByUser: async (req, resp) => {
    try {
      const { uid } = req.params;
  
      // Verificar permisos del usuario actual
      if (!validateOwnerOrAdmin(req, uid)) {
        return resp.status(403).json({
          error: "El usuario no tiene permisos para ver esta información",
        });
      }
  
      // Verificar si el ID de usuario proporcionado es válido
      if (!mongoose.Types.ObjectId.isValid(uid)) {
        return resp.status(400).json({
          error: "El ID de usuario proporcionado no es válido",
        });
      }
  
      // Buscar el usuario en la base de datos
      const user = await User.findById(uid);
      if (!user) {
        return resp.status(404).json({ error: "El ID del usuario no existe" });
      }
  
      // Eliminar el usuario de la base de datos
      await user.remove();
  
      return resp.status(200).json({ msg: "Usuario eliminado", usuario: user });
    } catch (error) {
      console.error(error);
      return resp.status(500).send("Error en el servidor");
    }
  }
};
  const validateOwnerOrAdmin = (req, uid) => {
    if (req.role !== "admin") {
      if (uid !== req.uid && uid !== req.email) {
        return false;
      }
    }
    return true;
  };
  
  const getIdOrEmail = (uid) => {
    let filter;
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validateId = ObjectId.isValid(uid);
    if (regexCorreo.test(uid)) {
      filter = { email: uid };
    } else {
      if (validateId) {
        filter = { _id: new ObjectId(uid) };
      }
    }
    return filter;
  };
  
  function isValidEmail(email) {
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexCorreo.test(email);
  }