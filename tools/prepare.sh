SHORT_SHA=$(git rev-parse --short $GITHUB_SHA)
TAG_TEST="^refs/tags/[^\@]+\@.+$"
LATEST_TEST="^[^\@]+\@[^-]+$"

if [[ $GITHUB_REF =~ $TAG_TEST ]]; then
    OVERRIDE_VERSION=${GITHUB_REF/refs\/tags\//}
    if [[ $OVERRIDE_VERSION =~ $LATEST_TEST ]]; then
        NPM_TAG=latest
    else
        NPM_TAG=next
    fi;
else
    NPM_TAG=canary
fi;

npm run build:changed &&
    for workspace in ./packages/* ; do
        if [[ $NPM_TAG == "canary" ]]; then
            OVERRIDE_VERSION=$(node -e "console.log(require('$workspace/package.json').version)")-canary.$SHORT_SHA
        fi;
        npm --prefix $workspace --no-git-tag-version --allow-same-version -f version $OVERRIDE_VERSION &&
        echo "npm publish $workspace --tag $NPM_TAG" > $workspace/dist/publish.sh &&
        chmod +x $workspace/dist/publish.sh &&
        cd dist &&
        npm pack ../$workspace
    done
