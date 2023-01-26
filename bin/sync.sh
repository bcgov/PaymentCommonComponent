#!/bin/bash
set -e

REPO_LOCATION=$(git rev-parse --show-toplevel)

PS3='Please enter your choice: '
options=("BCM PROD TO AWS PROD" "AWS PROD TO LOCAL" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        "BCM PROD TO AWS PROD")
            
            echo -e "\nSyncing BCM PROD TO AWS PROD..."
            source $REPO_LOCATION/bin/assume.sh "prod" "local"
            rclone sync bcm:/outgoing s3:pcc-integration-data-files-prod/bcm
	        rclone check bcm:/outgoing s3:pcc-integration-data-files-prod/bcm
            
            break
            ;;
        "AWS PROD TO LOCAL")
            
            echo -e "\nSyncing AWS PROD TO LOCAL..."
            source $REPO_LOCATION/bin/assume.sh "prod" "local"
            rclone sync s3:pcc-integration-data-files-prod minio:pcc-integration-data-files-local 
	        rclone check s3:pcc-integration-data-files-prod minio:pcc-integration-data-files-local
            
            break
            ;;
        "Quit")
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done