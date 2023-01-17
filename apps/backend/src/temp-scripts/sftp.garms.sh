#! /bin/bash
mkdir transaction

echo $( lftp -d "$PCC_SFTP" -p 22 -e 'set sftp:connect-program "ssh -o StrictHostKeyChecking=no -a -x -i ~/.ssh/pcc-sandbox"; mirror -e / transaction ; quit;' )

sleep 3

files="transaction/*.JSON"

for f in ${files[@]}
do
    awslocal s3api put-object --bucket bc-pcc-data-files-local --key $f --body $f    

done

sleep 3

rm -rf transaction