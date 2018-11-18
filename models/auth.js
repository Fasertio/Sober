const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const authschema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    nome: String,
    cognome: String,
    email: String,
    password: String,
    cookie: String,
    pp: String,
    descrizione: String,
    autenticazione: Boolean,
    token: String,
    seguiti: Number,
    seguaci: Number,
    post: Number,
    amici: [String]
});

var Auth = module.exports = mongoose.model('Auth', authschema);

module.exports.SearchByUsername = function(username, callback){
  //Cerca elementi in mongoose
  Auth.findOne( { username: username }, callback);
}

module.exports.ComparaPassword = function(password, hash, callback){
  bcrypt.compare(password, hash, function(error, response) {
    if(error) throw error;
    callback(null,response);
  });
}

module.exports.findById = function(id, callback){
  Auth.findOne({ _id: id}, callback);
}

module.exports.findByToken = function(t, callback){
  Auth.findOne({ token: t}, callback);
}
