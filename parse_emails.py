import imaplib
import email


def readmail():
    """Get the most recently received email with the subject spot.dj"""

    from_email = 'gcprogrammingclub@gmail.com'
    from_pwd = 'YAYPYTHON'
    smtp_server = 'imap.gmail.com'

    mail = imaplib.IMAP4_SSL(smtp_server)
    mail.login(from_email, from_pwd)
    mail.select('inbox')

    type, data = mail.search(None, '(SUBJECT "spot.dj")')
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
