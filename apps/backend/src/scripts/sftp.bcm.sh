# ! /bin/bash

cmd=$( lftp -d sftp://mt49test@142.34.128.34 -p 22 -e 'set sftp:connect-program "ssh -o StrictHostKeyChecking=no -a -x -i ~/.ssh/bcmpcc"; mirror -e /outgoing temp ; quit;' )
echo $cmd

sleep 5
date=$(date +%Y-%m-%d)
mkdir $date
mkdir $date/TDI17
mkdir $date/TDI34

sleep 3
files=$( ls temp )

shopt -s nocasematch
for file in ${files[@]}
do
    if [[ $file =~ F08TDI34  ]]; then
        mv -- "temp/$file" "$date/TDI34/${file%.DAT}.TXT"    
    elif [[ $file =~ F08TDI17  ]]; then 
        mv -- "temp/$file" "$date/TDI17/${file%.DAT}.TXT"    
    fi
done

sleep 5

TDI34="$date/TDI34/*.TXT"
for i in ${TDI34[@]}
do  
    awslocal s3api put-object --bucket bc-pcc-data-files-local --key $i --body $i    

    APP_ENV=local NODE_ENV=local ts-node -e "require('./parsetdi34.ts').parseHandler(\"$i\")"
done
sleep 5

TDI17="$date/TDI17/*.TXT"
for i in ${TDI17[@]}
do  
    awslocal s3api put-object --bucket bc-pcc-data-files-local --key $i --body $i    

    APP_ENV=local NODE_ENV=local ts-node -e "require('./parsetdi17.ts').parseHandler(\"$i\")"
done

sleep 5

rm -rf temp
rm -rf $date


