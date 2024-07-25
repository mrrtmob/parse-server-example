import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Email details
sender_email = "no-reply@blizzer.tech"
receiver_email = "neathmesa16@gmail.com"
password = "V@nna982983"  # Ensure this is stored securely!

# Create the email
msg = MIMEMultipart("alternative")
msg['From'] = sender_email
msg['To'] = receiver_email
msg['Subject'] = "Email Example"

# Plain text version
text = "Hello!\nThis is a plain text version of the email."

# HTML content
html = """
<html>
  <head>
    <style>
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        padding: 8px;
        border: 1px solid black;
      }
      th {
        background-color: #003366;
        color: white;
      }
    </style>
  </head>
  <body>
    <h1>Hello!</h1>
    <table>
      <thead>
        <tr>
          <th>N°</th>
          <th>Position (Generic Title)</th>
          <th>Industry</th>
          <th>Companies</th>
          <th>Salary Range</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>Sales Director</td>
          <td>Stock Exchange</td>
          <td>HRINC Recruitment Service</td>
          <td>$2,500 - 3,000</td>
        </tr>
        <!-- Additional rows here -->
      </tbody>
    </table>
  </body>
</html>
"""

# Attach the plain text and HTML to the email
msg.attach(MIMEText(text, 'plain'))
msg.attach(MIMEText(html, 'html'))

# Sending the email
try:
    with smtplib.SMTP_SSL('smtp.hostinger.com', 465) as server:
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        print("Email sent successfully.")
except smtplib.SMTPException as e:
    print(f"SMTP error occurred: {e}")
except Exception as e:
    print(f"Error: {e}")