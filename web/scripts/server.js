$("#email").change(function() {
    domain = $("#email").val().split("@")[1];
    var smtpServer;
    $("#server_prefix").css('opacity', '1');
    $("#server_prefix").html('SMTP server: ');
    if (domain === "gmail.com") {
        smtpServer = "imap.gmail.com";
        $("#smtp_server").val("imap.gmail.com");
    } else if (domain === "outlook.com") {
        smtpServer = "smtp-mail.outlook.com";
        $("#smtp_server").val("smtp-mail.outlook.com");
    } else if (domain === "yahoo.com") {
        smtpServer = "smtp.mail.yahoo.com";
        $("#smtp_server").val("smtp.mail.yahoo.com");
    } else if (domain === "aol.com") {
        smtpServer = "smtp.aol.com";
        $("#smtp_server").val("smtp.aol.com");
    } else if (domain === "zohomail.com") {
        smtpServer = "smtp.zoho.com";
        $("#smtp_server").val("smtp.zoho.com");
    } else if (domain === "icloud.com" || domain === "me.com" || domain === "mac.com") {
        smtpServer = "smtp.mail.me.com";
        $("#smtp_server").val("smtp.mail.me.com");
    } else {
        $("#server_prefix").html('Invalid email address');
        $("#smtp_server").val("");
    }
});


$('#submit').on('click', function() {
    $("#search_container").removeClass('search_container_active');
    eel.set_email($('#email').val(), $('#pwd').val(), $("#smtp_server").val());
});
