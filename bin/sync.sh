#!/bin/bash
set -e

REPO_LOCATION=$(git rev-parse --show-toplevel)

PS3='Please enter your choice: '
options=("AWS PROD TO LOCAL" "Quit")
select opt in "${options[@]}"
do
    case $opt in
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