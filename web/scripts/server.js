$("#email").change(function() {
    domain = $("#email").val().split("@")[1];
    console.log(domain);
    if (domain === "gmail.com") {
        $("#smtp_server").html("Server: "+domain);
    } else {
        $("#smtp_server").html("Invalid email address");
    }
});
