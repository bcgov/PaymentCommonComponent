#! /bin/bash

mkdir temp
mkdir TDI17
mkdir TDI34

echo $( lftp -d "$BCM_SFTP" -p 22 -e 'set sftp:connect-program "ssh -o StrictHostKeyChecking=no -a -x -i ~/.ssh/bcmpcc"; mirror -e /outgoing temp ; quit;' )

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
    awslocal s3api put-object --bucket pcc-integration-data-files-local --key $i --body $i --metadata "type=tdi_34"   

done
sleep 3

TDI17="TDI17/*.TXT"
for i in ${TDI17[@]}
do  
    awslocal s3api put-object --bucket pcc-integration-data-files-local --key $i --body $i --metadata "type=tdi_17"   

done

sleep 3

rm -rf temp
rm -rf TDI17
rm -rf TDI34