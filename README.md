# ukko

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
 ### apply gmail labels using google script

[Ukko](https://github.com/T0MASD/ukko/blob/main/modules/ukko.js) is a code name for a [google script](https://developers.google.com/apps-script) tool accessing gmail inbox threads, looping over them and assigning labels based on the email metadata. It's intended be setup via google drive and have time driven trigger.


# Using on google drive
1. Access your [google drive](https://en.wikipedia.org/wiki/Ukko), click **New** and select ["Google Apps Script"](https://script.google.com/create).
2. Name the project "Ukko" and paste the contents of [ukko.js](https://github.com/T0MASD/ukko/blob/main/modules/ukko.js), exclude `import` and `export` statements those are used for testing Ukko locally.
3. Click "Run" icon at the top of the editor, you will be prompted to grant access to your gmail.
4. If there are any messages in your inbox that have header "List-Id" it will create and assign labels.

**NOTE**: 
- Missing labels are created automatically.
- Feel free to delete labels in gmail at any time, they won't be recreated until matching email is processed by Ukko.
- Labels separated by "/" are nested.
- Threads are assigned all labels in the nested chain, for label "lists/my-list/company", following are assigned:
  - "lists"
  - "lists/my-list"
  - "lists/my-list/company" 
- Labelled threads are shown at all nesting levels.

**NOTE**: To automatically "archive" the thread after labels are applied, uncomment following line in [ukko.js](https://github.com/T0MASD/ukko/blob/main/modules/ukko.js):
```
if (labels.length) { inboxThread.moveToArchive() }
```
Expect similar output:
```
from:email@example.com labels:lists/planet-list
from:announce-list@example.com labels:lists/announce-list
from:nothandled@domain labels:

```
# Setting up scheduled execution
1. Click "Clock" icon named "Triggers".
2. Click "Add Trigger".
3. Make sure "runUkko" is selected along with "Interval" at which Ukko runs.
4. Click save and enjoy!

# Testing locally
To try locally you will need [nodejs](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed on your machine.
## Install dependencies
Pull dependencies (see package.json) locally to `node_modules` dir (feel free to delete it and run `npm install` any time):
```
[tomas@dev ukko]$ npm install
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@2.3.2 (node_modules/fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.3.2: wanted {"os":"darwin","arch":"any"} (current: {"os":"linux","arch":"x64"})

added 274 packages from 145 contributors and audited 275 packages in 8.068s

56 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

## Run tests
Mocha is used for testing, if you have installed [mocha](https://www.npmjs.com/package/mocha) globally  you can call it directly with `mocha`, *OR* via `npm test`:
```
[tomas@dev ukko]$ npm test

> ukko@0.0.1 test /home/tomas/ukko
> mocha



  email filter tests
    get labels tests
      ✓ should return list of labels for header named List-Id
      ✓ should return list of labels for emails from @github.com
    run filter tests
from:email@example.com labels:lists/planet-list
from:announce-list@example.com labels:lists/announce-list
      ✓ output list of processed emails with labels applied


  3 passing (17ms)
```

## Run lint
Eslint is used for linting all js code, if you have installed [eslint](https://eslint.org/) globally you can call it directly with `eslint .` *OR* via `npm lint`:
```
[tomas@dev ukko]$ npm run lint

> ukko@0.0.1 lint /home/tomas/ukko
> eslint .
```

## Run Ukko
To Ukko locally with mock data call `node .` or `npm start`
```
[tomas@dev ukko]$ npm start

> ukko@0.0.1 start /home/tomas/ukko
> node .

from:email@example.com labels:lists/planet-list
from:announce-list@example.com labels:lists/announce-list
```

## Extending label rules
Modify `getLabels` function of `modules/ukko.js` to add your own logic for setting up labels.

Create "catch all" filters for given domain:
```
// process @github.com
if (message.getFrom().includes('@github.com')) {
 labels.push('github')
}
```
Here's an sample to extract GitLab project name from header named `X-GitLab-Project` and assign label `gitlab/projectname`:
```
// process gitlab notifications
if (message.getHeader('X-GitLab-Project')) {
 const listLabel = 'gitlab/' + message.getHeader('X-GitLab-Project')
 labels.push(listLabel)
}
```
Here's a sample to assign label from the value of `List-Id` header:
```
// process mailing lists
if (message.getHeader('List-Id')) {
 // extract my-list from 'My List <my-list.example.com>'
 const listIDshort = message.getHeader('List-Id').match(/<([^.]+).+>/).pop()
 const listLabel = 'lists/' + listIDshort
 labels.push(listLabel)
}
```
## Contributions

- PR are most welcome!
- Please check "issues"
- Read and follow CODE_OF_CONDUCT.md
- Licensed under MIT license
- Clone the repo and [raise a pull request](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request)
- Love and light
