# ! /bin/bash
date=$(date +%Y-%m-%d)
mkdir $date
mkdir temp
lftp -d sftp://pcc@s-b4ee5575cbc34200b.server.transfer.ca-central-1.amazonaws.com -p 22 -e 'set sftp:connect-program "ssh -o StrictHostKeyChecking=no -a -x -i ~/.ssh/pcc-sandbox"; mirror -e /sbc-garms-data/sbc temp ; quit;'
mv temp/* $date
rm -rf temp

mv $date/*.JSON $date/test.json
file1=`cat $date/test.json`
sleep 5

APP_ENV=local NODE_ENV=local ts-node -e "require('./parsegarms').handler($file1)"
sleep 5

rm -rf $date