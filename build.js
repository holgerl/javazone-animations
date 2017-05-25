"use strict";

var fs = require('fs');
var path = require('path');

function tryUntil(functionTry, functionAcceptsException) {
    let done = false;
    while (!done) {
    	try {
    		functionTry();
    		done = true;
    	} catch (e) {
    		if (!functionAcceptsException(e)) throw e;
    		else console.log("Condition not met, trying again", e.code);
    	}
    }
}

function removeNonEmptyDirectory(directoryPath) {	
	try {
    	var list = fs.readdirSync(directoryPath);
	} catch (e) {
		if (e.code == 'ENOENT' ) { // ENOENT = No such directory exists
			console.log("ENOENT");
			return;
		} else {
			throw e;
		}
	}

    for (var i = 0; i < list.length; i++) {
    	var filename = list[i];
        var filePath = path.join(directoryPath, filename);
        var stat;
		tryUntil(() => {stat = fs.statSync(filePath)}, (e) => e.code === 'EPERM');

        if (filename == "." || filename == "..") {
            // skip these
        } else if (stat.isDirectory()) {
            removeNonEmptyDirectory(filePath);
        } else {
            fs.unlinkSync(filePath);
        }
    }

    var time = new Date().getTime();
    //while (time + 500 > new Date().getTime()) ; // Waiting 500 ms beacuse unlinking files with unlinkSync is not entirely synchronous it appears

    tryUntil(() => fs.rmdirSync(directoryPath), (e) => e.code === 'ENOTEMPTY' || e.code === 'EBUSY');
};

function copyDirectoryRecursiveSync(src, dest) {
	var exists = fs.existsSync(src);
	var stats = exists && fs.statSync(src);
	var isDirectory = exists && stats.isDirectory();
	if (exists && isDirectory) {
		if (!fs.existsSync(dest)){
			fs.mkdirSync(dest);
		}

		fs.readdirSync(src).forEach(function(childItemName) {
			copyDirectoryRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
		});
	} else {
		//console.log("LINK ", src, dest)
		try {
			fs.linkSync(src, dest);
		} catch (e) {
			if (e.code != 'EEXIST' ) { // EEXIST = file already exists
				throw e;
			}
		};
	}
};

function buildDirectory(directoryPath) {
	var list = fs.readdirSync(directoryPath);

	for (var i=0; i < list.length; i++) {
		var filename = list[i];
		console.log("Considering", filename);
		var filePath = directoryPath + "/" + filename;
		var isDir = fs.lstatSync(filePath).isDirectory();
		var extension = path.extname(filename);

		if (!isDir && (extension == ".html" || extension == ".htm" || extension == ".js")) {
			console.log("Building", filename);
			buildFile(filePath);
		} else if (isDir && filename != ".git" && filename != "built") {
			console.log("Copying directory", filename);
			copyDirectoryRecursiveSync(filename, "built/" + filename);
		}
		//console.log("\n");
	}
}

function buildFile(filePath) {
	var replaceRegex = /\${([^}]*)}/g;

	var contents = fs.readFileSync(filePath, 'utf8');

	var replacedContents = contents.replace(replaceRegex, function(match, group1) {
		var filename = group1;
		try {
			var toBeInserted = fs.readFileSync(filename, 'utf8');
			console.log("Inserting", filename);
			return toBeInserted
		} catch (e) {
			if (e.code == 'ENOENT' ) { // ENOENT = No such file exists
				return group1;
			} else {
				throw e;
			}
		};
	});

	var outPath = "./built/" + filePath

	console.log("Writing result to", outPath);

	fs.writeFileSync(outPath, replacedContents, 'utf8');
}

function build(repeat) {
	try {
		console.log("BUILD STARTING");
		removeNonEmptyDirectory("built");
		console.log("BUILT DIR REMOVED");
    	tryUntil(() => fs.mkdirSync("built"), (e) => e.code === 'EPERM');
		console.log("BUILT DIR MADE");
		buildDirectory("./");
		console.log("BUILD DONE " + new Date());
		console.log("----");
	} catch (e) {
		console.error(e);
		console.error(e.stack)
	}
	
	if (repeat) setTimeout(() => build(repeat), 1000);
}

fs.watch('.', function (event, filename) {
	if (!filename || filename.indexOf("built") !== -1 || filename.indexOf(".git") !== -1) return;
    
    console.log('event is: ' + event + ' filename provided: ' + filename);
	
	build();
});

//build(true);