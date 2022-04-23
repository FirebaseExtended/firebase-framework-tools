# TODO don't run all this if firebase-tools already exists
npm run clean:dev &&
    export FIREBASE_FRAMEWORKS_TARBALL=$(pwd)/$(npm pack .) &&
    npm i -g firebase-tools &&
    cd $(npm root -g)/firebase-tools &&
    npm i --save --force $FIREBASE_FRAMEWORKS_TARBALL &&
    cd $(pwd)