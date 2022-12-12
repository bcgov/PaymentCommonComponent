# ! /bin/bash

mkdir temp

export BCM_SFTP=$BCM_SFTP

cmd=$( lftp -d $BCM_SFTP -p 22 -e 'set sftp:connect-program "ssh -o StrictHostKeyChecking=no -a -x -i ~/.ssh/bcmpcc"; mirror -e /outgoing temp ; quit;' )

echo $cmd

mkdir TDI17
mkdir TDI34

sleep 3

files=$( ls temp )

shopt -s nocasematch

for file in ${files[@]}
do
    if [[ $file =~ F08TDI34  ]]; then
        mv -- "temp/$file" "TDI34/${file%.DAT}.TXT"    
    elif [[ $file =~ F08TDI17  ]]; then 
        mv -- "temp/$file" "TDI17/${file%.DAT}.TXT"    
    fi
done

sleep 3

TDI34="TDI34/*.TXT"
for i in ${TDI34[@]}
do  
    awslocal s3api put-object --bucket bc-pcc-data-files-local --key $i --body $i    

    APP_ENV=local NODE_ENV=local ts-node -e "require('./parseFile.ts').parseTDI34(\"$i\")"
done
sleep 3

TDI17="TDI17/*.TXT"
for i in ${TDI17[@]}
do  
    awslocal s3api put-object --bucket bc-pcc-data-files-local --key $i --body $i    

    APP_ENV=local NODE_ENV=local ts-node -e "require('./parseFile.ts').parseTDI17(\"$i\")"
done

sleep 3

rm -rf temp
rm -rf TDI17
rm -rf TDI34