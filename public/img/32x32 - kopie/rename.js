const fs = require('fs');
const path = require('path');

fs.readdir('./', (err, files) => {
    if(err) console.error(err);

    files.forEach((file, index) => {
        if(file == 'rename.js') return;

        let p = path.resolve(`./${file}`);
        let id = file.split('[').join().split(']')[2];
        fs.rename(p, path.resolve(`./${id}`), e => {
            if(e) console.error(e);
        });
    });
});