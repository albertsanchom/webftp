#!/usr/bin/env bash

ENVIRONMENT="demo"

function usage()
{
    echo "./deploy.sh -h --help --environment=<env>"
    echo ""
}

while [ "$1" != "" ]; do
    PARAM=`echo $1 | awk -F= '{print $1}'`
    VALUE=`echo $1 | awk -F= '{print $2}'`
    case $PARAM in
        -h | --help)
            usage
            exit
            ;;
        --environment)
            ENVIRONMENT=$VALUE
            ;;
        *)
            echo "ERROR: unknown parameter \"$PARAM\""
            usage
            exit 1
            ;;
    esac
    shift
done


echo "ENVIRONMENT is $ENVIRONMENT";

cwd=$(pwd)
cd ${cwd}/backend/ && npm run build && sls deploy --stage=$ENVIRONMENT

cd ${cwd}/frontend && npm install && npm run build
aws s3 sync ${cwd}/frontend/dist s3://webftp-web-$ENVIRONMENT
aws s3 cp ${cwd}/admin/error/index.html s3://webftp-protected-files-$ENVIRONMENT/error/index.html

#STAGE=$ENVIRONMENT node setup
