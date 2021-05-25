# ukko

**manage your gmail using google apps script**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![node workflow](https://github.com/T0MASD/ukko/actions/workflows/node.js.yml/badge.svg)


- [ukko](#ukko)
- [Using on google drive](#using-on-google-drive)
- [Setting up scheduled execution](#setting-up-scheduled-execution)
- [Developing and testing locally](#developing-and-testing-locally)
  - [Install javascript dependencies](#install-javascript-dependencies)
  - [Run tests](#run-tests)
  - [Run lint](#run-lint)
  - [Run Ukko](#run-ukko)
  - [Extending label rules](#extending-label-rules)
  - [Contributions](#contributions)

[Ukko](https://en.wikipedia.org/wiki/Ukko) is a code name for a [google apps script](https://developers.google.com/apps-script) runs on google servers. It can get emails in your inbox or use search, looping over email threads and assigning labels based on the email metadata. It's intended be setup via google drive and have time driven trigger.

# Using on google drive
1. Access your [google drive](https://en.wikipedia.org/wiki/Ukko), click **New** and select ["Google Apps Script"](https://script.google.com/create).
2. Name the project "Ukko" and paste the contents of [modules/ukko.js](https://github.com/T0MASD/ukko/blob/main/modules/ukko.js) , exclude `import` and `export` statements those are used for testing Ukko locally.
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

**NOTE**: To automatically "archive" the thread after labels are applied, uncomment following line in [modules/ukko.js](https://github.com/T0MASD/ukko/blob/main/modules/ukko.js) :
```javascript
if (labels.length) { inboxThread.moveToArchive() }
```
Expect similar output when executing the script in google apps script "execution log":
```shell
from:email@example.com labels:lists/planet-list
from:announce-list@example.com labels:lists/announce-list
from:nothandled@domain labels:

```
# Setting up scheduled execution
1. Click "Clock" icon named "Triggers".
2. Click "Add Trigger".
3. Make sure "runUkko" is selected along with "Interval" at which Ukko runs.
4. Click save and enjoy!

# Developing and testing locally
To try [ukko](https://github.com/T0MASD/ukko) locally you will need [nodejs](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed on your machine.
## Install javascript dependencies
To pull javascirpt dependencies (see package.json) locally run `npm install`:
```shell
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
```shell
[tomas@dev ukko]$ npm run test

> ukko@0.0.1 test /ukko
> mocha

from:announce-list@example.com labels:lists/announce-list/example
from:email@example.com labels:lists/planet-list/example


email filter tests
 get regex tests
   ✓ should return domain
   ✓ should return username
   ✓ should return jira project
   ✓ should return email
   ✓ should return list id
 get labels tests
   ✓ should return list of labels for header named List-Id
   ✓ should return list of labels for emails from @github.com
   ✓ should return list of labels for emails from errata@security.com
   ✓ should return list of labels for emails from team
   ✓ should return list of labels for emails from some@subdomain.domain.com
   ✓ should return list of labels for emails for jira
   ✓ should return list of labels for emails for jira project
   ✓ should return list of labels for emails for bugzilla
   ✓ should return list of labels for emails for bugzilla project
   ✓ should return list of labels for emails for bugzilla project acronym and component
   ✓ should not break with empty headers
 should return list of assigned labels
   ✓ output list of processed emails with labels applied
 run filter tests
from:announce-list@example.com labels:lists/announce-list/example
from:email@example.com labels:lists/planet-list/example
   ✓ output list of processed emails with labels applied


17 passing (45ms)
```

## Run lint
Eslint is used for linting all js code, if you have installed [eslint](https://eslint.org/) globally you can call it directly with `eslint .` *OR* via `npm lint`:
```shell
[tomas@dev ukko]$ npm run lint

> ukko@0.0.1 lint /ukko
> eslint .
```

## Run Ukko
To Ukko locally with mock data call `node .` or `npm start`
```shell
[tomas@dev ukko]$ npm start

> ukko@0.0.1 start /ukko
> node .

from:email@example.com labels:lists/planet-list
from:announce-list@example.com labels:lists/announce-list
```

## Extending label rules
Modify `getLabels` function of [modules/ukko.js](https://github.com/T0MASD/ukko/blob/main/modules/ukko.js) to add your own logic for setting up labels. Few example rules are included with ukko, feel free to change to suit your needs.

Create "catch all" filters for given domain:
```javascript
// process @github.com
if (messageFrom.includes('@github.com')) {
 labels.push('github')
}
```
Here's an sample to extract GitLab project name from header named `X-GitLab-Project` and assign label `gitlab/projectname`:
```javascript
// process gitlab notifications
if (message.getHeader('X-GitLab-Project')) {
 labels.push(`gitlab/${message.getHeader('X-GitLab-Project')}`)
}
```
Here's a sample to assign label from the value of `List-Id` header, in this example extra label is added where sender domain doesn't match `mydomain`:
```javascript
// process mailing lists
if (message.getHeader('List-Id')) {
 // extract my-list from 'My List <my-list.example.com>'
 const listIDshort = getReMatch('listid', message.getHeader('List-Id'))
 let listLabel = 'lists/' + listIDshort
 if (messageFromDomain !== 'mydomain') {
   listLabel += `/${messageFromDomain}`
 }
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
