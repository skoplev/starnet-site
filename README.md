# STARNET gene expression browser
Web site for visualizing and searching STARNET RNA-seq data.

# Setup data symbolic links
When working on local machine, with access to all data for the project.

ln -s ~/DataProjects/STARNET/oscar_mat/ data/expr


# Setup web server on linode

To host the Flask web server through Apache2 server.

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

### enable wsgi
https://devops.profitbricks.com/tutorials/deploy-a-flask-application-on-ubuntu-1404/
sudo a2enmod wsgi


## Clone repository for website into Apache directory
cd /var/www
git clone https://skoplev@bitbucket.org/skoplev/starnet-site.git


## Setup virtual host

### Disable previous host
sudo a2dissite 000-default.conf

### Install Apache configuration file
sudo cp /var/www/starnet-site/apache/wsgi.conf /etc/apache2/sites-available/starnet-site.conf

### Enable site
sudo a2ensite starnet-site
sudo apachectl restart



# Configure Apache on Minerva (does not work)
cd www/starnet-site
cp apache/wsgi.conf .htaccess


# Setup python environment

Several options are available depending on the system (Debian, OSX, or Minerva).

The key step is to make sure that the Python enviroment is compatible with the Apache2 build and the requirements of the app, as specified in the Pipfile. Note that other versions of Python that specified in the Pipfile might also work. Pip is also required.

## Install Python with pyenv (preferred method)

Installs specific python version locally:

pyenv install 2.7.13


## Install pip on Debian

sudo apt-get install python-pip


## Install Python locally

If you don't have root access and pyenv is unavailable.

### Manual compilation
Follow steps in:
http://thelazylog.com/install-python-as-local-user-on-linux/

### Manual install pip
wget --no-check-certificate https://bootstrap.pypa.io/get-pip.py
python get-pip.py --user

add to .bash_profile:
export PATH=$PATH:$HOME/.local/bin


# Deployment on Minerva (deprecated section)

## Install newer version of Python 3 and pip according to:
http://thelazylog.com/install-python-as-local-user-on-linux/

## Install pipenv
pip3 install pipenv --user 

## ASCII encoding for pipenv installs, add to .bash_profile:
export LANG=en_US.UTF-8 LANGUAGE=en_US.en LC_ALL=en_US.UTF-8

## Create virutal environment, and install dependencies
pipenv --python ~/python/bin/python3
pipenv install





# Setup python virtual environment using pipenv

## Install pipenv for user
pip install --user pipenv

Setup local path, if not already configured, by adding to ~/.bashrc:

export PATH=$HOME/.local/bin:$PATH

source ~/.bashrc

## Install dependencies in virtual environment
Setups python virtual environment as specified in Pipfile

cd www/starnet-site

If using custom Python install, first configure pipenv:
pipenv --python ~/python/bin/python2

pipenv install

ALternatively, overwrite Pipfile config:
pipenv install --python 2.7.10



# Parse database on local machine

## Prepare data
Rscript parse/cpm.R
Rscript parse/eigenNetw.R
Rscript loadEnsembl.R

## Run python scripts specified in Flask app, in app/db.py
flask init-db

Creates the sqlite3 database file in instance/STARNET.sqlite


# Copy database from local machine to server

## Eigenentwork layout and annotation data
scp app/static/data/eigen_network.json neptune:/var/www/starnet-site/app/static/data/

## sqlite3 database file
scp instance/STARNET.sqlite neptune:/var/www/starnet-site/instance

## Static Bayesian networks

scp app/static/data/rgn/edges/*.csv neptune:/var/www/starnet-site/app/static/data/rgn/edges/
scp app/static/data/rgn/nodes/*.csv neptune:/var/www/starnet-site/app/static/data/rgn/nodes/
