#!/usr/bin/env node
/*!
 * docker-override: v0.1.0
 * Copyright(c) 2016-2018 Javanile.org
 * MIT Licensed
 */

const fu = require('nodejs-fu')
    , path = require('path')
    , homedir = require('os').homedir()
    , configFile = path.join(homedir, '.docker-override.json')
    , files = process.argv.slice(2)

// Check for configuration
if (!fu.fileExists(configFile)) {
    console.log('[ERROR] docker-override: file not found (.docker-override.json)')
    process.exit(1);
}

const configInfo = fu.readJsonFile(configFile)
    , codebasePath = typeof configInfo['codebase'] !== 'undefined' ? configInfo['codebase'] : 'codebase'
    , overridePath = typeof configInfo['override'] !== 'undefined' ? configInfo['override'] : 'override'
    , overrideFile = path.join(overridePath, '.override.json')

fu.mkdir(codebasePath)
fu.mkdir(overridePath)

if (!fu.fileExists(overrideFile)) {
    fu.writeJsonFile(overrideFile, {files: {}})
}
const overrideInfo = fu.readJsonFile(overrideFile)

// Add files
if (files && files.length > 0) {
    for (var i in files) {
        if (files.hasOwnProperty(i)) {
            var codebaseInputFile = path.join(codebasePath, files[i])
            var overrideIntpuFile = path.join(overridePath, files[i])
            if (fu.fileExists(codebaseInputFile) && !fu.fileExists(overrideInputFile)) {
                fu.copy(codebaseInputFile, overrideInputFile)
            }
            overrideInfo.files[files[i]] = 'override'
        }
    }
    fu.writeJsonFile(overrideFile, overrideInfo)
}

// Define override action
function overrideAction(file) {
    var originalInputFile = path.join(codebasePath, file + '.original')
    var codebaseInputFile = path.join(codebasePath, file)
    var overrideIntpuFile = path.join(overridePath, file)
    if (!fu.fileExists(overrideIntpuFile)) { return; }

    if (!fu.fileExists(originalInputFile)) {
        fu.rename(codebaseInputFile, originalInputFile)
    }

    console.log('[ACTION] docker-override: override (' + file + ')')
    switch (path.extname(file)) {
        case 'json': return fu.mergeJsonFile(codebaseInputFile, originalInputFile, overrideIntpuFile)
        default: return fu.copy(overrideIntpuFile, codebaseInputFile)
    }
}

// Loop for files
for (var file in overrideInfo.files) {
    if (overrideInfo.files.hasOwnProperty(file)) {
        switch (overrideInfo.files[file]) {
            case 'override': overrideAction(file); break
        }
    }
}
