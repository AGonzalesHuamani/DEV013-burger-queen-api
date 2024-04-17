const User = require("../models/user");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

module.exports = {
  getUsers: async (req, resp, next) => {
    try {
      const { _page, _limit } = req.query;
      const limit = parseInt(_limit) || 10;
      const page = parseInt(_page) || 1;
      const skip = (page - 1) * limit;

      const users = await User.find({}, "_id email role")
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
      // extraemos el id de los parametros de req
      const { uid } = req.params;
      let user;
      const isEmail = isValidEmail(uid);

      if (isEmail) {
        user = await User.findOne({ email: uid });
      } else {
        user = await User.findById(uid);
      }

      // Validar si el usuario existe
      if (!user) {
        return resp.status(404).json({
          msg: "Usuario no encontrado, por favor intente de nuevo con un usuario válido.",
        });
      }
      // Verificar permisos
      if (!validateOwnerOrAdmin(req, String(user._id))) {
        // console.log("dentro de getUserById: - que devuelve validateOwnerOrAdmin user._id", validateOwnerOrAdmin(req, user._id));
        // console.log("dentro de getUserById: - que devuelve validateOwnerOrAdmin user", validateOwnerOrAdmin(req, user));
        // console.log("dentro de getUserById: roles", req.role);
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

      console.log("Email Post User", email);

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

      // Generación de hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("🚀 ~ app.post ~ hashedPassword:", hashedPassword);

      // Verificar si el correo de un usuario ya está registrado o no
      const existingUser = await User.findOne({ email: email });
      console.log("Existing User", existingUser);
      if (!existingUser) {
        // Crear nuevo usuario con Mongoose
        const newUser = new User({
          email: email,
          password: hashedPassword,
          role: role,
        });
        await newUser.save();
        console.log("NewUser creado exitosamente.");
        return resp.status(200).json({
          email,
          role,
          _id: newUser._id,
        });
      } else {
        return resp.status(403).json({ msg: "Usuario ya registrado" });
      }
    } catch (error) {
      console.log("Error:", error);
      return resp.status(500).send("Error en el servidor");
    }
  },
  putByUser: async (req, resp) => {
    try {
      const { uid } = req.params;
      const { email, password, role } = req.body;
      const isEmail = isValidEmail(uid);
      console.log("🚀 ~ putByUser: ~ isEmail:", isEmail)
      
      const filter = isEmail ? { email: uid } : { _id: uid };
      console.log("🚀 ~ putByUser: ~ filter:", filter)
      
      // Verificar permisos
      if (!validateOwnerOrAdmin(req, uid)) {
        console.log("🚀 ~ putByUser: ~ req:", req)
        return resp.status(403).json({
          error: "El usuario no tiene permisos para ver esta información",
        });
      }


      // Validar si el usuario existe en la base de datos
      const existingUser = await User.findOne(filter)
      if(!existingUser){
        return resp.status(404).json({
          msg: "Usuario no encontrado en la base de datos"
        })
      }
     
      // Validar el formato del object id
      if(!mongoose.Types.ObjectId.isValid(uid)){
        return resp.status(404).json({
          msg: "El Id proporcionado no es valido"
        })
      }
      

      //Validación de información enviada para modificar
      if (Object.keys(req.body).length === 0) {
        return resp
          .status(400)
          .json({ error: "No se envió ninguna información para modificar" });
      }

      // Hashing de la contraseña si se proporciona
      // let hashedPassword;
      // if (password) {
      //   const saltRound = 10;
      //   const salt = await bcrypt.genSalt(saltRound);
      //   hashedPassword = await bcrypt.hash(password, salt);
      // }
  
      // console.log("🚀 ~ putByUser: ~ existingUser.role:", existingUser.role);
      // console.log("🚀 ~ putByUser: ~ role:", role);
      // console.log("isadmin", isAdmin(req));

      //Actualización del documento en la base de datos utilizando Mongoose
      const updatedUser = await User.updateOne(
        filter,
        {$set:{
          email: email,
          password: password, 
          role: role 
        }
          
        },
      );
      console.log("updatedUser*****", updatedUser);

      // // Verificación de cambios realizados
      // // if (!updatedUser) {
      // //   return resp.status(400).json({ error: "No se realizó ningún cambio" });
      // // }

      // // Envío de la información actualizada
      return resp.status(200).json({ message: "Usuario actualizado correctamente"});
      // return user
    } catch (error) {
      return resp.status(500).send("Error en el servidor");
    }
  },
  deleteByUser: async (req, resp) => {
    try {
      // extraemos el id de los parametros de req
      const { uid } = req.params;
      let user;
      const isEmail = isValidEmail(uid);

      if (isEmail) {
        user = await User.findOne({ email: uid });
      } else {
        user = await User.findById(uid);
      }

      // Verificar permisos del usuario actual
      if (!validateOwnerOrAdmin(req, uid)) {
        return resp.status(403).json({
          error: "El usuario no tiene permisos para ver esta información",
        });
      }
      // Validar si el usuario existe
      if (!user) {
        return resp.status(404).json({
          msg: "Usuario no encontrado, por favor intente de nuevo con un usuario válido.",
        });
      }
      // Eliminar el usuario de la base de datos
      const result = await user.deleteOne(user);

      return resp.status(200).json({ msg: "Usuario eliminado", usuario: user });
    } catch (error) {
      console.error(error);
      return resp.status(500).send("Error en el servidor");
    }
  },
};
const validateOwnerOrAdmin = (req, uid) => {
  // if (req) {
  //   console.log("validateOwnerOrAdmin -Contenido de req:", uid);
  //   console.log("validate *role*****", req.role);
  //   console.log("validate *uid*****", req.uid);
  //   console.log("validate *email*****", req.email);
  // }

  if (req && req.role && req.role !== "admin") {
    console.log("🚀 ~ validateOwnerOrAdmin ~ req.role:", req.role)
    // console.log("validateOwnerOrAdmin -Contenido de req:", req.role);
    if (uid !== req.uid && uid !== req.email) {
      return false;
    } else {
      return true;
    }
  }
  return true;
};
console.log("que devuelve validateOwnerOrAdmin", validateOwnerOrAdmin());

function isValidEmail(email) {
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regexCorreo.test(email);
}
