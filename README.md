# praxis-ide-vscode-community README

This is a companion extension to a fork of [Praxis, a Prolog IDE](https://github.com/toblotron/praxis-ide) from `toblotron`. The fork is maintained by `saviorand`.

## Features

 - Open the live visual preview of the Prolog file you're currently editing
 - Changes in the edited file reflect in the visual editor
 - (To-do): propagate changes made in the visual editor to the currently edited file

## Requirements

 - Install the extension `Live Preview` by Microsoft (required). This is used to run a live preview server that displays the Praxis IDE
 - Your current folder has to be an npm project
 - Run `npm install praxis-ide-saviorand`, this will install the fork of Praxis IDE in the current directory
 - Press `cmd/ctrl + shift + P`, then `Start preview server`
 - Once the server starts, open a prolog file and start editing
 - Press `cmd/ctrl + shift + P`, then `Open preview` to see your Prolog code visualized with Praxis

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release
