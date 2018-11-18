var script = document.createElement('script');
script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);
/*
function sendmsg(){
    var txt = document.getElementById("messaggio").value;
    console.log(txt);
    var xml = new XMLHttpRequest();
    xml.open("GET","/users/sendmsg?txt=" + txt,true);
    xml.send();
}

function senduser(){
    var usr = document.getElementById("ricerca").value;
    console.log(usr);
    var xml = new XMLHttpRequest();
    xml.open("GET","/users/sendricerca?usr=" + usr,true);
    xml.send();
}
*/

//Invia messaggio
$('#exampleModal #button-addon2').on('click',function(){
  var msg = $('#messaggio').val();
  //var dataser = $data.serialize();
  //console.log(msg); debug
  $.post("/users/sendmsg", { txt: msg });
  setTimeout(location.reload.bind(location), 2000); //delay e poi printa la page
});

//Cancella messaggio
$('.clsmsg').on('click', function(){
  console.log("Cancellazione del messaggio...");
  $(this).parent().parent().parent().fadeOut("slow", function(){
    var msgid = $(this).parent().find("#visibilityid").text();
    $(this).remove();
    console.log(msgid);
    $.post("/users/cancellamsg", { delmsg: msgid });
  });
})

//Add follower
$('#change').on('click', function(){
  var msg = $('a.id').text();
  var self=$(this);
  if(self.text()=="Segui +")     {
    self.text("Rimuovi -");
    addfollower(msg);
  }else {
    self.text("Segui +");
    removefollower(msg);
  }
});

function addfollower(par){
  var n = par.search("@");
  var c = par.substr(n+1);
  console.log("Add");
  $.post("/users/addfollower", { idf: c }, function(data){ console.log("[Add] Post riuscita: " + data); });
}

function removefollower(par){
  var n = par.search("@");
  var c = par.substr(n+1);
  console.log("Remove");
  $.post("/users/toglifollower", { idf: c },function(data){ console.log("[Remove] Post riuscita: " + data); });
}
/*
$('#ricerca').keyup(function(){
            var searchField = $('#search').val();
            var regex = new RegExp(searchField, "i");
            var output = '<div class="row">';
            var count = 1;
            $.getJSON('../usr.json', function(data) {
              $.each(data, function(key, val){
                console.log(data);
                if (val._id.search(regex) != -1){
                  output += '<div class="col-md-6 well">';
                  output += '<div class="col-md-7">';
                  output += '<h5>' + val._id + '</h5>';
                  output += '</div>';
                  output += '</div>';
                  if(count%2 == 0){
                    output += '</div><div class="row">'
                  }
                  count++;
                }
              });
              output += '</div>';
              $('#results').html(output);
            });
        });
*/
