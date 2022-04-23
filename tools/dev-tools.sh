# TODO don't run all this if firebase-tools already exists
npm run clean:dev &&
    export FIREBASE_FRAMEWORKS_TARBALL=$(pwd)/$(npm pack .) &&
    tar -xf $(npm pack firebase-tools) &&
    mv package firebase-tools &&
    cd firebase-tools &&
    npm i --save --force --ignore-scripts $FIREBASE_FRAMEWORKS_TARBALL &&
    npm install --ignore-scripts --force -g . &&
    cd ..
