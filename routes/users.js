var express = require('express');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var cookie = require('cookie-parser');
var router = express.Router();

//richiamo il modello
var Msg = require('../models/msg');
var Auth = require('../models/auth');
/* GET users listing. */
router.get('/',  function(req, res, next) {

  console.log(req.isAuthenticated());

  //funzione per ricercare i messaggi
  function CercaMsg(){
    Msg.find({}, function(err,docs){
      if(err){
        console.log("Errore ricerca messaggi");
      }else{
        console.log("Messaggi trovati: " + docs[0]);
        res.render('users', { nome: req.session.name, id: req.session.id });
        //res.send(docs);
      }
    });
  }
  //CercaMsg();
  res.render('users');

});

//richiesta post messaggio
router.get('/sendmsg', function(req,res,next){
  //var d = new Date()
  console.log("Corpo messaggio: " + req.query.txt);
  const msg = new Msg({
    _id: new mongoose.Types.ObjectId(),
    testo: req.query.txt,
    autore: req.session.id,
    data: new Date()
  });
  //Salvataggio su db con mongoose nella collection auths
  msg.save(function(err,msg){
    if(err){
      console.log("Errore salvataggio su db: " + err);
    }else{
      console.log("Salvato su db 1 messaggio: " + msg);
    }
  });
});

/*Quando richiede una pagina */
router.get('/#:id', function(req,res,next){
  //cerco tutti i messaggi di chi ha l'id
  Msg.find({_id: req.params.id}, function(err,docs){
    if(err) console.log("Errore stampa messaggi");
      res.send(docs);
  });
});

router.get('/msg.json', function(req, res){
  Msg.find({}, function(err, messaggi){
    if(err) return console.log("Errore stamp messaggi");
    res.send(messaggi);
  });
});

function loggato(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }else{
    console.log("Accesso non autorizzato..");
    res.redirect('../');
  }
}

module.exports = router;
