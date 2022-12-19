# ! /bin/bash

mkdir temp

export PCC_SFTP=$PCC_SFTP
cmd=$( lftp -d $PCC_SFTP -p 22 -e 'set sftp:connect-program "ssh -o StrictHostKeyChecking=no -a -x -i ~/.ssh/pcc-sandbox"; mirror -e /sbc-garms-data/sbc temp; quit;' )

echo $cmd

sleep 5

files="temp/*.JSON"

for f in ${files[@]}
do
    file1=`cat $f`
    echo $file1
    APP_ENV=local NODE_ENV=local ts-node -e "require('./parsegarms.ts').handler($file1, \"$f\")"

done
sleep 3

rm -rf temp