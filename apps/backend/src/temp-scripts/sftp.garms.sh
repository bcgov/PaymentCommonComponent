#! /bin/bash
mkdir transaction

echo $( lftp -d "$PCC_SFTP" -p 22 -e 'set sftp:connect-program "ssh -o StrictHostKeyChecking=no -a -x -i ~/.ssh/pcc-sandbox"; mirror -e /sbc-garms-data/sbc transaction ; quit;' )

sleep 3

files="transaction/*.JSON"

for f in ${files[@]}
do
    file1=`cat $f`
    
    sleep 1
    
    APP_ENV=local ts-node -e "require('./parsegarms.ts').parseSales($file1)" > $f

done

sleep 3

for f in ${files[@]}
do
    file=`cat $f`
    awslocal s3api put-object --bucket bc-pcc-data-files-local --key $f --body $f    
done

sleep 3

rm -rf transaction