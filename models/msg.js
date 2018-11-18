const mongoose = require('mongoose');
/*
  Modello per i messaggi
*/
const msgschema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  testo: String,
  autore: String,
  nautore: String,
  cogautore: String,
  data: Date
});

var Msg = module.exports = mongoose.model('Msg', msgschema);

module.exports.DeleteMessage = function(id, callback){
  Msg.remove({ _id: id }, callback)
}
