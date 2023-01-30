#!/bin/bash


if ! command -v yarn &> /dev/null
then
    echo "yarn v2 could not be found"
    echo "https://yarnpkg.com/getting-started/install"
fi

if ! command -v rclone &> /dev/null
then
    echo "rclone could not be found"
    echo "https://rclone.org/install/"
fi

if ! command -v jq &> /dev/null
then
    echo "jq could not be found"
    echo "https://stedolan.github.io/jq/download/"
fi

if ! command -v mc &> /dev/null
then
    echo "mc (minio client) could not be found"
    echo "https://min.io/docs/minio/linux/reference/minio-mc.html#install-mc"
fi

if ! command -v aws &> /dev/null
then
    echo "aws could not be found"
    echo "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
fi

if ! command -v terraform &> /dev/null
then
    echo "terraform could not be found"
    echo "https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli"
fi

if ! command -v docker &> /dev/null
then
    echo "docker could not be found"
    echo "https://docs.docker.com/get-docker/"
fi

if ! command -v docker-compose &> /dev/null
then
    echo "docker-compose could not be found"
    echo "https://docs.docker.com/compose/install/"
fi

if ! test -f "$HOME/.ssh/bcm"; 
then
    echo "bcm keys not found"
    echo "Contact project admin"
fi

if [ ! $(aws configure list-profiles | grep -e pcc-aws -e minio | wc -l) -eq 2 ]
then
	echo "pcc-aws / minio Profile not found"
    echo "pcc-aws keys are in secrets manager in aws"
fi

if [ ! $(mdfind "kMDItemKind == 'Application'" | grep -c "Cisco AnyConnect Secure Mobility Client") -eq 1 ]
then
	echo "BC Gov VPN not installed"
fi

if ! command -v session-manager-plugin &> /dev/null
then
    echo "session-manager-plugin could not be found"
    echo "https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html"
fi


exit

