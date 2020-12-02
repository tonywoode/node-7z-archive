'use strict';

import when from 'when';
import Files from '../util/files.mjs';
import ReplaceNativeSeparator from '../util/replaceNativeSeparator.mjs';
import Run from '../util/run.mjs';

/**
 * Create/add content to an archive.
 *
 * @param filepath {string} Path to the archive.
 * @param files {string|array} Files to add.
 * @param options {Object} An object of acceptable 7-zip switch options.
 * @param override {boolean} should binary directory change?
 *
 * @resolve {array} Arguments passed to the child-process.
 * @progress {array} Listed files and directories.
 * @reject {Error} The error as issued by 7-Zip.
 *
 * @returns {Promise} Promise
 */
export default function (filepath, files, options, override = false) {
  return when.promise(function (resolve, reject, progress) {
    /**
     * When a stdout is emitted, parse each line and search for a pattern.When
     * the pattern is found, extract the file (or directory) name from it and
     * pass it to an array. Finally returns this array.
     */
    function onprogress(data) {
      let entries = [];
      data.split('\n').forEach(function (line) {
        if (line.substr(0, 1) === '+') {
          entries.push(ReplaceNativeSeparator(line.substr(2, line.length)));
        }
      });
      return entries;
    }

    // Convert array of files into a string if needed.
    files = Files(files);

    // Create a string that can be parsed by `run`.
    let command = 'a "' + filepath + '" ' + files;

    // Start the command
    Run('7z', command, options, override)
      .progress(function (data) {
        return progress(onprogress(data));
      })

      // When all is done resolve the Promise.
      .then(function (args) {
        return resolve(args);
      })

      // Catch the error and pass it to the reject function of the Promise.
      .catch(function (err) {
        return reject(err);
      });
  });
};
