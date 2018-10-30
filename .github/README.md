# step 0 install docker		
	# on windows	
		- download docker toolbox then install
		https://docs.docker.com/v17.12/toolbox/toolbox_install_windows/
	# on linux/mac	
		- install docker-ce and docker-compose
		>>sudo apt-get update
		>>sudo apt-get install apt-transport-https ca-certificates curl software-properties-common
		>>curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
		>>sudo apt-key fingerprint 0EBFCD88
		>>sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu  $(lsb_release -cs) stable"
		>>sudo apt-get update
		>>sudo apt-get install docker-ce
		>>sudo curl -L "https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/bin/docker-compose
		>>sudo chmod +x /usr/bin/docker-compose
		
		link reference : https://docs.docker.com/install/linux/docker-ce/ubuntu/
# step 1:		
		>>cd DIR_CODE/laradock
	# create docker machine only on windows	
	# create docker-machine and mapping source to virtualbox (NOTE replace DIR_CODE by path to project on your computer)	
		>>docker-machine create -d "virtualbox" --virtualbox-memory "1024" --virtualbox-hostonly-cidr "192.168.99.100/24" --virtualbox-share-folder "DIR_CODE:app"
# step 2		
		>>docker-machine stop 
		>>docker-machine start 
# step 3 only on windows		
	# update env	
	# run command to get infomation	
		>>docker-machine env hrbiz
	# set environment from console result	
		DOCKER_TLS_VERIFY
		DOCKER_HOST
		DOCKER_CERT_PATH
		DOCKER_MACHINE_NAME
		COMPOSE_CONVERT_WINDOWS_PATHS
# step 4		
		>> cp .env.windows/linux .env
# step 5		
		>>docker-compose up -d nginx php-fpm mysql
