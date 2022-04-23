# TODO don't run all this if firebase-tools already exists
npm run clean:dev &&
    export FIREBASE_FRAMEWORKS_TARBALL=$(pwd)/$(npm pack .) &&
    tar -xf $(npm pack firebase-tools) &&
    mv package firebase-tools &&
    cd firebase-tools &&
    (echo $(cat package.json | jq 'del(.scripts.prepare)') > package.json) &&
    npm i --save --force $FIREBASE_FRAMEWORKS_TARBALL &&
    npm install --force -g . &&
    cd ..
