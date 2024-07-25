#!/bin/bash

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Check if target IP/domain is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <target_ip_or_domain>"
    exit 1
fi

TARGET=$1

# Function to check if a tool is installed and install if missing
check_and_install() {
    if ! command -v $1 &> /dev/null; then
        echo "$1 is not installed. Attempting to install..."
        apt-get update
        apt-get install -y $1
        if [ $? -ne 0 ]; then
            echo "Failed to install $1. Please install it manually."
            exit 1
        fi
    fi
}

# Function to install WPScan
install_wpscan() {
    if ! command -v wpscan &> /dev/null; then
        echo "WPScan is not installed. Attempting to install..."
        apt-get update
        apt-get install -y ruby ruby-dev libcurl4-openssl-dev make zlib1g-dev
        gem install wpscan
        if [ $? -ne 0 ]; then
            echo "Failed to install WPScan. Please install it manually."
            echo "You can try: gem install wpscan"
            exit 1
        fi
    fi
}

# Check for required tools and install if missing
check_and_install nmap
check_and_install nikto
check_and_install sqlmap
install_wpscan
check_and_install hydra
check_and_install wkhtmltopdf

# Create a directory for results
RESULT_DIR="pentest_results_$(date +%Y%m%d_%H%M%S)"
mkdir $RESULT_DIR
cd $RESULT_DIR

# Nmap scan
echo "Running Nmap scan..."
nmap -sV -sC -oN nmap_results.txt $TARGET

# Nikto scan
echo "Running Nikto scan..."
nikto -h $TARGET -output nikto_results.txt

# SQLMap scan (assuming there's a login page at /login.php)
echo "Running SQLMap scan..."
sqlmap -u "http://$TARGET/login.php" --batch --forms -o sqlmap_results

# WPScan (if target is WordPress)
echo "Running WPScan..."
wpscan --url http://$TARGET --output wpscan_results.txt

# Hydra (example: testing SSH with a small wordlist)
echo "Running Hydra..."
hydra -L /usr/share/wordlists/metasploit/unix_users.txt -P /usr/share/wordlists/metasploit/unix_passwords.txt $TARGET ssh -o hydra_results.txt

# Generate HTML report
echo "<html><body>" > report.html
echo "<h1>Penetration Test Report for $TARGET</h1>" >> report.html
echo "<h2>Nmap Results</h2><pre>" >> report.html
cat nmap_results.txt >> report.html
echo "</pre><h2>Nikto Results</h2><pre>" >> report.html
cat nikto_results.txt >> report.html
echo "</pre><h2>SQLMap Results</h2><pre>" >> report.html
cat sqlmap_results/log >> report.html
echo "</pre><h2>WPScan Results</h2><pre>" >> report.html
cat wpscan_results.txt >> report.html
echo "</pre><h2>Hydra Results</h2><pre>" >> report.html
cat hydra_results.txt >> report.html
echo "</pre></body></html>" >> report.html

# Convert HTML to PDF
wkhtmltopdf report.html pentest_report.pdf

echo "Penetration test completed. Results are in $RESULT_DIR/pentest_report.pdf"