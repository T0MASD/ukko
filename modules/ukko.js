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
  // loop over ["list/list-id","jira/proj/123"]
  for (const label of labels) {
    let labelName = ''
    // loop over ["jira", "proj", "123"]
    for (const subLabel of label.split('/')) {
      // make labels jira jira/proj jira/proj/123
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
  const teamArr = ['flast']
  const messageSubject = message.getSubject() ? message.getSubject() : ''
  const messageFrom = message.getFrom() ? message.getFrom() : ''
  // run regex match
  const messageEmail = getReMatch('email', messageFrom.trim())
  let messageFromFQDN = ''; let messageFromDomain = ''; let messageFromUsername = ''
  if (messageEmail && messageEmail.includes('@') && messageEmail.includes('.')) {
    messageFromFQDN = messageEmail.split('@')[1]
    messageFromDomain = messageFromFQDN.split('.').reverse()[1]
    messageFromUsername = messageEmail.split('@')[0]
  }

  // process @github.com
  if (messageFrom.includes('@github.com')) {
    labels.push('github')
  }
  if (messageFrom.includes('@docs.google.com')) {
    labels.push('gdrive')
  }
  // calendar
  if (message.getHeader('Sender') && message.getHeader('Sender').includes('calendar-notification@google.com')) {
    labels.push('calendar')
  }
  // process errata@domain.com
  if (messageFrom.includes('errata@')) {
    labels.push('errata')
  }
  // process team
  if (teamArr.includes(messageFromUsername)) {
    labels.push(`team/${messageFromUsername}`)
  }
  // process jira
  if (messageFrom.includes('issues@')) {
    let label = 'jira'
    // extract 'PROJ' from '...(PROJ-123)...'
    const jiraProj = getReMatch('jiraproj', messageSubject)
    if (jiraProj) {
      label += `/${jiraProj}`
    }
    labels.push(label)
  }
  // process bugzilla
  if (messageFrom.includes('bugzilla@')) {
    let label = 'bz'
    if (message.getHeader('X-Bugzilla-Product')) {
      const bzProdHeader = message.getHeader('X-Bugzilla-Product')
      let bzProd
      if (bzProdHeader.split(' ').length > 1) {
        // create acronym
        bzProd = getReMatch('acronym', bzProdHeader)
      } else {
        bzProd = bzProdHeader
      }
      label += `/${bzProd}`
      if (message.getHeader('X-Bugzilla-Component')) {
        const bzComponent = message.getHeader('X-Bugzilla-Component')
        label += `/${bzComponent}`
      }
    }
    labels.push(label)
  }
  // process gitlab notifications
  if (message.getHeader('X-GitLab-Project')) {
    labels.push(`gitlab/${message.getHeader('X-GitLab-Project')}`)
    // don't want process mailing lists after gitlab
    return labels
  }
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
  // end
  return labels
}

function getReMatch (kind, myStr) {
  let re
  switch (kind) {
    case 'jiraproj':
      re = /\((\w+[^-])-\d+\)/i
      break
    case 'email':
      re = /[^@<\s]+@[^@\s>]+/gi
      break
    case 'listid':
      re = /<([^.]+).+>/i
      break
    case 'acronym':
      re = /\b(\w)/g
      return myStr.match(re).join('')
  }
  if (myStr.match(re)) {
    return myStr.match(re).pop()
  }
}

// END

// line below used for testing ukko locally
// when running on google script engine
// EXCLUDE LINE BELOW
export { runUkko, getLabels, getReMatch, assignLabels }
