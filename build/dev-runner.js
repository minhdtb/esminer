let exec = require('child_process').exec;
let config = require('../config');

let kill = require('tree-kill');

let YELLOW = '\x1b[33m';
let BLUE = '\x1b[34m';
let END = '\x1b[0m';

function format(command, data, color) {
    return color + command + END +
        '  ' + String(data).trim().replace(/\n/g, '\n' + repeat(' ', command.length + 2)) + '\n'
}

function repeat(str, times) {
    return (new Array(times + 1)).join(str)
}

let children = [];

function run(command, color) {
    let child = exec(command);

    child.stdout.on('data', function (data) {
        console.log(format(command.split(' ')[2], data, color))
    });

    child.stderr.on('data', function (data) {
        console.error(format(command.split(' ')[2], data, color))
    });

    child.on('exit', function (code) {
        exit(code)
    });

    children.push(child)
}

function exit() {
    children.forEach(function (child) {
        kill(child.pid)
    })
}

run('npm run dev:server', YELLOW);
run('npm run dev:client -- ' + config.build.outputRoot, BLUE);
