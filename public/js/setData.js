function getName(){
    var username = document.getElementById("username").value;
    //console.log("username setData js " + username);
    // This is on page1.html
    var myData = [ username];
    var insert = localStorage.setItem( "username", username );
    //document.getElementById("usernameGame").innerHTML = insert;
}
