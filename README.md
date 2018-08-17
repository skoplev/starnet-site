# STARNET gene expression browser
Web site for visualizing and searching STARNET RNA-seq data.

# Setup data symbolic links (or copy to data/expr folder)
ln -s ~/DataProjects/STARNET/oscar_mat/ data/expr

# parse gene expression data into CPM matrices
Rscript parse/cpm.R


# Deployment on Minerva

## Install newer version of Python 3 and pip according to:
http://thelazylog.com/install-python-as-local-user-on-linux/

## Install pipenv
pip3 install pipenv --user 

## ASCII encoding for pipenv installs, add to .bash_profile:
export LANG=en_US.UTF-8 LANGUAGE=en_US.en LC_ALL=en_US.UTF-8

## Create virutal environment, and install dependencies
pipenv --python ~/python/bin/python3
pipenv install


# Setup web server on linode
https://www.linode.com/docs/getting-started/

## Security
https://www.linode.com/docs/security/securing-your-server/

Add user to sudoer:
visudo

## Convenient accessibility 

### RSA key
ssh-copy-id sk@45.33.68.129

### Alias for neptune server
Configure host on ~/.ssh/config, allowing 'ssh neptune':

Host neptune
	HostName 45.33.68.129
	User sk
	ControlMaster auto
	ControlPath /tmp/ssh_mux_%h_%p_%r

## Install Apache and mod_sgi

sudo apt install git

From  http://flask.pocoo.org/docs/1.0/deploying/mod_wsgi/

## Install apache
https://www.linode.com/docs/web-servers/apache/apache-web-server-debian-8/
sudo apt-get install apache2 apache2-doc apache2-utils

Follow rest of guide...

## Install mod_wsgi
sudo apt-get install libapache2-mod-wsgi



## Clone repository for website
cd ~/www
git clone https://skoplev@bitbucket.org/skoplev/starnet-site.git


## Setup virtual hosts

sudo a2dissite 000-default.conf






Graveyard

## add to /etc/apache2/apache2.conf the following directive:

<Directory /home/sk/www/>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
</Directory>

Restart server
sudo systemctl restart apache2
