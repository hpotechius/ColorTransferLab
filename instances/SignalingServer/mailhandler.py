

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ANSI-Escape-Sequence for colored output
# ORANGE: General information
# GREEN: Sending messages
# BLUE: Receiving messages
ORANGE = '\033[33m'
GREEN = '\033[92m'
BLUE = '\033[94m'
RESET = '\033[0m'

def send_email(subject, body, to_email, from_email, smtp_server, smtp_port, smtp_user, smtp_password):
    # Erstellen Sie das MIME-Multipart-Objekt
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject

    # Fügen Sie den Textkörper zur Nachricht hinzu
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Verbinden Sie sich mit dem SMTP-Server und senden Sie die E-Mail
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Verwenden Sie TLS für die Sicherheit
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()

        print(f'{ORANGE}[INFO] Mail was sent sucessfully to {to_email} from {from_email}{RESET}')
    except Exception as e:
        print(f"Fehler beim Senden der E-Mail: {e}")
