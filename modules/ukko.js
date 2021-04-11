// Copyright 2021, Tomas Dabašinskas and the Ukko contributors
// SPDX-License-Identifier: MIT

import { GmailApp, Logger } from '../app.js'
// import line used used for testing ukko locally
// when running on google script engine paste
// LINES BELOW

// gmail filter for google script!
// Ukko is a code name for a google script tool accessing gmail
// inbox threads, looping over them and assigning labels based on
// the email metadata. It's intended be setup via google drive
// and have time driven trigger.
//
// https://github.com/T0MASD/ukko#readme

// loop over inboxThreads and process
function runUkko () {
  const result = {}
  const inboxThreads = GmailApp.getInboxThreads()
  for (const inboxThread of inboxThreads) {
    const lastMessage = getLastMessage(inboxThread)
    const labels = assignLabels(lastMessage)

    // uncomment below if you want threads with assigned labels to be archived automatically
    // if (labels.length) { inboxThread.moveToArchive() }

    // prep result
    const from = lastMessage.getFrom()
    result[from] = labels
    Logger.log(`from:${lastMessage.getFrom()} labels:${labels}`)
  }
  return result
}

// process inboxThread
function getLastMessage (inboxThread) {
  // load inboxThread messages
  const messages = inboxThread.getMessages()
  // get last message from the hread
  return messages[messages.length - 1]
}

// assign labels to message thread
function assignLabels (message) {
  // load labels for message
  const labels = getLabels(message)
  // load message inboxThread to add labels to
  const inboxThread = message.getThread()
  // loop over ["list/list-id","jira/ccs/123"]
  for (const label of labels) {
    let labelName = ''
    // loop over ["jira", "ccs", "123"]
    for (const subLabel of label.split('/')) {
      // make labels jira jira/css jira/css/123
      labelName = labelName + (labelName === '' ? '' : '/') + subLabel
      // create label
      const gmailLabel = GmailApp.getUserLabelByName(labelName)
        ? GmailApp.getUserLabelByName(labelName)
        : GmailApp.createLabel(labelName)
      gmailLabel.addToThread(inboxThread)
    }
  }
  return labels
}

function getLabels (message) {
  const labels = []
  // process @github.com
  if (message.getFrom().includes('@github.com')) {
    labels.push('github')
  }
  // process gitlab notifications
  if (message.getHeader('X-GitLab-Project')) {
    const listLabel = 'gitlab/' + message.getHeader('X-GitLab-Project')
    labels.push(listLabel)
  }
  // process mailing lists
  if (message.getHeader('List-Id')) {
    // extract my-list from 'My List <my-list.example.com>'
    const listIDshort = message.getHeader('List-Id').match(/<([^.]+).+>/).pop()
    const listLabel = 'lists/' + listIDshort
    labels.push(listLabel)
  }
  // end
  return labels
}

// END

// line below used for testing ukko locally
// when running on google script engine
// EXCLUDE LINE BELOW
export { runUkko, getLabels, assignLabels }
