import imaplib
import email

from_email = None
from_pwd = None
smtp_server = None


def set_variables(email, pwd, server):
    global from_email
    global from_pwd
    global smtp_server
    from_email = email
    from_pwd = pwd
    smtp_server = server


def readmail():
    """Get the most recently received email with the subject spot.dj"""

    global from_email
    global from_pwd
    global smtp_server

   # from_email = 'gcprogrammingclub@gmail.com'
   # from_pwd = 'YAYPYTHON'
   # smtp_server = 'imap.gmail.com'

    mail = imaplib.IMAP4_SSL(smtp_server)
    mail.login(from_email, from_pwd)
    mail.select('inbox')

    type, data = mail.search(None, '(SUBJECT "Riverdance")')
    id_list = data[0].split()

    typ, data = mail.fetch(id_list[-1], '(RFC822)')

    for response in data:
        if isinstance(response, tuple):
            msg = email.message_from_string(response[1].decode('utf8'))
            for part in msg.walk():
                if part.get_content_type() == 'text/plain':
                    final_msg = part.get_payload()

    # Return the first line as artist, second line as title
    return parse_email(final_msg)


def parse_email(msg):
    # This function reads the final message and interprets line one as artist, line two as song

    msg = msg.splitlines()
    return msg[0], msg[1]
