# ! /bin/bash
date=$(date +%Y-%m-%d)
mkdir 
mkdir temp
lftp -d sftp://pcc@s-b4ee5575cbc34200b.server.transfer.ca-central-1.amazonaws.com -p 22 -e 'set sftp:connect-program "ssh -o StrictHostKeyChecking=no -a -x -i ~/.ssh/pcc-sandbox"; mirror -e /sbc-garms-data/sbc temp ; quit;'
mv temp/* $date
rm -rf temp

mv $date/*.JSON $date/test.json
file1=`cat $date/test.json`
echo "$file1"
sleep 5
curl --request POST \
  --url http://localhost:3000/api/v1/sale/recon \
  --header 'Content-Type: application/json' \
  --data "$file1"
sleep 5
rm -rf $date
