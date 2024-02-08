#! /bin/bash

set -eu

echo "Parsing resources to be signed"
RESOURCES="$(yq '.Resources.* | select(has("Type") and .Type == "AWS::Serverless::Function") | path | .[1]' "$TEMPLATE_FILE" | xargs)"
read -ra LIST <<< "$RESOURCES"

# Construct the signing-profiles argument list
# e.g.: (HelloWorldFunction1="signing-profile-name" HelloWorldFunction2="signing-profile-name")
PROFILES=("${LIST[@]/%/="$SIGNING_PROFILE"}")

echo "Packaging SAM app"
if [ "${#PROFILES[@]}" -eq 0 ]
then
  echo "No resources that require signing found"
  sam package --s3-bucket="$ARTIFACT_BUCKET" --output-template-file=cf-template.yaml --region "$AWS_REGION"
else
  sam package --s3-bucket="$ARTIFACT_BUCKET" --output-template-file=cf-template.yaml --region "$AWS_REGION" --signing-profiles "${PROFILES[*]}"
fi

# This only gets set if there is a tag on the current commit.
GIT_TAG=$(git describe --tags --first-parent --always)
# Cleaning the commit message to remove special characters
COMMIT_MSG=$(echo $COMMIT_MESSAGE | tr '\n' ' ' | tr -dc '[:alnum:]- ' | cut -c1-50)

echo "Writing Lambda provenance"
yq '.Resources.* | select(has("Type") and .Type == "AWS::Serverless::Function") | .Properties.CodeUri' cf-template.yaml \
    | xargs -L1 -I{} aws s3 cp "{}" "{}" --metadata "repository=$GITHUB_REPOSITORY,commitsha=$GITHUB_SHA,committag=$GIT_TAG,commitmessage=$COMMIT_MSG,release=$VERSION_NUMBER"

echo "Zipping the CloudFormation template"
zip template.zip cf-template.yaml

echo "Uploading zipped CloudFormation artifact to S3"
aws s3 cp template.zip "s3://$ARTIFACT_BUCKET/template.zip" --metadata "repository=$GITHUB_REPOSITORY,commitsha=$GITHUB_SHA,committag=$GIT_TAG,commitmessage=$COMMIT_MSG,release=$VERSION_NUMBER,codepipeline-artifact-revision-summary=$VERSION_NUMBER"