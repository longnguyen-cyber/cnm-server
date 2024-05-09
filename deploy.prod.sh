#!/bin/bash

#Name of project
PROJECT_NAME=workchat
echo "PROJECT_NAME=${PROJECT_NAME}">>.env.staging

# # database
DATABASE_URL="mongodb+srv://kuga:kuga@workchat.t6kzqkr.mongodb.net/workchat"
echo "DATABASE_URL=${DATABASE_URL}">>.env.staging

# # server
APP_PORT=8080
JWT_SECRET=CpXtMZvoLo40xJ2yJe6xKNdCkSM09JFo
JWT_REGISTER_SECRET=HY4Tn05mKbobUpGnA9kJfNEsCGpFxLwh
JWT_REFRESH_SECRET=a6a9x3nOZ9nit2BvRHE5L8HGQ5K9VvIt
JWT_CONFIRM_EXPIRED_SECRET=EnZxINfjlmkTwpJxDRTluVUxMJKcaZWZ
echo "APP_PORT=${APP_PORT}">>.env.staging
echo "JWT_SECRET=${JWT_SECRET}">>.env.staging
echo "JWT_REGISTER_SECRET=${JWT_REGISTER_SECRET}">>.env.staging
echo "JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}">>.env.staging
echo "JWT_CONFIRM_EXPIRED_SECRET=${JWT_CONFIRM_EXPIRED_SECRET}">>.env.staging


# # aws s3
AWS_S3_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=AKIAZRTJ3ZE7BH65YCFR
AWS_SECRET_ACCESS_KEY=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
AWS_S3_BUCKET_NAME=workchatprod
echo "AWS_S3_REGION=${AWS_S3_REGION}">>.env.staging
echo "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}">>.env.staging
echo "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}">>.env.staging
echo "AWS_S3_BUCKET_NAME=${AWS_S3_BUCKET_NAME}">>.env.staging

# mamagement time expired
# 30 day
ALL_EXPIRED= 2592000
CHAT_EXPIRED= 2592000
CHANNEL_EXPIRED= 2592000
LOGIN_EXPIRED= 2592000
CLOUD_EXPIRED= 2592000
echo "ALL_EXPIRED=${ALL_EXPIRED}">>.env.staging
echo "CHAT_EXPIRED=${CHAT_EXPIRED}">>.env.staging
echo "CHANNEL_EXPIRED=${CHANNEL_EXPIRED}">>.env.staging
echo "LOGIN_EXPIRED=${LOGIN_EXPIRED}">>.env.staging
echo "CLOUD_EXPIRED=${CLOUD_EXPIRED}">>.env.staging

# 15 minutes
REGISTER_2FA_EXPIRED=900
EMAIL_VERIFY_EXPIRED=900
CONFIRM_EXPIRED=900
TURN_ON_2FA_EXPIRED=900
echo "REGISTER_2FA_EXPIRED=${REGISTER_2FA_EXPIRED}">>.env.staging
echo "EMAIL_VERIFY_EXPIRED=${EMAIL_VERIFY_EXPIRED}">>.env.staging
echo "CONFIRM_EXPIRED=${CONFIRM_EXPIRED}">>.env.staging
echo "TURN_ON_2FA_EXPIRED=${TURN_ON_2FA_EXPIRED}">>.env.staging

#refresh cache time 5 minutes
REFRESH_CACHE=300
echo "REFRESH_CACHE=${REFRESH_CACHE}">>.env.staging

#redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USERNAME=cnm
REDIS_PASSWORD=secret
echo "REDIS_HOST=${REDIS_HOST}">>.env.staging
echo "REDIS_PORT=${REDIS_PORT}">>.env.staging
echo "REDIS_USERNAME=${REDIS_USERNAME}">>.env.staging
echo "REDIS_PASSWORD=${REDIS_PASSWORD}">>.env.staging

#MAIL
MAIL_HOST=smtp.gmail.com
MAIL_USER=longnguyendev2020@gmail.com
MAIL_PASSWORD=qymsdzttjinqkobg
MAIL_FROM=${MAIL_USER}
MAIL_TRANSPORT=smtp://${MAIL_USER}:${MAIL_PASSWORD}@${MAIL_HOST}
echo "MAIL_HOST=${MAIL_HOST}">>.env.staging
echo "MAIL_USER=${MAIL_USER}">>.env.staging
echo "MAIL_PASSWORD=${MAIL_PASSWORD}">>.env.staging
echo "MAIL_FROM=${MAIL_FROM}">>.env.staging
echo "MAIL_TRANSPORT=${MAIL_TRANSPORT}">>.env.staging


