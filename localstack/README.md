### Local Stack Configuration



- Check if the localstack profile already exists
  
aws configure list-profiles | grep "localstack"

- If the profile does not exist create one

aws configure --profile localstack


Dashboard function not available anymore

https://github.com/localstack/localstack/issues/4535#issuecomment-912360013

