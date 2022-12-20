#! /bin/bash

mkdir temp

echo $( lftp -d "$PCC_SFTP" -p 22 -e 'set sftp:connect-program "ssh -o StrictHostKeyChecking=no -a -x -i ~/.ssh/pcc-sandbox"; mirror -e /sbc-garms-data/sbc temp; quit;' )

sleep 3

files="temp/*.JSON"

for f in ${files[@]}
do
    file1=`cat $f`
    echo $file1
    APP_ENV=local NODE_ENV=local ts-node -e "require('./parsegarms.ts').handler($file1, \"$f\")"

done

rm -rf temp