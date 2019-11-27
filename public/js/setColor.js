function getColor(){
    var character = document.getElementsByName("character");
    var color;
    for(var i = 0; i < character.length; i++){
    if(character[i].checked){
        color = character[i].value;
    }
}
    console.log("in setCOlor js " + color);
    // This is on page1.html
    var myData = [ color];
    var insert = localStorage.setItem( "color", color );
    //document.getElementById("usernameGame").innerHTML = insert;
}
